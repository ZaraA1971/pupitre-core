<?php
require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/functions.php';

dash_electron_boot(true);

$dashPageTitle = 'Le Dash · Chronologie';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<?php require __DIR__ . '/partials/head_common.php'; ?>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script type="text/javascript" src="<?= htmlspecialchars(dash_electron_asset('js/scripts.js'), ENT_QUOTES, 'UTF-8') ?>"></script>
<script type="text/javascript" src="<?= htmlspecialchars(dash_electron_asset('js/timeline_js/timeline-api.js'), ENT_QUOTES, 'UTF-8') ?>?bundle=true"></script>
    <script>
        var tl;
        function onLoad() {
            var eventSource = new Timeline.DefaultEventSource(0);

            var bandInfos = [
                Timeline.createBandInfo({
                    width:          "90%", 
                    intervalUnit:   Timeline.DateTime.HOUR,
                    intervalPixels: 50,
                    eventSource:    eventSource,
                    layout:         'original'
                }),
                Timeline.createBandInfo({
                	overview:       true,
                    width:          "10%", 
                    intervalUnit:   Timeline.DateTime.DAY,
                    intervalPixels: 200,
                    eventSource:    eventSource,
                })
            ];
            bandInfos[1].syncWith = 0;
  			bandInfos[1].highlight = true;
            tl = Timeline.create(document.getElementById("my-timeline"), bandInfos, Timeline.HORIZONTAL);
            tl.loadJSON("results.json?"+ (new Date().getTime()), function(json, url) {
                eventSource.loadJSON(json, url);
            });
        }
        var resizeTimerID = null;
        function onResize() {
            if (resizeTimerID == null) {
                resizeTimerID = window.setTimeout(function() {
                    resizeTimerID = null;
                    tl.layout();
                }, 500);
            }
        }
    </script>
</head>

<body onload="onLoad();" onresize="onResize();" <?php if (isset($_GET['show_post']) && !empty($_GET['show_post'])) { echo 'onLoad="displayComment('.intval($_GET['show_post']).')"'; } ?>>
	<div id="header">
		<div class="head">
			<h1><a href="index.php">Le Dash</a></h1><div id="loader"><img src="img/ajax-loader.gif" alt="Loader"/></div><div id="loader2"><p>Génération du fichier pdf en cours.</p><img src="img/ajax-loader-big.gif" alt="Loader"/></div>
			<div id="user_config">
				<p id="user"><span><strong><?php echo ucfirst($_SESSION["NOM_UTILISATEUR"]); ?></strong></span></p>
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

<div id="container">
	<div class="wrapper">
		<div id="my-timeline" style="height: 300px; border: 1px solid #aaa"></div>
<noscript>
This page uses Javascript to show you a Timeline. Please enable Javascript in your browser to see the full page. Thank you.
</noscript>

	</div>
</div>
<?php
include __DIR__ . '/footer.php';
