<?php
declare(strict_types=1);

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/functions.php';

dash_electron_boot_ajax();

if (!isset($_SESSION['ID_UTILISATEUR']) || (int) $_SESSION['ID_UTILISATEUR'] === 999) {
    return;
}

$userId = (int) $_SESSION['ID_UTILISATEUR'];

$req = $bdd->prepare('SELECT last_messages_consultation FROM users WHERE id_user = ?');
$req->execute([$userId]);
$lastMessagesConsultation = (string) $req->fetchColumn();

$count = $bdd->prepare(
    'SELECT COUNT(*) FROM messages WHERE to_user = ? AND date > ?'
);
$count->execute([$userId, $lastMessagesConsultation]);
$newMessages = (int) $count->fetchColumn();

dash_electron_notif_badge($newMessages);
