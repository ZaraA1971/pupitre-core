<?php
require_once __DIR__ . '/header.php';
require_once __DIR__ . '/simplepie.inc';

/** Longueur max du texte affiché (contenu flux, pas BDD). */
const CHECK_RSS_TEXT_PREVIEW = 600;

if (!isset($bdd)) {
    echo '<p>Erreur : connexion à la base de données échouée.</p></body></html>';
    exit;
}

$limit = isset($_GET['limit']) ? max(1, (int) $_GET['limit']) : 5;

dash_admin_include_nav_main(
    'Aperçu des articles RSS',
    dash_admin_nav_counts_extended($bdd, true),
    'config',
    'config_hub'
);
$dashConfigActive = 'config';
require __DIR__ . '/partials/nav_config_sub.php';

$timeStart = getmicrotime();
set_time_limit(0);

$feedSql = $bdd->prepare('SELECT url, name FROM rss_url LIMIT :limit');
$feedSql->bindValue(':limit', $limit, PDO::PARAM_INT);
$feedSql->execute();

$feeds = [];
$rssUrlMap = [];
while ($feedRow = $feedSql->fetch(PDO::FETCH_ASSOC)) {
    $feeds[] = (string) $feedRow['url'];
    $rssUrlMap[(string) $feedRow['url']] = (string) $feedRow['name'];
}

if ($feeds === []) {
    echo '<div id="container"><div class="wrapper" style="padding-top:30px"><p>Aucun flux RSS configuré.</p></div></div></body></html>';
    exit;
}

$feed = new SimplePie();
$feed->set_feed_url($feeds);
$feed->set_cache_duration(900);
$feed->set_cache_location(__DIR__ . '/cache');
$feed->set_useragent('LeDash/1.0');
$feed->enable_cache(false);
$feed->force_feed(true);
$feed->set_stupidly_fast(true);
$feed->set_timeout(1);
$feed->init();
$feed->handle_content_type();

$initTime = getmicrotime() - $timeStart;

if ($feed->error()) {
    echo '<div id="container"><div class="wrapper" style="padding-top:30px">';
    echo '<p style="color:red;">Erreur SimplePie : ' . htmlspecialchars((string) $feed->error(), ENT_QUOTES, 'UTF-8') . '</p>';
    echo '<p><a href="config.php">← Retour à la configuration des flux</a></p></div></div></body></html>';
    exit;
}

$hashExistsStmt = $bdd->prepare('SELECT 1 FROM rss_post WHERE hash = ? LIMIT 1');
$times = [];
$cur = 0;
?>
<div id="container">
    <div class="wrapper" style="padding-top:30px">
        <h3>Les flux <small><?php echo htmlspecialchars(date('Y-m-d H:i:s'), ENT_QUOTES, 'UTF-8'); ?></small></h3>
        <p>Limite : <?php echo (int) $limit; ?> flux — <a href="config.php">Configuration</a></p>
        <table>
            <thead>
                <tr>
                    <th>Hash</th>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Titre</th>
                    <th>Texte</th>
                    <th>Auteur</th>
                    <th>Lien</th>
                    <th>Temps (s)</th>
                    <th>En base</th>
                </tr>
            </thead>
            <tbody>
<?php
foreach ($feed->get_items() as $item) {
    $postTimeStart = getmicrotime();

    $hash = $item->get_id(true);
    $date = $item->get_date('Y-m-d H:i:s');
    if ($date === null || $date === '') {
        $date = date('Y-m-d H:i:s');
    }

    $currentFeed = $item->get_feed();
    $feedUrlKey = htmlspecialchars_decode((string) $currentFeed->subscribe_url(), ENT_QUOTES);
    $source = $rssUrlMap[$feedUrlKey] ?? html_entity_decode((string) $currentFeed->get_title(), ENT_QUOTES | ENT_HTML5, 'UTF-8');

    $title = nettoyerTexteAvance($item->get_title());
    $text = nettoyerTexteAvance(strip_tags($item->get_description()));

    $author = 'Auteur inconnu';
    $authors = $item->get_author();
    if ($authors) {
        $name = $authors->get_name();
        if ($name !== null && $name !== '') {
            $author = $name;
        }
    }

    $link = $item->get_permalink();
    $hashExistsStmt->execute([$hash]);
    $inDatabase = $hashExistsStmt->fetchColumn() !== false;
    $textDisplay = couperChaineNombre2($text, CHECK_RSS_TEXT_PREVIEW);

    $postTime = getmicrotime() - $postTimeStart;
    $times[$cur] = $postTime;
    $cur++;
    ?>
                <tr>
                    <td><?php echo htmlspecialchars((string) $hash, ENT_QUOTES, 'UTF-8'); ?></td>
                    <td><?php echo htmlspecialchars((string) $date, ENT_QUOTES, 'UTF-8'); ?></td>
                    <td><?php echo htmlspecialchars((string) $source, ENT_QUOTES, 'UTF-8'); ?></td>
                    <td><?php echo htmlspecialchars((string) $title, ENT_QUOTES, 'UTF-8'); ?></td>
                    <td><?php echo htmlspecialchars((string) $textDisplay, ENT_QUOTES, 'UTF-8'); ?></td>
                    <td><?php echo htmlspecialchars((string) $author, ENT_QUOTES, 'UTF-8'); ?></td>
                    <td><?php echo htmlspecialchars((string) $link, ENT_QUOTES, 'UTF-8'); ?></td>
                    <td><?php echo htmlspecialchars((string) round($postTime, 4), ENT_QUOTES, 'UTF-8'); ?></td>
                    <td><?php echo $inDatabase ? 'oui' : 'non'; ?></td>
                </tr>
    <?php
}

$timeTotal = getmicrotime() - $timeStart;
$totPosts = 0.0;
for ($j = 0; $j < $cur; $j++) {
    $totPosts += $times[$j];
}
$average = $cur > 0 ? $totPosts / $cur : 0.0;
?>
            </tbody>
        </table>
        <p><b>#posts :</b> <?php echo (int) $cur; ?></p>
        <p><b>Temps init :</b> <?php echo htmlspecialchars((string) $initTime, ENT_QUOTES, 'UTF-8'); ?></p>
        <p><b>Temps moyen / item :</b> <?php echo htmlspecialchars((string) $average, ENT_QUOTES, 'UTF-8'); ?></p>
        <p><b>Temps total :</b> <?php echo htmlspecialchars((string) $timeTotal, ENT_QUOTES, 'UTF-8'); ?></p>
        <p><a href="config.php">← Retour à la configuration des flux</a></p>
    </div>
</div>
</body>
</html>
