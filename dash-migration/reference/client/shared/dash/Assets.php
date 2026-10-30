<?php
declare(strict_types=1);

require_once __DIR__ . '/Site.php';

/**
 * Assets Dash — URLs absolues + empilement CSS (cf. cursor-dash.md).
 */
final class DashAssets
{
    private const VERSION = '2026092318';

    public static function version(): string
    {
        return self::VERSION;
    }

    public static function shared(string $relativePath): string
    {
        return '/shared/' . ltrim($relativePath, '/') . '?v=' . self::VERSION;
    }

    public static function app(string $app, string $relativePath): string
    {
        $base = $app === 'admin' ? DashSite::adminBase() : DashSite::clientBase();

        return $base . '/' . ltrim($relativePath, '/') . '?v=' . self::VERSION;
    }

    /** @return list<array{href:string, media:string}> */
    public static function stylesheets(string $app): array
    {
        $sheets = [
            ['href' => self::shared('assets/dash-tokens.css'), 'media' => 'screen'],
        ];

        if ($app === 'electron') {
            // visualize retiré (phase 11) — graphiques via Chart.js (dash-keyword-chart.js)
        }

        $sheets[] = ['href' => self::shared('assets/dash-components.css'), 'media' => 'screen'];
        $sheets[] = ['href' => self::shared('assets/dash-lightbox.css'), 'media' => 'screen'];
        $sheets[] = ['href' => self::shared('assets/dash-legacy-reset.css'), 'media' => 'screen'];
        // Legacy app CSS first, puis layout moderne (doit gagner sur #nav overflow, typo Georgia, etc.)
        $sheets[] = ['href' => self::app($app, 'css/global.css'), 'media' => 'screen'];
        $sheets[] = ['href' => self::shared('assets/dash-layout.css'), 'media' => 'screen'];
        $sheets[] = ['href' => self::shared('assets/dash-notifications.css'), 'media' => 'screen'];

        return $sheets;
    }

    public static function renderStylesheets(string $app): void
    {
        foreach (self::stylesheets($app) as $sheet) {
            $href = htmlspecialchars($sheet['href'], ENT_QUOTES, 'UTF-8');
            $media = htmlspecialchars($sheet['media'], ENT_QUOTES, 'UTF-8');
            echo '    <link rel="stylesheet" href="' . $href . '" media="' . $media . '"/>' . "\n";
        }
    }

    public static function renderClientGuard(): void
    {
        $src = htmlspecialchars(self::shared('js/dash-client-guard.js'), ENT_QUOTES, 'UTF-8');
        echo '    <script src="' . $src . '"></script>' . "\n";
    }
}
