<?php
declare(strict_types=1);

/**
 * URLs publiques Dash — domaine normé dash.electronlibre.info.
 */
final class DashSite
{
    public const PUBLIC_ORIGIN = 'https://dash.electronlibre.info';
    public const ADMIN_BASE = '/admin';
    public const CLIENT_BASE = '/client';

    public static function publicOrigin(): string
    {
        $env = getenv('DASH_PUBLIC_ORIGIN');
        if (is_string($env) && $env !== '') {
            return rtrim($env, '/');
        }

        return self::PUBLIC_ORIGIN;
    }

    public static function adminBase(): string
    {
        $env = getenv('DASH_ADMIN_BASE');
        if (is_string($env) && $env !== '' && str_starts_with($env, '/')) {
            return rtrim($env, '/');
        }

        return self::ADMIN_BASE;
    }

    public static function clientBase(): string
    {
        $env = getenv('DASH_CLIENT_BASE');
        if (is_string($env) && $env !== '' && str_starts_with($env, '/')) {
            return rtrim($env, '/');
        }

        return self::CLIENT_BASE;
    }

    public static function adminUrl(string $path = '', array $query = []): string
    {
        $base = self::adminBase() . '/' . ltrim($path, '/');
        $base = rtrim($base, '/');
        if ($path !== '' && !str_contains($path, '.')) {
            // keep directory paths without trailing slash issues for index
        }
        if ($query === []) {
            return $base === self::adminBase() ? self::adminBase() . '/index.php' : $base;
        }

        return $base . '?' . http_build_query($query);
    }

    public static function clientUrl(string $path = '', array $query = []): string
    {
        $base = self::clientBase() . '/' . ltrim($path, '/');
        if ($query === []) {
            return $base;
        }

        return $base . '?' . http_build_query($query);
    }

    public static function magicLoginUrl(string $jwt, array $dashOptions, string $email): string
    {
        return self::publicOrigin() . self::clientBase() . '/login.php?' . http_build_query([
            'token' => $jwt,
            'dash' => implode(',', $dashOptions),
            'email' => $email,
        ]);
    }
}
