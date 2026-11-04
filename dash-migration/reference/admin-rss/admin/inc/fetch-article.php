<?php
declare(strict_types=1);

/**
 * Butinage article pour envoi Desk — HTTP multi-UA + extraction DOM.
 * Remplace l’ancien file_get_contents + regex (trop fragile : 9to5mac, Quartz…).
 */

/** Longueur mini jugée « corps d’article » (sinon on tente une autre stratégie). */
const DASH_FETCH_MIN_CHARS = 280;

/**
 * Texte RSS le plus riche pour un item (description + content:encoded).
 */
function dash_admin_rss_item_plain_text(SimplePie_Item $item): string
{
    $parts = [];
    foreach ([$item->get_description(), $item->get_content()] as $raw) {
        $plain = dash_admin_normalize_plain(strip_tags((string) $raw));
        if ($plain !== '' && !dash_admin_is_blocked_or_junk_text($plain)) {
            $parts[] = $plain;
        }
    }
    if ($parts === []) {
        return '';
    }
    usort($parts, static fn(string $a, string $b): int => mb_strlen($b) <=> mb_strlen($a));
    return $parts[0];
}

/**
 * URL flux RSS configurée pour une source ou un domaine d’article.
 */
function dash_admin_feed_url_for_source(PDO $bdd, string $source, string $link = ''): ?string
{
    static $bySource = null;
    static $byHost = null;
    if ($bySource === null) {
        $bySource = [];
        $byHost = [];
        $rows = $bdd->query('SELECT url, name FROM rss_url')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            $url = trim((string) ($row['url'] ?? ''));
            $name = trim((string) ($row['name'] ?? ''));
            if ($url !== '' && $name !== '') {
                $bySource[mb_strtolower($name)] = $url;
            }
            $host = parse_url($url, PHP_URL_HOST);
            if (is_string($host) && $host !== '') {
                $byHost[mb_strtolower(preg_replace('/^www\./', '', $host))] = $url;
            }
        }
    }

    $srcKey = mb_strtolower(trim($source));
    if ($srcKey !== '' && isset($bySource[$srcKey])) {
        return $bySource[$srcKey];
    }

    $linkHost = parse_url($link, PHP_URL_HOST);
    if (is_string($linkHost) && $linkHost !== '') {
        $hostKey = mb_strtolower(preg_replace('/^www\./', '', $linkHost));
        if (isset($byHost[$hostKey])) {
            return $byHost[$hostKey];
        }
    }

    return null;
}

/**
 * Relecture RSS au moment de l’envoi Desk (items déjà en base sans extrait).
 */
function dash_admin_rss_text_for_post(PDO $bdd, string $link, string $source): ?string
{
    $link = trim($link);
    if ($link === '') {
        return null;
    }

    $feedUrl = dash_admin_feed_url_for_source($bdd, $source, $link);
    if ($feedUrl === null) {
        return null;
    }

    if (!class_exists('SimplePie', false)) {
        $simplePie = dirname(__DIR__) . '/simplepie.inc';
        if (!is_readable($simplePie)) {
            return null;
        }
        require_once $simplePie;
    }

    $feed = new SimplePie();
    $feed->set_feed_url($feedUrl);
    $feed->enable_cache(false);
    $feed->set_timeout(12);
    $feed->init();
    if ($feed->error()) {
        return null;
    }

    $linkNorm = rtrim(mb_strtolower($link), '/');
    $linkPath = parse_url($link, PHP_URL_PATH);
    $linkTail = is_string($linkPath) ? basename($linkPath) : '';

    foreach ($feed->get_items(0, 100) as $item) {
        $perm = trim((string) $item->get_permalink());
        if ($perm === '') {
            continue;
        }
        $permNorm = rtrim(mb_strtolower($perm), '/');
        $matches = $permNorm === $linkNorm;
        if (!$matches && $linkTail !== '') {
            $permTail = basename(parse_url($perm, PHP_URL_PATH) ?: '');
            $matches = $permTail !== '' && $permTail === $linkTail;
        }
        if (!$matches) {
            continue;
        }

        $text = dash_admin_rss_item_plain_text($item);
        return $text !== '' ? $text : null;
    }

    return null;
}

/**
 * @return list<string>
 */
