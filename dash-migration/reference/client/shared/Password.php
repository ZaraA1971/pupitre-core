<?php
declare(strict_types=1);

/**
 * Auth mots de passe — bcrypt + migration transparente depuis md5.
 */
final class QualifPassword
{
    public static function verify(string $plain, string $storedHash, PDO $bdd, int $userId): bool
    {
        if ($storedHash === '') {
            return false;
        }

        if (self::looksLikeMd5($storedHash)) {
            if (!hash_equals($storedHash, md5($plain))) {
                return false;
            }
            self::upgradeToBcrypt($bdd, $userId, $plain);
            return true;
        }

        return password_verify($plain, $storedHash);
    }

    public static function looksLikeMd5(string $hash): bool
    {
        return strlen($hash) === 32 && ctype_xdigit($hash);
    }

    private static function upgradeToBcrypt(PDO $bdd, int $userId, string $plain): void
    {
        $hash = password_hash($plain, PASSWORD_DEFAULT);
        $stmt = $bdd->prepare('UPDATE users SET pass_user = ? WHERE id_user = ?');

        try {
            $stmt->execute([$hash, $userId]);
        } catch (PDOException $e) {
            // pass_user est souvent varchar(32) (md5) — élargir à varchar(255) avant migration bcrypt.
            error_log('QualifPassword: bcrypt upgrade failed for user ' . $userId . ': ' . $e->getMessage());
        }
    }
}
