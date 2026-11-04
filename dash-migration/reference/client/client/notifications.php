<?php
declare(strict_types=1);

/** Liste id_theme pour requêtes notifications (config utilisateur + 999). */
function dash_electron_theme_id_list(PDO $bdd): string
{
    $themeIds = [];
    foreach ($bdd->query('SELECT id_theme FROM config') as $row) {
        $themeIds[] = (int) $row['id_theme'];
    }

    return implode(',', $themeIds !== [] ? $themeIds : [999]) . ',999';
}

/**
 * Marque les articles/alertes comme vus.
 * Utilise GREATEST(NOW(), MAX(date_add_theme)) pour couvrir les timestamps futurs (décalage TZ admin).
 */
function dash_electron_mark_articles_seen(PDO $bdd, PDO $bddAdmin, int $userId): void
{
    $idThemeList = dash_electron_theme_id_list($bdd);
    $stmt = $bddAdmin->query(
        'SELECT GREATEST(NOW(), COALESCE(MAX(date_add_theme), NOW())) FROM rss_post WHERE id_theme IN (' . $idThemeList . ')'
    );
    $seenAt = (string) $stmt->fetchColumn();

    $upd = $bdd->prepare('UPDATE users SET last_connexion = ? WHERE id_user = ?');
    $upd->execute([$seenAt, $userId]);
}

/** Marque articles, messages et commentaires comme vus. */
function dash_electron_mark_all_notifications_seen(PDO $bdd, PDO $bddAdmin, int $userId): void
{
    $idThemeList = dash_electron_theme_id_list($bdd);

    $stmt = $bddAdmin->query(
        'SELECT GREATEST(NOW(), COALESCE(MAX(date_add_theme), NOW())) FROM rss_post WHERE id_theme IN (' . $idThemeList . ')'
    );
    $lastConnexion = (string) $stmt->fetchColumn();

    $stmt = $bdd->prepare('SELECT GREATEST(NOW(), COALESCE(MAX(date), NOW())) FROM messages WHERE to_user = ?');
    $stmt->execute([$userId]);
    $lastMessages = (string) $stmt->fetchColumn();

    $stmt = $bdd->prepare('SELECT GREATEST(NOW(), COALESCE(MAX(date), NOW())) FROM comments WHERE id_user != ?');
    $stmt->execute([$userId]);
    $lastComments = (string) $stmt->fetchColumn();

    $upd = $bdd->prepare('
        UPDATE users
        SET last_connexion = ?, last_messages_consultation = ?, last_comments_consultation = ?
        WHERE id_user = ?
    ');
    $upd->execute([$lastConnexion, $lastMessages, $lastComments, $userId]);
}
