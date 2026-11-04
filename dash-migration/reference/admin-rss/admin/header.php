<?php
error_reporting(E_ALL);
date_default_timezone_set('Europe/Paris');

require_once __DIR__ . '/inc/bootstrap.php';
dash_admin_boot();
require_once __DIR__ . '/inc/assets.php';
require_once __DIR__ . '/functions.php';

dash_admin_refresh_rss_try_unlock($bdd);

// --- Gestion du tri (GET prioritaire — liens comme sent.php) ---
$valid_sort = ['date', 'pertinence', 'tendance'];
$tri = 'date';

if (isset($_GET['tri']) && in_array($_GET['tri'], $valid_sort, true)) {
    $tri = $_GET['tri'];
} elseif (isset($_POST['sort_date']) && in_array($_POST['sort_date'], ['Par ordre chronologique', 'alt_date'], true)) {
    $tri = 'date';
} elseif (isset($_POST['sort_relevance']) && in_array($_POST['sort_relevance'], ['Par pertinence', 'alt_relevance'], true)) {
    $tri = 'pertinence';
} elseif (isset($_POST['sort_trend']) && in_array($_POST['sort_trend'], ['Par tendance', 'alt_trend'], true)) {
    $tri = 'tendance';
}

// --- Gestion du filtre source ---
$source_name = '%';
if (isset($_POST['source_name'])) {
    $source_name = htmlspecialchars($_POST['source_name'], ENT_QUOTES, 'UTF-8');
} elseif (isset($_GET['source_name'])) {
    $source_name = htmlspecialchars($_GET['source_name'], ENT_QUOTES, 'UTF-8');
}

// --- Lecture de la date du dernier refresh ---
try {
    $stmt = $bdd->prepare('
        SELECT DATE_FORMAT(last_refresh, "%d/%m/%Y à %Hh%i") AS formatted_date
        FROM refresh_rss
        WHERE id = 1
    ');
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $last_refresh_display = !empty($result['formatted_date']) ? $result['formatted_date'] : '—';
} catch (Throwable $e) {
    $last_refresh_display = 'Erreur de lecture';
    error_log('[Header] Erreur SQL last_refresh : ' . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Administration · Electron Libre</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<?php dash_admin_render_stylesheets(); ?>
<?php dash_admin_render_lightbox_css(); ?>
</head>

<body>
<div id="refresh_mention">Une mise à jour du flux est en cours, veuillez patienter.</div>

<div id="header">
    <div class="head dash-admin-head">
        <div class="dash-admin-head-main">
            <div class="dash-admin-title-block">
                <h1><a href="index.php">Administration</a></h1>
                <p class="label dash-admin-brand">Flux RSS
                    · <a href="https://www.electronlibre.info" target="_blank" rel="noopener noreferrer"><span class="brown">Electron</span> <span class="grey">Libre</span></a>
                </p>
            </div>

            <div id="loader"><img src="<?php echo htmlspecialchars(dash_admin_asset('img/ajax-loader.gif'), ENT_QUOTES, 'UTF-8'); ?>" alt="Loader"/></div>

            <div id="loader2">
                <p>Mise à jour des flux en cours.</p>
                <img src="<?php echo htmlspecialchars(dash_admin_asset('img/ajax-loader-big.gif'), ENT_QUOTES, 'UTF-8'); ?>" alt="Loader"/>
            </div>
        </div>

        <div id="refresh" class="dash-admin-refresh">
            <img src="<?php echo htmlspecialchars(dash_admin_asset('img/refresh.png'), ENT_QUOTES, 'UTF-8'); ?>" width="24" height="24" alt="" aria-hidden="true"/>
            <form action="refresh_rss.php" method="post" id="refreshform">
                <input type="hidden" name="sort_<?php echo $tri; ?>" value="alt_<?php echo $tri; ?>"/>
                <input type="hidden" name="source_name" value="<?php echo $source_name; ?>"/>

                <input type="submit" name="refresh_rss" value="Remettre les flux à jour" id="refresh_button"/>
                <p class="dash-admin-refresh-meta">Mis à jour le <?php echo htmlspecialchars($last_refresh_display, ENT_QUOTES, 'UTF-8'); ?></p>

                <!-- Debug info -->
                <!-- DB = <?php echo DB_NAME; ?> | Connexion = <?php echo isset($bdd) && $bdd instanceof PDO ? 'OK' : 'KO'; ?> -->
            </form>
        </div>
    </div>
</div>
