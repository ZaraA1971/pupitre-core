<?php
declare(strict_types=1);

require_once __DIR__ . '/Session.php';

/**
 * Auth Dash — validation session + redirections.
 */
final class QualifAuth
{
    public static function sessionValidForRedirect(PDO $bdd, string $appDir, int $ttlSeconds): bool
    {
        if (QualifSession::isGuest()) {
            return false;
        }

        $stmt = $bdd->prepare('SELECT id_user FROM users WHERE id_user = ? LIMIT 1');
        $stmt->execute([QualifSession::userId()]);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            return true;
        }

        QualifSession::destroyAndRestart($appDir, $ttlSeconds);
        return false;
    }

    public static function requireLogin(PDO $bdd, string $appDir, int $ttlSeconds, string $loginUrl = 'login.php'): void
    {
        if (self::sessionValidForRedirect($bdd, $appDir, $ttlSeconds)) {
            return;
        }

        header('Location: ' . $loginUrl);
        exit;
    }

    public static function requireHelpCompleted(PDO $bdd, string $helpUrl = 'help.php'): void
    {
        if (QualifSession::isGuest()) {
            return;
        }

        $stmt = $bdd->prepare('SELECT help FROM users WHERE id_user = ? LIMIT 1');
        $stmt->execute([QualifSession::userId()]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$res) {
            $_SESSION = [];
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_destroy();
            }
            header('Location: login.php');
            exit;
        }

        if ($res['help'] === '0' || $res['help'] === 0) {
            header('Location: ' . $helpUrl);
            exit;
        }
    }

    /** @param array{id_user:int|string,login_user:string} $row */
    public static function loginUser(array $row): void
    {
        $_SESSION['ID_UTILISATEUR'] = (int) $row['id_user'];
        $_SESSION['NOM_UTILISATEUR'] = $row['login_user'];
    }
}
