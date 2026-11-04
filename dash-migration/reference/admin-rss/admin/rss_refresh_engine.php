<?php
/**
 * Moteur unique d’ingestion RSS (SimplePie + PDO).
 * Utilisé par refresh_rss.php (interface) et cron.php (CLI).
 */

declare(strict_types=1);

/**
 * Nombre minimum d’identifiants de mots-clés distincts pour garder l’article au flux.
 * (Avant : au moins 2 « occurrences » pouvaient être le même thème via nom + alias.)
 * Ajuster à 2 si le flux devient trop peu fourni.
 */
const RSS_MIN_DISTINCT_KEYWORDS = 3;

/** Articles plus vieux que ce délai sont retirés, corbeille comprise. */
const RSS_KEEP_DAYS = 38;

/**
 * Retire les articles (et leurs mots-clés) plus vieux que $days jours.
 * Par lots, pour ne pas bloquer le fil pendant le premier grand ménage.
 */
function rss_refresh_delete_older_than(PDO $bdd, int $days): int
{
    if ($days < 1) {
        return 0;
    }

    $select = $bdd->prepare('SELECT hash FROM rss_post WHERE date < DATE_SUB(NOW(), INTERVAL ? DAY) LIMIT 2000');
    $removed = 0;

    do {
        $select->execute([$days]);
        $hashes = $select->fetchAll(PDO::FETCH_COLUMN);
        if ($hashes === []) {
            break;
        }

        $placeholders = implode(',', array_fill(0, count($hashes), '?'));
        $delKw = $bdd->prepare('DELETE FROM post_keyword WHERE hash_post IN (' . $placeholders . ')');
        $delKw->execute($hashes);
        $delPost = $bdd->prepare('DELETE FROM rss_post WHERE hash IN (' . $placeholders . ')');
        $delPost->execute($hashes);
        $removed += $delPost->rowCount();
    } while (count($hashes) === 2000);

    return $removed;
}

/**
 * @return array{
 *   0: list<array{url:string,name:string,audience?:string,theme?:?string}>,
 *   1: array<string,string>,
 *   2: array<string,string>,
 *   3: array<string,string>
 * }
 */
function rss_refresh_load_rss_url_map(PDO $bdd): array
{
    $rss_urls = $bdd->query(
        'SELECT url, name, audience, theme FROM rss_url'
    )->fetchAll(PDO::FETCH_ASSOC);
    $map = [];
    $audienceByUrl = [];
    $themeByUrl = [];
    foreach ($rss_urls as $row) {
        $url = (string) ($row['url'] ?? '');
        if ($url === '') {
            continue;
        }
        $map[$url] = (string) ($row['name'] ?? '');
        $audienceByUrl[$url] = ((string) ($row['audience'] ?? 'editorial')) === 'vigie'
            ? 'vigie'
            : 'editorial';
        $theme = trim((string) ($row['theme'] ?? ''));
        if ($theme !== '') {
            $themeByUrl[$url] = $theme;
        }
    }
    return [$rss_urls, $map, $audienceByUrl, $themeByUrl];
}

/**
 * Mots-clés principaux + alias (tables keyword / alias / keyword_alias)
 * + alias issus de la colonne legacy keyword.alias_keyword si elle existe.
 *
 * @return array{keywords: list<array{id_keyword:int,name_keyword:string}>, aliases: list<array{id_keyword:int,name_alias:string}>}
 */
