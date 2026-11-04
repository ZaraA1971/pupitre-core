<?php
// Initialisation de l'environnement PHP
date_default_timezone_set('Europe/Paris');
setlocale(LC_CTYPE, 'fr_FR.ISO-8859-1');
ini_set('memory_limit', '256M');
error_reporting(0);
error_log('=== Lancement refresh_rss.php à ' . date('Y-m-d H:i:s') . ' ===');

require_once __DIR__ . '/connect.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/simplepie.inc';
require_once __DIR__ . '/rss_refresh_engine.php';

$GLOBALS['refresh_rss_set_busy'] = false;
$GLOBALS['refresh_rss_complete'] = false;
register_shutdown_function(static function (): void {
	if (empty($GLOBALS['refresh_rss_set_busy']) || !empty($GLOBALS['refresh_rss_complete'])) {
		return;
	}
	try {
		if (isset($GLOBALS['bdd']) && $GLOBALS['bdd'] instanceof PDO) {
			dash_admin_refresh_rss_set_status($GLOBALS['bdd'], false);
			error_log('[refresh_rss] Arrêt brutal / timeout : status remis à 0 (shutdown)');
		}
	} catch (Throwable $e) {
		error_log('[refresh_rss] shutdown reset status : ' . $e->getMessage());
	}
});

set_time_limit(300);
$time_start = getmicrotime();

dash_admin_refresh_rss_try_unlock($bdd);

$status_stmt = $bdd->prepare('SELECT status FROM refresh_rss WHERE id = 1');
$status_stmt->execute();
$status_sql = $status_stmt->fetch(PDO::FETCH_ASSOC);
if ($status_sql && dash_admin_refresh_rss_status_is_busy($status_sql['status'])) {
	echo (getmicrotime() - $time_start) . ' - Already Processing.';
	exit;
}

dash_admin_refresh_rss_set_status($bdd, true);
$GLOBALS['refresh_rss_set_busy'] = true;

error_log('[refresh_rss] Préchargement rss_url, keywords / alias');

[$rss_urls, $rss_url_map, $audienceByUrl, $themeByUrl] = rss_refresh_load_rss_url_map($bdd);
$feeds = array_column($rss_urls, 'url');
if ($feeds === []) {
	dash_admin_refresh_rss_set_status($bdd, false);
	echo (getmicrotime() - $time_start) . ' — Aucun flux RSS.';
	$GLOBALS['refresh_rss_complete'] = true;
	exit;
}

$kwData = rss_refresh_load_keywords($bdd);

error_log('[refresh_rss] Initialisation SimplePie');

$feed = new SimplePie();
$feed->set_feed_url($feeds);
dash_admin_simplepie_configure($feed);
$feed->init();
$feed->handle_content_type();
dash_admin_refresh_rss_touch_activity($bdd);

try {
    rss_refresh_process_items($bdd, $feed, $rss_url_map, $kwData, [
        'delete_older_than_days' => RSS_KEEP_DAYS,
        'delete_stale_bin_unsent' => false,
        'progress' => true,
        'theme_by_url' => $themeByUrl,
    ], $audienceByUrl);
    error_log('[refresh_rss] Traitement des articles terminé');
} finally {
    error_log('[refresh_rss] Mise à jour last_refresh / status');

    $timestamp = date('Y-m-d H:i:s');
    try {
        $update = $bdd->prepare('UPDATE refresh_rss SET last_refresh = ?, status = ? WHERE id = 1');
        $idleVal = dash_admin_refresh_rss_status_pair()['idle'];
        $success = $update->execute([$timestamp, $idleVal]);

        if ($success) {
            $verify_stmt = $bdd->prepare('SELECT last_refresh FROM refresh_rss WHERE id = 1');
            $verify_stmt->execute();
            $check = $verify_stmt->fetchColumn();
            error_log("[refresh_rss] last_refresh = $check");
        } else {
            error_log('[refresh_rss] Échec UPDATE finale : ' . implode(' | ', $update->errorInfo()));
        }
    } catch (Throwable $e) {
        error_log('[refresh_rss] Exception UPDATE finale : ' . $e->getMessage());
    }
    try {
        dash_admin_refresh_rss_set_status($bdd, false);
    } catch (Throwable $e) {
        error_log('[refresh_rss] Échec remise status à libre (finally) : ' . $e->getMessage());
    }
}

echo (getmicrotime() - $time_start) . ' seconds';
error_log('=== Fin de refresh_rss.php (' . round(getmicrotime() - $time_start, 2) . "s) ===\n");
$GLOBALS['refresh_rss_complete'] = true;
