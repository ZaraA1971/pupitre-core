<?php
declare(strict_types=1);

/**
 * Chargeur dash_admin — logique métier dans inc/*.php.
 * assets.php est chargé par header.php (UI) ou explicitement sur les pages AJAX.
 */
$dashAdminInc = __DIR__ . '/inc';

foreach ([
    'helpers.php',
    'paths.php',
    'rss-filter.php',
    'rss-refresh.php',
    'rss-feed.php',
    'lists.php',
    'posts.php',
    'authors.php',
    'uploads.php',
    'desk.php',
    'storify.php',
    'nav.php',
] as $dashAdminIncFile) {
    require_once $dashAdminInc . '/' . $dashAdminIncFile;
}
