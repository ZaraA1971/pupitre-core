<?php
declare(strict_types=1);

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/functions.php';

dash_electron_boot_ajax();

if (!isset($_SESSION['ID_UTILISATEUR']) || (int) $_SESSION['ID_UTILISATEUR'] === 999) {
    return;
}

$userId = (int) $_SESSION['ID_UTILISATEUR'];

$req = $bdd->prepare('SELECT last_connexion FROM users WHERE id_user = ?');
$req->execute([$userId]);
$last_connexion = (string) $req->fetchColumn();

$themeIds = [];
$reponse = $bdd->query('SELECT id_theme FROM config');
while ($row = $reponse->fetch(PDO::FETCH_ASSOC)) {
    $themeIds[] = (int) $row['id_theme'];
}
$id_theme_list = implode(',', $themeIds !== [] ? $themeIds : [999]) . ',999';

$count = $bdd_admin->prepare(
    'SELECT COUNT(*) FROM rss_post WHERE id_theme IN (' . $id_theme_list . ') AND date_add_theme > ?'
);
$count->execute([$last_connexion]);
$newArticles = (int) $count->fetchColumn();

if ($newArticles > 0) {
    echo '(' . $newArticles . ')';
}
