#!/usr/bin/php
<?php
// Planification : /etc/cron.d/dash-cron

setlocale(LC_CTYPE, 'fr_FR.UTF-8');

require_once __DIR__ . '/inc/bootstrap.php';
require_once dirname(__DIR__) . '/shared/bootstrap.php';
qualif_bootstrap();
$bdd = dash_admin_boot(['timezone' => 'Europe/Paris']);

$cronLog = qualif_env('DASH_CRON_LOG') ?: qualif_env('QUALIF_CRON_LOG') ?: '/var/log/dash-cron.log';

ini_set('memory_limit', '256M');
ini_set('log_errors', '1');
ini_set('error_log', $cronLog);
error_reporting(E_ALL);
set_time_limit(0);
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/simplepie.inc';
require_once __DIR__ . '/rss_refresh_engine.php';

$GLOBALS['cron_refresh_set_busy'] = false;
$GLOBALS['cron_refresh_complete'] = false;
register_shutdown_function(static function (): void {
    if (empty($GLOBALS['cron_refresh_set_busy']) || !empty($GLOBALS['cron_refresh_complete'])) {
        return;
    }
    try {
        if (isset($GLOBALS['bdd']) && $GLOBALS['bdd'] instanceof PDO) {
            dash_admin_refresh_rss_set_status($GLOBALS['bdd'], false);
            error_log('[cron] Arrêt brutal / timeout : status remis à libre (shutdown)');
        }
    } catch (Throwable $e) {
        error_log('[cron] shutdown reset status : ' . $e->getMessage());
    }
});

$time_start = getmicrotime();
error_log('[qualif-dash-cron] Démarrage ' . date('c'));

$released = dash_admin_refresh_rss_try_unlock($bdd);
if ($released) {
    error_log('[qualif-dash-cron] Verrou stale/fantôme libéré avant refresh');
}

$refreshStatusStmt = $bdd->prepare('SELECT status FROM refresh_rss WHERE id = 1');
$refreshStatusStmt->execute();
$refreshStatus = $refreshStatusStmt->fetchColumn();

if (dash_admin_refresh_rss_status_is_busy($refreshStatus)) {
    $msg = '[ALERT][qualif-dash-cron] Verrou refresh_rss actif — cron ignoré (unlock_refresh.php si persistant)';
    error_log($msg);
    echo $msg;
    exit(2);
}

dash_admin_refresh_rss_set_status($bdd, true);
$GLOBALS['cron_refresh_set_busy'] = true;

[$rss_urls, $rss_url_map, $audienceByUrl, $themeByUrl] = rss_refresh_load_rss_url_map($bdd);
$feedUrls = array_column($rss_urls, 'url');

if ($feedUrls === []) {
    error_log('Aucune URL RSS trouvée dans la base de données.');
    dash_admin_refresh_rss_set_status($bdd, false);
    $GLOBALS['cron_refresh_complete'] = true;
    exit('Aucune URL RSS disponible.');
}

$kwData = rss_refresh_load_keywords($bdd);

$feed = new SimplePie();
$feed->set_feed_url($feedUrls);
dash_admin_simplepie_configure($feed);
$feed->init();
$feed->handle_content_type();
dash_admin_refresh_rss_touch_activity($bdd);

try {
    rss_refresh_process_items($bdd, $feed, $rss_url_map, $kwData, [
        'delete_older_than_days' => RSS_KEEP_DAYS,
        'delete_stale_bin_unsent' => true,
        'progress' => false,
        'theme_by_url' => $themeByUrl,
    ], $audienceByUrl);
} finally {
    $ts = date('Y-m-d H:i:s');
    try {
        dash_admin_refresh_rss_set_status($bdd, false);
    } catch (Throwable $e) {
        error_log('[cron] Échec remise status à libre : ' . $e->getMessage());
    }
    try {
        // Même fuseau que refresh_rss.php (évite NOW() en UTC côté MySQL).
        $bdd->prepare('UPDATE refresh_rss SET last_refresh = ? WHERE id = 1')->execute([$ts]);
    } catch (Throwable $e) {
        error_log('[cron] last_refresh : ' . $e->getMessage());
    }
    try {
        $bdd->prepare('UPDATE refresh_rss SET last_update = ? WHERE id = 1')->execute([$ts]);
    } catch (Throwable $e) {
        // Colonne last_update absente sur certaines bases : ignorer.
    }
}

echo 'Durée totale : ' . round(getmicrotime() - $time_start, 2) . ' secondes.';
error_log('[qualif-dash-cron] Terminé en ' . round(getmicrotime() - $time_start, 2) . 's');
$GLOBALS['cron_refresh_complete'] = true;