function dash_admin_fetch_user_agents(): array
{
    return [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        // Certains sites (ex. qz.com) renvoient 403 aux UA navigateur, mais
        // servent le HTML complet aux crawlers sociaux.
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ];
}

/**
 * GET HTML avec repli multi-UA.
 */
function dash_admin_http_get_html(string $url): ?string
{
    if (!function_exists('curl_init')) {
        $ctx = stream_context_create([
            'http' => [
                'timeout' => 20,
                'header' => "User-Agent: Mozilla/5.0\r\nAccept: text/html\r\n",
                'follow_location' => 1,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);
        $html = @file_get_contents($url, false, $ctx);
        return is_string($html) && $html !== '' ? $html : null;
    }

    $best = null;
    $bestLen = 0;

    foreach (dash_admin_fetch_user_agents() as $ua) {
        $ch = curl_init($url);
        if ($ch === false) {
            continue;
        }
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 25,
            CURLOPT_USERAGENT => $ua,
            CURLOPT_HTTPHEADER => [
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language: en-US,en;q=0.9,fr;q=0.8',
                'Cache-Control: no-cache',
                'Referer: https://www.google.com/',
            ],
            CURLOPT_ENCODING => '',
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!is_string($body) || $body === '' || $status < 200 || $status >= 400) {
            continue;
        }
        // Écarter les challenges Cloudflare / pages soft-block même en HTTP 200.
        if (preg_match(
            '/cf-browser-verification|attention required|just a moment\.\.\.|enable javascript and cookies to continue/i',
            $body
        )) {
            continue;
        }
        $len = strlen($body);
        if ($len > $bestLen) {
            $best = $body;
            $bestLen = $len;
        }
        // Assez de HTML pour extraire : inutile de continuer.
        if ($len > 20000) {
            break;
        }
    }

    return $best;
}

function dash_admin_normalize_plain(string $text): string
{
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/[ \t]+/u', ' ', $text) ?? $text;
    $text = preg_replace('/\R{3,}/u', "\n\n", $text) ?? $text;
    return trim($text);
}

function dash_admin_is_boilerplate_paragraph(string $text): bool
{
    $t = trim($text);
    if ($t === '') {
        return true;
    }
    if (mb_strlen($t) < 40) {
        return true;
    }
    return (bool) preg_match(
        '/^(Related|Share on|Subscribe|Sign up|Read (Next|more)|Comments?|Advertisement|'
        . 'Free daily|Global business news|Getty Images|Bloomberg\s*\/|By subscribing|'
        . 'Terms of Service|Privacy Policy|Email.*?required|Follow us|Newsletter)/iu',
        $t
    );
}

/**
 * Pages anti-bot / 404 / paywall teaser — à ignorer au profit du RSS.
 */
function dash_admin_is_blocked_or_junk_text(string $text): bool
{
    $t = trim($text);
    if ($t === '') {
        return true;
    }
    return (bool) preg_match(
        '/('
        . 'security service to protect itself from online attacks'
        . '|attention required|cf-browser-verification|just a moment\.\.\.'
        . '|uh-oh\s*page not found|this is probably not the page you.re looking for'
        . '|designed to data mine or scrape the content'
        . '|enable javascript and cookies to continue'
        . '|subscribe to unlock|save \d+%\s+to unlock'
        . '|you.ve reached your (article|monthly) limit'
        . '|please log in to (continue|read)'
        . ')/iu',
        $t
    );
}

/**
 * @return list<string> XPath expressions, host-aware first.
 */
function dash_admin_article_xpath_selectors(string $host): array
{
    $host = strtolower($host);
    $specific = [];

    if (str_contains($host, '9to5mac.com') || str_contains($host, '9to5google.com') || str_contains($host, '9to5toys.com')) {
        $specific[] = "//*[contains(concat(' ', normalize-space(@class), ' '), ' post-content ')]";
    }
    if (str_contains($host, 'qz.com') || str_contains($host, 'quartz')) {
        // Quartz : un bloc payload-richtext par paragraphe — on agrège plus bas.
        $specific[] = "//*[contains(concat(' ', normalize-space(@class), ' '), ' payload-richtext ')]";
    }
    if (str_contains($host, 'lsa-conso.fr')) {
        $specific[] = "//*[contains(@class,'article-content') or contains(@class,'article__content') or contains(@class,'contenu-article')]";
        $specific[] = "//*[@itemprop='articleBody']";
    }
    if (str_contains($host, 'cnet.com')) {
        $specific[] = "//*[contains(@class,'c-pageArticle_content') or contains(@class,'article-main-body') or contains(@class,'speakableContent')]";
    }
    if (str_contains($host, 'siecledigital.fr') || str_contains($host, 'databreaches.net')) {
        $specific[] = "//*[contains(concat(' ', normalize-space(@class), ' '), ' entry-content ')]";
        $specific[] = "//*[contains(@class,'post-content')]";
    }

    return array_merge($specific, [
        "//*[@itemprop='articleBody']",
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' post-content ')]",
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' entry-content ')]",
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' article-body ')]",
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' article__body ')]",
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' story-body ')]",
        "//*[contains(@class,'payload-richtext')]",
        "//main//article",
        "//article",
        "//main",
    ]);
}

