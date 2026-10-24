<?php
declare(strict_types=1);

/**
 * @param list<array<string, mixed>> $articles
 * @return array{
 *   nb_comments_map: array<int, int>,
 *   nb_favorites_map: array<int, int>,
 *   is_favorite_set: array<int, true>,
 *   is_selected_set: array<int, true>,
 *   is_archived_set: array<string, true>,
 *   keywords_by_hash: array<string, list<array<string, mixed>>>,
 *   authors_by_name: array<string, array{name: string, id: int}>,
 *   comments_by_post: array<int, list<array<string, mixed>>>,
 *   user_logins: array<int, string>
 * }
 */
function dash_electron_preload_index_posts(PDO $bdd, PDO $bdd_admin, array $articles, int $userId): array
{
    $nb_comments_map = [];
    $nb_favorites_map = [];
    $is_favorite_set = [];
    $is_selected_set = [];
    $is_archived_set = [];
    $keywords_by_hash = [];
    $authors_by_name = [];
    $comments_by_post = [];
    $user_logins = [];

    if ($articles === []) {
        return compact(
            'nb_comments_map', 'nb_favorites_map', 'is_favorite_set', 'is_selected_set',
            'is_archived_set', 'keywords_by_hash', 'authors_by_name', 'comments_by_post', 'user_logins'
        );
    }

    $ids = array_map('intval', array_column($articles, 'id_post'));
    $hashes = array_values(array_unique(array_column($articles, 'hash')));

    if ($ids !== []) {
        $ph_ids = implode(',', array_fill(0, count($ids), '?'));

        $stmt = $bdd->prepare("SELECT id_post, COUNT(*) AS c FROM comments WHERE id_post IN ($ph_ids) GROUP BY id_post");
        $stmt->execute($ids);
        foreach ($stmt as $row) {
            $nb_comments_map[(int) $row['id_post']] = (int) $row['c'];
        }

        $stmt = $bdd->prepare("SELECT id_post, COUNT(*) AS c FROM favorites WHERE id_post IN ($ph_ids) GROUP BY id_post");
        $stmt->execute($ids);
        foreach ($stmt as $row) {
            $nb_favorites_map[(int) $row['id_post']] = (int) $row['c'];
        }

        $params = array_merge([$userId], $ids);
        $stmt = $bdd->prepare("SELECT id_post FROM favorites WHERE id_user = ? AND id_post IN ($ph_ids)");
        $stmt->execute($params);
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $is_favorite_set[(int) $r['id_post']] = true;
        }

        $stmt = $bdd->prepare("SELECT id_post FROM user_post_selection WHERE id_user = ? AND id_post IN ($ph_ids)");
        $stmt->execute($params);
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $is_selected_set[(int) $r['id_post']] = true;
        }

        $stmt = $bdd->prepare(
            "SELECT id, id_post, id_user, text, DATE_FORMAT(date, '%d/%m/%Y %H:%i') AS converted_date
             FROM comments WHERE id_post IN ($ph_ids) ORDER BY date"
        );
        $stmt->execute($ids);
        $commentUserIds = [];
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $postId = (int) $r['id_post'];
            $comments_by_post[$postId][] = $r;
            $commentUserIds[(int) $r['id_user']] = true;
        }

        if ($commentUserIds !== []) {
            $userIds = array_keys($commentUserIds);
            $ph_users = implode(',', array_fill(0, count($userIds), '?'));
            $stmt = $bdd->prepare("SELECT id_user, login_user FROM users WHERE id_user IN ($ph_users)");
            $stmt->execute($userIds);
            while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $user_logins[(int) $r['id_user']] = (string) $r['login_user'];
            }
        }
    }

    if ($hashes !== []) {
        $ph_hashes = implode(',', array_fill(0, count($hashes), '?'));
        $paramsHash = array_merge([$userId], $hashes);
        $stmt = $bdd->prepare("SELECT hash FROM archives WHERE login_user = ? AND hash IN ($ph_hashes)");
        $stmt->execute($paramsHash);
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $is_archived_set[$r['hash']] = true;
        }

        $stmtKeywords = $bdd_admin->prepare(
            'SELECT pk.hash_post, k.id_keyword, k.name_keyword
             FROM post_keyword pk
             JOIN keyword k ON pk.id_keyword = k.id_keyword
             WHERE pk.hash_post IN (' . $ph_hashes . ')'
        );
        $stmtKeywords->execute($hashes);
        foreach ($stmtKeywords as $row) {
            $keywords_by_hash[$row['hash_post']][] = $row;
        }
    }

    $authorNames = array_values(array_unique(array_filter(
        array_column($articles, 'author'),
        static fn($name) => $name !== '' && $name !== 'Auteur inconnu'
    )));
    if ($authorNames !== []) {
        $ph_names = implode(',', array_fill(0, count($authorNames), '?'));
        $stmt = $bdd_admin->prepare("SELECT name, id FROM authors WHERE name IN ($ph_names)");
        $stmt->execute($authorNames);
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $authors_by_name[$r['name']] = ['name' => $r['name'], 'id' => (int) $r['id']];
        }
    }

    return compact(
        'nb_comments_map', 'nb_favorites_map', 'is_favorite_set', 'is_selected_set',
        'is_archived_set', 'keywords_by_hash', 'authors_by_name', 'comments_by_post', 'user_logins'
    );
}
