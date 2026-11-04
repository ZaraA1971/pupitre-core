<?php
declare(strict_types=1);

/**
 * Sessions Dash — chemin absolu tmp/, cookies HTTPS.
 */
final class QualifSession
{
    public const GUEST_USER_ID = 999;

    public static function start(string $appDir, int $ttlSeconds): void
    {
        $savePath = rtrim($appDir, '/') . '/tmp';
        if (!is_dir($savePath) && !mkdir($savePath, 0770, true) && !is_dir($savePath)) {
            throw new RuntimeException('Impossible de créer le dossier sessions.');
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_set_cookie_params([
            'lifetime' => $ttlSeconds,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        ini_set('session.gc_maxlifetime', (string) $ttlSeconds);
        ini_set('session.save_path', $savePath);
        session_start();
    }

    public static function destroyAndRestart(string $appDir, int $ttlSeconds): void
    {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        self::start($appDir, $ttlSeconds);
    }

    public static function setGuest(): void
    {
        $_SESSION['NOM_UTILISATEUR'] = 'Invité';
        $_SESSION['ID_UTILISATEUR'] = self::GUEST_USER_ID;
    }

    public static function isGuest(): bool
    {
        return empty($_SESSION['ID_UTILISATEUR'])
            || (int) $_SESSION['ID_UTILISATEUR'] === self::GUEST_USER_ID;
    }

    public static function userId(): int
    {
        return (int) ($_SESSION['ID_UTILISATEUR'] ?? 0);
    }
}