function rss_refresh_load_keywords(PDO $bdd): array
{
    $keywords = $bdd->query('SELECT id_keyword, name_keyword FROM keyword')->fetchAll(PDO::FETCH_ASSOC);

    $aliases = $bdd->query('
        SELECT keyword.id_keyword, alias.name_alias
        FROM keyword
        INNER JOIN keyword_alias ON keyword.id_keyword = keyword_alias.id_keyword
        INNER JOIN alias ON alias.id_alias = keyword_alias.id_alias
    ')->fetchAll(PDO::FETCH_ASSOC);

    try {
        $legacyStmt = $bdd->query(
            "SELECT id_keyword, alias_keyword FROM keyword
             WHERE alias_keyword IS NOT NULL AND TRIM(alias_keyword) <> ''"
        );
        while ($row = $legacyStmt->fetch(PDO::FETCH_ASSOC)) {
            foreach (explode(',', (string) $row['alias_keyword']) as $part) {
                $part = trim($part);
                if ($part !== '') {
                    $aliases[] = [
                        'id_keyword' => (int) $row['id_keyword'],
                        'name_alias' => $part,
                    ];
                }
            }
        }
    } catch (Throwable $e) {
        // Colonne alias_keyword absente ou autre erreur : ignorer.
    }

    return ['keywords' => $keywords, 'aliases' => $aliases];
}

/**
 * Associe les mots-clés / alias à un article ; corbeille si pas assez de thèmes distincts.
 */
function rss_refresh_attach_keywords(
    string $hash,
    string $title,
    string $text,
    array $kwData,
    PDOStatement $ins_post_keyword,
    PDOStatement $upd_trash_low_kw,
    bool $skipTrashThreshold = false
): void {
    $haystack = $title . ' ' . $text;
    $matchedKeywordIds = [];

    foreach ($kwData['keywords'] as $kw) {
        $id = (int) $kw['id_keyword'];
        if (dash_admin_keyword_match_in_text($haystack, (string) $kw['name_keyword'])) {
            $matchedKeywordIds[$id] = true;
            $ins_post_keyword->execute([$hash, $id]);
        }
    }

    foreach ($kwData['aliases'] as $al) {
        $id = (int) $al['id_keyword'];
        if (dash_admin_keyword_match_in_text($haystack, (string) $al['name_alias'])) {
            $matchedKeywordIds[$id] = true;
            $ins_post_keyword->execute([$hash, $id]);
        }
    }

    // Flux Vigie (infos générales) : ne pas corbeiller faute de mots-clés éditoriaux.
    if ($skipTrashThreshold) {
        return;
    }

    if (count($matchedKeywordIds) < RSS_MIN_DISTINCT_KEYWORDS) {
        $upd_trash_low_kw->execute([$hash]);
    }
}

/**
 * @param array{
 *   delete_older_than_days?: int|null,
 *   delete_stale_bin_unsent?: bool,
 *   progress?: bool,
 * } $options
 *
 * @return int nombre d’items parcourus dans le flux
 */
function rss_refresh_process_items(
    PDO $bdd,
    SimplePie $feed,
    array $rss_url_map,
    array $kwData,
    array $options = [],
    array $audienceByUrl = []
): int {
    $deleteOlderDays = array_key_exists('delete_older_than_days', $options)
        ? $options['delete_older_than_days']
        : null;
    $deleteStaleBin = !empty($options['delete_stale_bin_unsent']);
    $progress = !empty($options['progress']);
    $skipMarkBin = !empty($options['skip_mark_bin']);
    if ($audienceByUrl === [] && isset($options['audience_by_url']) && is_array($options['audience_by_url'])) {
        $audienceByUrl = $options['audience_by_url'];
    }
    $themeByUrl = [];
    if (isset($options['theme_by_url']) && is_array($options['theme_by_url'])) {
        $themeByUrl = $options['theme_by_url'];
    }

    $upd_progress = $bdd->prepare('UPDATE refresh_rss SET current = ? WHERE id = 1');
    $ins_post_keyword = $bdd->prepare('INSERT IGNORE INTO post_keyword (hash_post, id_keyword) VALUES (?, ?)');
    $upd_trash_low_kw = $bdd->prepare('UPDATE rss_post SET new = 0, deleted = 1 WHERE hash = ?');
    $upd_bin_clear = $bdd->prepare('UPDATE rss_post SET bin = 0 WHERE hash = ?');
    $count_by_hash = $bdd->prepare('SELECT COUNT(*) FROM rss_post WHERE hash = ?');
    $insert_rss = $bdd->prepare('
        INSERT INTO rss_post (date, source, title, text, author, link, hash, new, bin, sent)
        VALUES (:date, :source, :title, :text, :author, :link, :hash, 1, 0, 0)
    ');

    if (!$skipMarkBin) {
        $markBinStmt = $bdd->prepare('UPDATE rss_post SET bin = 1 WHERE new = 1');
        $markBinStmt->execute();
    }

    $items = $feed->get_items();
    $num_items = count($items);
    $vigiePushed = [];
    $item_idx = 0;

    foreach ($items as $item) {
        $item_idx++;

        if ($item_idx === 1 || $item_idx % 50 === 0 || $item_idx === $num_items) {
            if ($progress) {
                $upd_progress->execute([$item_idx]);
            }
            dash_admin_refresh_rss_touch_activity($bdd);
        }

        $hash = $item->get_id(true);
        $date = $item->get_date('U') ? date('Y-m-d H:i:s', (int) $item->get_date('U')) : date('Y-m-d H:i:s');
        $current_feed = $item->get_feed();
        $link = $item->get_permalink();

        if (!$link) {
            continue;
        }

        $count_by_hash->execute([$hash]);
        $exists = (int) $count_by_hash->fetchColumn() > 0;

        if (!$exists) {
            $clean_title = nettoyerTexteAvance($item->get_title());
            $title = mb_substr($clean_title, 0, 255);
            $clean_text = nettoyerTexteAvance(dash_admin_rss_item_plain_text($item));
            $text = mb_substr($clean_text, 0, 14999);

            $author_obj = $item->get_author();
            $author = $author_obj
                ? (mb_convert_encoding($author_obj->get_name() ?? 'Auteur inconnu', 'UTF-8', 'UTF-8') ?: 'Auteur inconnu')
                : 'Auteur inconnu';

            $feed_url_key = htmlspecialchars_decode($current_feed->subscribe_url(), ENT_QUOTES);
            $source = $rss_url_map[$feed_url_key]
                ?? html_entity_decode((string) $current_feed->get_title(), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $isVigie = (($audienceByUrl[$feed_url_key] ?? 'editorial') === 'vigie');

            if (estArticlePublicitaire($title, $text) || estArticleFluxBruit($title, $text)) {
                continue;
            }

            try {
                $insert_rss->execute([
                    'date' => $date,
                    'source' => $source,
                    'title' => $title,
                    'text' => $text,
                    'author' => $author,
                    'link' => $link,
                    'hash' => $hash,
                ]);

                if ($isVigie) {
                    $themeKey = (string) ($themeByUrl[$feed_url_key] ?? '');
                    $themeLabel = function_exists('dash_admin_rss_theme_label')
                        ? dash_admin_rss_theme_label($themeKey)
                        : $themeKey;
                    $journal = function_exists('dash_admin_rss_journal_from_source')
                        ? dash_admin_rss_journal_from_source($source)
                        : $source;
                    $facts = [
                        'theme' => $themeLabel,
                        'label' => $journal,
                        'date' => $date,
                        'link' => $link,
                    ];
                    if ($author !== '' && strcasecmp($author, 'Auteur inconnu') !== 0) {
                        $facts['actor'] = $author;
                    }
                    $vigiePushed[] = [
                        'title' => $title,
                        'body' => mb_substr($text, 0, 4000),
                        'facts' => $facts,
                        'fingerprint' => 'dash:' . $hash,
                    ];
                }

                rss_refresh_attach_keywords(
                    $hash,
                    $title,
                    $text,
                    $kwData,
                    $ins_post_keyword,
                    $upd_trash_low_kw,
                    $isVigie
                );
            } catch (Throwable $e) {
                error_log('[rss_refresh_engine] Insertion rss_post refusée : ' . $e->getMessage());
                continue;
            }
        } else {
            $upd_bin_clear->execute([$hash]);
        }
    }

    if ($deleteOlderDays !== null && $deleteOlderDays > 0) {
        rss_refresh_delete_older_than($bdd, $deleteOlderDays);
    }

    if ($deleteStaleBin) {
        $bdd->prepare('
            DELETE pk FROM post_keyword pk
            INNER JOIN rss_post r ON r.hash = pk.hash_post
            WHERE r.bin = 1 AND r.sent = 0 AND r.deleted = 0
        ')->execute();
        $bdd->prepare('DELETE FROM rss_post WHERE bin = 1 AND sent = 0 AND deleted = 0')->execute();
    }

    if ($vigiePushed) {
        require_once __DIR__ . '/inc/vigie_ingress.php';
        vigie_ingress_push_infos($vigiePushed);
    }

    return $num_items;
}
