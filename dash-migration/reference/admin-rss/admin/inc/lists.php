<?php
declare(strict_types=1);

function dash_admin_list_per_page(string $list): int
{
    $limits = [
        'index' => 75,
        'sent' => 75,
        'deleted' => 200,
    ];

    return $limits[$list] ?? 75;
}

/**
 * @return array{page: int, totalPages: int, offset: int, totalRows: int}
 */
function dash_admin_pagination_state(int $page, int $totalRows, int $perPage): array
{
    $totalPages = max(1, (int) ceil($totalRows / max(1, $perPage)));
    $page = min(max(1, $page), $totalPages);

    return [
        'page' => $page,
        'totalPages' => $totalPages,
        'offset' => ($page - 1) * $perPage,
        'totalRows' => $totalRows,
    ];
}

function dash_admin_nav_counts(PDO $bdd): array
{
    require_once __DIR__ . '/rss-filter.php';

    $counts = [
        'new' => dash_admin_rss_count($bdd, dash_admin_rss_editorial_inbox_sql()),
        'sent' => dash_admin_rss_count($bdd, dash_admin_rss_sent_sql()),
        'deleted' => dash_admin_rss_count($bdd, dash_admin_rss_deleted_sql()),
    ];

    try {
        $counts['storify'] = (int) $bdd->query('SELECT COUNT(*) FROM storify')->fetchColumn();
    } catch (Throwable $e) {
        error_log('[dash_admin] COUNT storify : ' . $e->getMessage());
        $counts['storify'] = 0;
    }

    return $counts;
}

/**
 * @return array{new: int, sent: int, deleted: int, storify?: int}
 */
function dash_admin_nav_counts_extended(PDO $bdd, bool $withStorify = false): array
{
    $counts = dash_admin_nav_counts($bdd);
    if (!$withStorify) {
        return $counts;
    }

    try {
        $counts['storify'] = (int) $bdd->query('SELECT COUNT(*) FROM storify')->fetchColumn();
    } catch (Throwable $e) {
        error_log('[dash_admin] COUNT storify : ' . $e->getMessage());
        $counts['storify'] = 0;
    }

    return $counts;
}

/**
 * @return list<int>
 */
function dash_admin_post_ids_from_request(array $post): array
{
    if (empty($post['id_post']) || !is_array($post['id_post'])) {
        return [];
    }

    $ids = [];
    foreach ($post['id_post'] as $id) {
        $n = (int) $id;
        if ($n > 0) {
            $ids[] = $n;
        }
    }

    return $ids;
}

/** @param array{tri?: string, keyword_id?: int, source_name?: string, page?: int} $params */
function dash_admin_index_list_url(array $params = []): string
{
    $q = array_filter([
        'tri' => (isset($params['tri']) && $params['tri'] !== '' && $params['tri'] !== 'date') ? $params['tri'] : null,
        'keyword_id' => !empty($params['keyword_id']) ? (int) $params['keyword_id'] : null,
        'source_name' => (isset($params['source_name']) && $params['source_name'] !== '' && $params['source_name'] !== '%') ? $params['source_name'] : null,
        'page' => isset($params['page']) ? max(1, (int) $params['page']) : null,
    ], static fn ($v) => $v !== null && $v !== '');

    return dash_admin_base_path() . '/index.php' . ($q === [] ? '' : '?' . http_build_query($q));
}

/** ORDER BY pour la liste index admin (date / pertinence / tendance). */
function dash_admin_index_order_sql(string $tri): string
{
    if ($tri === 'pertinence') {
        return 'ORDER BY (
            SELECT COUNT(*)
            FROM post_keyword pk_rel
            WHERE pk_rel.hash_post = r.hash
        ) DESC, r.date DESC, r.id DESC';
    }

    if ($tri === 'tendance') {
        return 'ORDER BY (
            SELECT COALESCE(SUM(kw_trend.cnt), 0)
            FROM post_keyword pk_tr
            INNER JOIN (
                SELECT pk2.id_keyword, COUNT(*) AS cnt
                FROM post_keyword pk2
                INNER JOIN rss_post rp ON rp.hash = pk2.hash_post
                WHERE rp.date >= DATE_SUB(NOW(), INTERVAL 19 DAY)
                GROUP BY pk2.id_keyword
            ) kw_trend ON kw_trend.id_keyword = pk_tr.id_keyword
            WHERE pk_tr.hash_post = r.hash
        ) DESC, r.date DESC, r.id DESC';
    }

    return 'ORDER BY r.date DESC, r.id DESC';
}

function dash_admin_sql_int_in_list(string $csv): string
{
    $ids = array_values(array_unique(array_filter(array_map('intval', explode(',', $csv)))));
    if ($ids === []) {
        return '';
    }

    return implode(',', $ids);
}
