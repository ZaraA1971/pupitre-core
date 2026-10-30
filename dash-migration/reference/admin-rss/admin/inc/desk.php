<?php
declare(strict_types=1);

/**
 * Qualif → Desk (Astro) : création de brouillons via POST /api/desk/articles.
 *
 * Config : /etc/electronlibre/qualif-desk-ingest.php
 *   return ['url' => 'http://127.0.0.1:8787/api/desk/articles', 'key' => '...'];
 */

/** @return array{url:string,key:string} */
function dash_admin_desk_credentials(): array
{
    static $cfg = null;
    if ($cfg !== null) {
        return $cfg;
    }

    $candidates = [
        '/etc/electronlibre/qualif-desk-ingest.php',
        __DIR__ . '/../desk_ingest.local.php',
    ];

    foreach ($candidates as $path) {
        if (!is_readable($path)) {
            continue;
        }
        $data = include $path;
        if (!is_array($data)) {
            continue;
        }
        $url = isset($data['url']) && is_string($data['url']) ? trim($data['url']) : '';
        $key = isset($data['key']) && is_string($data['key']) ? trim($data['key']) : '';
        if ($url === '' || $key === '') {
            continue;
        }
        return $cfg = ['url' => $url, 'key' => $key];
    }

    throw new RuntimeException(
        'Configuration Desk ingest introuvable (qualif-desk-ingest.php).'
    );
}

/**
 * Crée un brouillon dans le Desk.
 *
 * @param array{title:string,body:string,slug?:string,author?:string,author_slug?:string,author_user_id?:int,source_url?:string,access?:string,lang?:string} $article
 * @return array{article_id:int,slug:string}
 */
function dash_admin_desk_create_draft(array $article): array
{
    $cfg = dash_admin_desk_credentials();
    $payload = [
        'title' => (string) ($article['title'] ?? 'Sans titre'),
        'body' => (string) ($article['body'] ?? ''),
        'draft' => true,
        'lang' => (string) ($article['lang'] ?? 'fr'),
        'access' => ($article['access'] ?? '') === 'granted' ? 'granted' : 'subscribers',
        // Auteur rédaction par défaut : Emmanuel Torregano (el_users #1)
        'author' => (string) ($article['author'] ?? 'Emmanuel Torregano'),
        'author_slug' => (string) ($article['author_slug'] ?? 'admin'),
        'author_user_id' => (int) ($article['author_user_id'] ?? 1),
    ];
    if (!empty($article['slug'])) {
        $payload['slug'] = (string) $article['slug'];
    }
    if (!empty($article['source_url'])) {
        $payload['source_url'] = (string) $article['source_url'];
    }

    $ch = curl_init($cfg['url']);
    if ($ch === false) {
        throw new RuntimeException('curl_init Desk impossible.');
    }

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-Desk-Ingest-Key: ' . $cfg['key'],
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    ]);

    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno !== 0) {
        throw new RuntimeException('Desk HTTP : ' . $error);
    }

    $data = is_string($raw) ? json_decode($raw, true) : null;
    if ($status < 200 || $status >= 300 || !is_array($data)) {
        $msg = is_array($data) && isset($data['error'])
            ? (string) $data['error']
            : ('HTTP ' . $status);
        throw new RuntimeException('Desk refus : ' . $msg);
    }

    $article = $data['article'] ?? null;
    if (!is_array($article)) {
        throw new RuntimeException('Desk : article manquant dans la réponse.');
    }
    // rowToArticle → { id, data: { article_id, slug, … }, body }
    $meta = is_array($article['data'] ?? null) ? $article['data'] : $article;
    $articleId = (int) ($meta['article_id'] ?? $meta['wp_id'] ?? 0);
    if ($articleId <= 0) {
        throw new RuntimeException('Desk : article_id manquant dans la réponse.');
    }

    return [
        'article_id' => $articleId,
        'slug' => (string) ($meta['slug'] ?? ''),
    ];
}
