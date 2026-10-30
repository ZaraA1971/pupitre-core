<?php
require_once __DIR__ . '/header.php';

$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : null;
if ($limit !== null && $limit < 1) {
    $limit = null;
}

dash_admin_include_nav_main(
    'Vérification des flux RSS',
    dash_admin_nav_counts_extended($bdd, true),
    'config',
    'config_hub'
);
$dashConfigActive = 'config';
require __DIR__ . '/partials/nav_config_sub.php';

$feeds = [];
try {
    $query = 'SELECT url FROM rss_url';
    if ($limit !== null) {
        $query .= ' LIMIT :limit';
    }
    $feedSql = $bdd->prepare($query);
    if ($limit !== null) {
        $feedSql->bindValue(':limit', $limit, PDO::PARAM_INT);
    }
    $feedSql->execute();
    while ($row = $feedSql->fetch(PDO::FETCH_ASSOC)) {
        $feeds[] = (string) $row['url'];
    }
} catch (PDOException $e) {
    echo '<p style="color:red;">Erreur lors de la récupération des flux RSS : ' .
        htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</p>';
    echo '</body></html>';
    exit;
}
?>
<div id="container">
    <div class="wrapper" style="padding-top:30px">
        <h2>Résultats de la vérification des flux RSS</h2>
<?php
if ($feeds === []) {
    echo '<p>Aucune URL RSS trouvée.</p>';
} else {
    $timeStart = getmicrotime();
    ?>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>URL du flux</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
    <?php
    foreach ($feeds as $i => $url) {
        $num = $i + 1;
        $probe = dash_admin_rss_probe_feed_url($url, 2);
        echo '<tr><td>' . $num . '</td><td>' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '</td>';
        if ($probe['ok']) {
            echo '<td style="color:green;">OK</td>';
        } else {
            echo '<td style="color:red;">Erreur : ' . htmlspecialchars((string) ($probe['error'] ?? ''), ENT_QUOTES, 'UTF-8') . '</td>';
        }
        echo '</tr>';
    }
    $elapsed = round(getmicrotime() - $timeStart, 2);
    ?>
            </tbody>
        </table>
        <p>Temps total de traitement : <?php echo htmlspecialchars((string) $elapsed, ENT_QUOTES, 'UTF-8'); ?> secondes.</p>
    <?php
}
?>
        <p><a href="config.php">← Retour à la configuration des flux</a></p>
    </div>
</div>
</body>
</html>
