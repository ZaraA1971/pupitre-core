<?php
declare(strict_types=1);

/**
 * En-tête HTML commun (pages hors header.php) — pipeline DashAssets.
 * Variable optionnelle : $dashPageTitle (string)
 */
require_once dirname(__DIR__) . '/inc/assets.php';

$dashHeadTitle = $dashPageTitle ?? 'Le Dash · Electron Libre';
?>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title><?= htmlspecialchars($dashHeadTitle, ENT_QUOTES, 'UTF-8') ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet" />
<?php dash_electron_render_stylesheets(); ?>
<?php dash_electron_render_lightbox_css(); ?>
<?php dash_electron_render_client_guard(); ?>
