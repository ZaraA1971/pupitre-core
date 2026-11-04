<?php
declare(strict_types=1);

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/inc/assets.php';

dash_electron_boot(true);
QualifAuth::requireHelpCompleted($bdd);

?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Le Dash - Electron Libre</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet" />
<?php dash_electron_render_stylesheets(); ?>
<?php dash_electron_render_lightbox_css(); ?>
<?php dash_electron_render_client_guard(); ?>
</head>

<body<?php if (isset($_GET['show_post']) && !empty($_GET['show_post'])) {
    echo ' onload="displayComment(' . (int) $_GET['show_post'] . ')"';
} ?>>
    <div id="header">
        <div class="head">
            <h1><a href="index.php">Le Dash</a></h1><div id="loader"><img src="img/ajax-loader.gif" alt="Loader"/></div><div id="loader2"><p>Génération du fichier pdf en cours.</p><img src="img/ajax-loader-big.gif" alt="Loader"/></div>
            <div id="user_config">
                <p id="user"><span><strong><?php echo ucfirst((string) $_SESSION['NOM_UTILISATEUR']); ?></strong></span></p>
                <p id="config"><a href="config.php">Configuration</a> | <a href="disconnect.php">Déconnexion</a></p>
            </div>
            <p class="label">par <a href="http://www.electronlibre.info" target="_blank"><span class="brown">Electron</span><span class="grey">Libre</span></a></p>
        </div>
    </div>
    <div id="nav">
        <div class="wrapper">
            <?php require __DIR__ . '/partials/nav_notifications.php'; ?>
            <div id="pannel">
                <p class="left"><a href="index.php" id="flux_live"><i class="icon-th-list icon-white" style="margin:2px 4px 0 0"></i>Flux Live</a> <a href="archives.php"><i class="icon-download-alt icon-white" style="margin:2px 4px 0 0"></i>Archives</a> <a href="messages.php" class="dash-nav-link--messages"><i class="icon-envelope icon-white" style="margin:2px 4px 0 0"></i>Messages<span id="notif_area" class="dash-notif-badge-slot"></span></a></p>
            </div>
        </div>
    </div>
