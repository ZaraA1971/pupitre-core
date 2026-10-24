<?php
declare(strict_types=1);

/** Répertoire cache SimplePie (créé si absent). */
function dash_admin_simplepie_cache_dir(): string
{
    $dir = dirname(__DIR__) . '/cache';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    return $dir;
}

/** Configure SimplePie pour l’ingestion RSS (cache, timeout, user-agent). */
function dash_admin_simplepie_configure(SimplePie $feed, array $options = []): void
{
    $cacheDuration = (int) ($options['cache_duration'] ?? 900);
    $timeout = (int) ($options['timeout'] ?? 20);
    $enableCache = !array_key_exists('enable_cache', $options) || !empty($options['enable_cache']);

    $feed->set_cache_duration($cacheDuration);
    $feed->set_cache_location(dash_admin_simplepie_cache_dir());
    $feed->set_useragent('LeDash/1.0 (+https://dash.electronlibre.info/)');
    $feed->force_feed(true);
    $feed->set_timeout($timeout);
    $feed->enable_cache($enableCache);
}

/**
 * @return array{ok: bool, url?: string, error?: string}
 */
function dash_admin_rss_convert_feed_url(string $url): array
{
    $url = trim($url);
    if ($url === '') {
        return ['ok' => false, 'error' => 'URL du flux vide.'];
    }

    $simplepie = __DIR__ . '/../simplepie.inc';
    if (!is_readable($simplepie)) {
        return ['ok' => false, 'error' => 'Bibliothèque SimplePie introuvable.'];
    }

    require_once $simplepie;

    $feed = new SimplePie();
    $feed->set_feed_url($url);
    $feed->init();
    $feed->handle_content_type();

    if ($feed->error()) {
        return ['ok' => false, 'error' => (string) $feed->error()];
    }

    $converted = $feed->subscribe_url();

    if ($converted === null || $converted === '') {
        return ['ok' => false, 'error' => 'Impossible de convertir ce flux RSS. Vérifiez l\'URL.'];
    }

    return ['ok' => true, 'url' => $converted];
}

/**
 * @return array{ok: bool, error?: string}
 */
function dash_admin_rss_probe_feed_url(string $url, int $timeoutSeconds = 2): array
{
    $url = trim($url);
    if ($url === '') {
        return ['ok' => false, 'error' => 'URL vide.'];
    }

    $simplepie = __DIR__ . '/../simplepie.inc';
    if (!is_readable($simplepie)) {
        return ['ok' => false, 'error' => 'Bibliothèque SimplePie introuvable.'];
    }

    require_once $simplepie;

    $feed = new SimplePie();
    $feed->set_feed_url($url);
    $feed->enable_cache(false);
    $feed->force_feed(true);
    $feed->set_stupidly_fast(true);
    $feed->set_timeout(max(1, min(30, $timeoutSeconds)));
    $feed->init();
    $feed->handle_content_type();

    if ($feed->error()) {
        return ['ok' => false, 'error' => (string) $feed->error()];
    }

    return ['ok' => true];
}
