<?php
declare(strict_types=1);

require_once __DIR__ . '/fetch-article.php';

function dash_admin_post_keyword_attach(PDO $bdd, string $hashPost, string $keywordName): void
{
    $hashPost = trim($hashPost);
    $keywordName = strtolower(trim($keywordName));
    if ($hashPost === '' || $keywordName === '' || $keywordName === 'ajouter un mot-clé') {
        return;
    }

    $find = $bdd->prepare('SELECT id_keyword FROM keyword WHERE name_keyword = ? LIMIT 1');
    $find->execute([$keywordName]);
    $keywordId = $find->fetchColumn();

    if ($keywordId === false) {
        $bdd->prepare('INSERT INTO keyword(name_keyword) VALUES(?)')->execute([$keywordName]);
        $keywordId = (int) $bdd->lastInsertId();
    } else {
        $keywordId = (int) $keywordId;
    }

    $check = $bdd->prepare('SELECT 1 FROM post_keyword WHERE hash_post = ? AND id_keyword = ? LIMIT 1');
    $check->execute([$hashPost, $keywordId]);
    if ($check->fetchColumn() === false) {
        $bdd->prepare('INSERT INTO post_keyword(hash_post, id_keyword) VALUES(?, ?)')->execute([$hashPost, $keywordId]);
    }
}

function dash_admin_link_author_post_if_known(PDO $bdd, array $post): void
{
    $authorName = (string) ($post['author'] ?? '');
    if ($authorName === '' || $authorName === 'Auteur inconnu') {
        return;
    }

    $link = (string) ($post['link'] ?? '');
    if ($link === '') {
        return;
    }

    $findAuthor = $bdd->prepare('SELECT id FROM authors WHERE name = ? LIMIT 1');
    $findAuthor->execute([$authorName]);
    $author = $findAuthor->fetch(PDO::FETCH_ASSOC);
    if (!$author) {
        return;
    }

    $check = $bdd->prepare('SELECT 1 FROM authors_posts WHERE link = ? LIMIT 1');
    $check->execute([$link]);
    if ($check->fetchColumn() !== false) {
        return;
    }

    $title = nettoyerTexteAvance((string) ($post['title'] ?? ''));
    $insert = $bdd->prepare('INSERT INTO authors_posts(id_author, title, link, source, date) VALUES(?,?,?,?,?)');
    $insert->execute([
        (int) $author['id'],
        htmlspecialchars($title, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($link, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars((string) ($post['source'] ?? ''), ENT_QUOTES, 'UTF-8'),
        $post['date'] ?? date('Y-m-d H:i:s'),
    ]);
}

function dash_admin_rss_post_set_author(PDO $bdd, int $postId, string $authorName): bool
{
    if ($postId < 1 || $authorName === '') {
        return false;
    }

    $stmt = $bdd->prepare('UPDATE rss_post SET author = :author WHERE id = :id');
    $stmt->execute([
        'author' => htmlspecialchars($authorName, ENT_QUOTES, 'UTF-8'),
        'id' => $postId,
    ]);

    return $stmt->rowCount() > 0;
}