function dash_admin_node_plain_text(DOMNode $node): string
{
    // Clone pour retirer scripts/styles sans muter le DOM partagé.
    $tmp = new DOMDocument();
    $imported = $tmp->importNode($node, true);
    if (!$imported) {
        return dash_admin_normalize_plain($node->textContent ?? '');
    }
    $tmp->appendChild($imported);
    $xp = new DOMXPath($tmp);
    foreach (['//script', '//style', '//noscript', '//svg'] as $q) {
        foreach ($xp->query($q) ?: [] as $dead) {
            $dead->parentNode?->removeChild($dead);
        }
    }
    return dash_admin_normalize_plain($imported->textContent ?? '');
}

/**
 * Agrège les nœuds d’une query (utile Quartz : N blocs richtext).
 */
function dash_admin_xpath_nodes_text(DOMXPath $xp, string $expr): ?string
{
    $nodes = @$xp->query($expr);
    if (!$nodes || $nodes->length === 0) {
        return null;
    }

    // Un seul nœud « conteneur » classique.
    if ($nodes->length === 1) {
        $text = dash_admin_node_plain_text($nodes->item(0));
        return $text !== '' ? $text : null;
    }

    // Plusieurs nœuds (ex. payload-richtext) : joindre les paragraphes utiles.
    $parts = [];
    foreach ($nodes as $node) {
        $t = dash_admin_node_plain_text($node);
        if (dash_admin_is_boilerplate_paragraph($t)) {
            continue;
        }
        $parts[] = $t;
    }
    $parts = array_values(array_unique($parts));
    if ($parts === []) {
        return null;
    }
    return implode("\n\n", $parts);
}

function dash_admin_extract_jsonld_article_body(string $html): ?string
{
    if (!preg_match_all(
        '/<script[^>]+type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is',
        $html,
        $matches
    )) {
        return null;
    }

    $best = null;
    $bestLen = 0;
    $walk = function ($node) use (&$walk, &$best, &$bestLen): void {
        if (!is_array($node)) {
            return;
        }
        if (isset($node['articleBody']) && is_string($node['articleBody'])) {
            $t = dash_admin_normalize_plain(strip_tags($node['articleBody']));
            $len = mb_strlen($t);
            if ($len > $bestLen) {
                $best = $t;
                $bestLen = $len;
            }
        }
        foreach ($node as $v) {
            if (is_array($v)) {
                $walk($v);
            }
        }
    };

    foreach ($matches[1] as $json) {
        $decoded = json_decode(html_entity_decode(trim($json), ENT_QUOTES | ENT_HTML5, 'UTF-8'), true);
        if (is_array($decoded)) {
            $walk($decoded);
        }
    }

    return $bestLen >= DASH_FETCH_MIN_CHARS ? $best : null;
}

/**
 * Relie les <p> « denses » (hors nav / pubs).
 */
