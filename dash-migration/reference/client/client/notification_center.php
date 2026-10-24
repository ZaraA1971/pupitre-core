<?php
declare(strict_types=1);

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/functions.php';

dash_electron_boot_ajax();

if (!isset($_SESSION['ID_UTILISATEUR'])) {
    return;
}

$userId = (int) $_SESSION['ID_UTILISATEUR'];

dash_electron_notif_panel_open('Activité récente');

$get_new_comments = $bdd->query('
    SELECT *, DATE_FORMAT(date, \'%H:%i %d/%m\') AS converted_date
    FROM comments, users
    WHERE comments.id_user = users.id_user AND comments.id_user != ' . $userId . '
    ORDER BY comments.date DESC
    LIMIT 0, 3
');

dash_electron_notif_section_open('Commentaires');
while ($new_comments = $get_new_comments->fetch(PDO::FETCH_ASSOC)) {
    $get_title = $bdd_admin->prepare('SELECT title FROM rss_post WHERE id = ?');
    $get_title->execute([(int) $new_comments['id_post']]);
    $titleRow = $get_title->fetch(PDO::FETCH_ASSOC);
    $articleTitle = $titleRow ? couperChaineNombre2($titleRow['title'], 50) : 'Article';
    $meta = htmlspecialchars(ucfirst($new_comments['login_user']), ENT_QUOTES, 'UTF-8')
        . ' · ' . htmlspecialchars((string) $new_comments['converted_date'], ENT_QUOTES, 'UTF-8');
    $body = 'A commenté « ' . htmlspecialchars(couperChaineNombre2(stripslashes($new_comments['text']), 60), ENT_QUOTES, 'UTF-8')
        . ' » sur « ' . htmlspecialchars($articleTitle, ENT_QUOTES, 'UTF-8') . ' »';
    dash_electron_notif_item('post.php?show_post=' . (int) $new_comments['id_post'], $meta, $body);
}
dash_electron_notif_section_close();

$get_new_favorites = $bdd->query('
    SELECT *
    FROM favorites, users
    WHERE favorites.id_user = users.id_user AND favorites.id_user != ' . $userId . '
    ORDER BY id DESC
    LIMIT 0, 3
');

dash_electron_notif_section_open('Favoris');
while ($new_favorites = $get_new_favorites->fetch(PDO::FETCH_ASSOC)) {
    $get_title = $bdd_admin->prepare(
        'SELECT title, DATE_FORMAT(date, \'%H:%i %d/%m\') AS converted_date FROM rss_post WHERE id = ?'
    );
    $get_title->execute([(int) $new_favorites['id_post']]);
    $titleRow = $get_title->fetch(PDO::FETCH_ASSOC);
    if (!$titleRow) {
        continue;
    }
    $meta = htmlspecialchars(ucfirst($new_favorites['login_user']), ENT_QUOTES, 'UTF-8')
        . ' · ' . htmlspecialchars((string) $titleRow['converted_date'], ENT_QUOTES, 'UTF-8');
    $body = 'A mis en favoris « ' . htmlspecialchars(couperChaineNombre2($titleRow['title'], 50), ENT_QUOTES, 'UTF-8') . ' »';
    dash_electron_notif_item('post.php?show_post=' . (int) $new_favorites['id_post'], $meta, $body);
}
dash_electron_notif_section_close();

$get_new_messages = $bdd->prepare('
    SELECT id_post, login_user, text, DATE_FORMAT(date, \'%H:%i %d/%m\') AS converted_date
    FROM messages, users
    WHERE messages.from_user = users.id_user AND messages.to_user = ?
    ORDER BY messages.date DESC
    LIMIT 0, 1
');
$get_new_messages->execute([$userId]);

dash_electron_notif_section_open('Messages');
while ($new_messages = $get_new_messages->fetch(PDO::FETCH_ASSOC)) {
    $meta = htmlspecialchars(ucfirst($new_messages['login_user']), ENT_QUOTES, 'UTF-8')
        . ' · ' . htmlspecialchars((string) $new_messages['converted_date'], ENT_QUOTES, 'UTF-8');
    $body = '« ' . htmlspecialchars(couperChaineNombre2(stripslashes($new_messages['text']), 60), ENT_QUOTES, 'UTF-8') . ' »';
    dash_electron_notif_item('messages.php', $meta, $body);
}
dash_electron_notif_section_close();

dash_electron_notif_panel_footer('events.php', 'Historique complet');
dash_electron_notif_panel_close();

global $bdd, $bdd_admin;
dash_electron_mark_all_notifications_seen($bdd, $bdd_admin, $userId);
