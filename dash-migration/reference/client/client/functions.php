<?php
declare(strict_types=1);

/**
 * Chargeur dash_electron — logique métier dans inc/*.php (cf. cursor-dash.md).
 */
$dashElectronInc = __DIR__ . '/inc';

foreach ([
    'helpers.php',
    'text.php',
    'files.php',
    'posts.php',
    'notifications.php',
    'notifications-ui.php',
    'bootstrap.php',
] as $dashElectronIncFile) {
    require_once $dashElectronInc . '/' . $dashElectronIncFile;
}