function dash_admin_extract_paragraph_density(DOMXPath $xp): ?string
{
    $roots = [];
    foreach (['//main', '//article', '//body'] as $rootExpr) {
        $found = @$xp->query($rootExpr);
        if ($found && $found->length > 0) {
            $roots[] = $found->item(0);
            break;
        }
    }
    if ($roots === []) {
        return null;
    }

    $ps = @$xp->query('.//p', $roots[0]);
    if (!$ps || $ps->length === 0) {
        return null;
    }

    $parts = [];
    foreach ($ps as $p) {
        $t = dash_admin_normalize_plain($p->textContent ?? '');
        if (dash_admin_is_boilerplate_paragraph($t)) {
            continue;
        }
        $parts[] = $t;
    }
    $parts = array_values(array_unique($parts));
    if (count($parts) < 2 && mb_strlen(implode('', $parts)) < DASH_FETCH_MIN_CHARS) {
        return null;
    }
    $text = implode("\n\n", $parts);
    return $text !== '' ? $text : null;
}

function dash_admin_extract_article_text(string $html, string $url = ''): ?string
{
    $host = (string) (parse_url($url, PHP_URL_HOST) ?: '');

    $fromLd = dash_admin_extract_jsonld_article_body($html);
    if ($fromLd !== null) {
        return $fromLd;
    }

    if (!class_exists('DOMDocument')) {
        $plain = dash_admin_normalize_plain(strip_tags($html));
        return $plain !== '' ? $plain : null;
    }

    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $loaded = @$dom->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_NOERROR | LIBXML_NOWARNING);
    libxml_clear_errors();
    if (!$loaded) {
        return null;
    }
    $xp = new DOMXPath($dom);

    $candidates = [];
    foreach (dash_admin_article_xpath_selectors($host) as $expr) {
        $text = dash_admin_xpath_nodes_text($xp, $expr);
        if ($text === null) {
            continue;
        }
        // Écarter les faux positifs type « related article » très courts.
        if (mb_strlen($text) < 120) {
            continue;
        }
        $candidates[] = $text;
        if (mb_strlen($text) >= DASH_FETCH_MIN_CHARS) {
            break;
        }
    }

    $density = dash_admin_extract_paragraph_density($xp);
    if ($density !== null) {
        $candidates[] = $density;
    }

    if ($candidates === []) {
        return null;
    }

    $candidates = array_values(array_filter(
        $candidates,
        static fn(string $t): bool => !dash_admin_is_blocked_or_junk_text($t)
    ));
    if ($candidates === []) {
        return null;
    }

    usort($candidates, static fn(string $a, string $b): int => mb_strlen($b) <=> mb_strlen($a));
    $best = $candidates[0];

    // Nettoyage final des scories collées en fin de page.
    $best = preg_replace(
        '/\n*(By subscribing|Terms of Service|Privacy Policy|Subscribe to .*)$/iu',
        '',
        $best
    ) ?? $best;

    $best = dash_admin_normalize_plain($best);
    return dash_admin_is_blocked_or_junk_text($best) ? null : $best;
}

/**
 * Récupère le texte utile d’une URL article.
 * $rssHint : extrait RSS (repli si butinage bloqué / trop court / page anti-bot).
 */
function dash_admin_fetch_full_article(string $url, ?string $rssHint = null): ?string
{
    $url = trim($url);
    $rssHint = $rssHint !== null ? dash_admin_normalize_plain(strip_tags($rssHint)) : '';
    if ($rssHint !== '' && dash_admin_is_blocked_or_junk_text($rssHint)) {
        $rssHint = '';
    }

    if ($url === '') {
        return $rssHint !== '' ? $rssHint : null;
    }

    $html = dash_admin_http_get_html($url);
    $extracted = null;
    if (is_string($html) && $html !== '') {
        $extracted = dash_admin_extract_article_text($html, $url);
        if (is_string($extracted) && dash_admin_is_blocked_or_junk_text($extracted)) {
            $extracted = null;
        }
    }

    // Butinage solide → priorité page. Sinon RSS (souvent seul contenu dispo derrière Cloudflare/paywall).
    if (is_string($extracted) && mb_strlen($extracted) >= DASH_FETCH_MIN_CHARS) {
        return $extracted;
    }
    if ($rssHint !== '' && mb_strlen($rssHint) >= mb_strlen((string) $extracted)) {
        return $rssHint;
    }
    if (is_string($extracted) && $extracted !== '') {
        return $extracted;
    }
    return $rssHint !== '' ? $rssHint : null;
}
