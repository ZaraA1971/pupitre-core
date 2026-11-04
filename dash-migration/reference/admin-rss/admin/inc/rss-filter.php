<?php
declare(strict_types=1);

function estArticlePublicitaire($titre, $texte)
{
    $excluded_words = [
        'promo', 'promotion', 'publicité', 'black friday',
        'bon plan', 'bons plans', 'soldes',
        'partenaire', 'sponsorisé', 'sponsorisée', 'cashback', 'affiliation',
        'gratuit pendant', 'offre exclusive', 'réduction exclusive',
        'jusqu\'à -', 'jusqu\'à –', 'prix barré',
        'discount', 'coupon', 'sale',
        'advertisement', 'sponsored',
        'special offer', 'limited offer',
        'deal ends', 'free trial', 'buy one get',
    ];

    $contenu = mb_strtolower($titre . ' ' . $texte, 'UTF-8');

    foreach ($excluded_words as $mot) {
        if (mb_strpos($contenu, mb_strtolower($mot, 'UTF-8'), 0, 'UTF-8') !== false) {
            return true;
        }
    }

    return false;
}

function dash_admin_keyword_match_in_text(string $haystack, string $needle): bool
{
    $needle = trim($needle);
    if ($needle === '' || mb_strlen($needle, 'UTF-8') < 2) {
        return false;
    }

    $h = mb_strtolower($haystack, 'UTF-8');
    $n = mb_strtolower($needle, 'UTF-8');
    $q = preg_quote($n, '/');

    return (bool) preg_match('/(?:^|[^\p{L}\p{N}_])' . $q . '(?:$|[^\p{L}\p{N}_])/u', $h);
}

function estArticleFluxBruit(string $titre, string $texte): bool
{
    $phrases = [
        'communiqué de presse', 'press release', 'media advisory',
        'sponsored by', 'paid partnership', 'contenu partenaire', 'contenu sponsorisé',
        'brand voice', 'brandvoice', 'native advertising',
        'shop now', 'buy now', 'order now', 'limited time offer', 'flash sale',
        'deal of the day', 'prime day', '% off', 'percent off', 'gratuit pour',
        'code promo exclusif', 'lien affilié', 'lien d\'affiliation',
        'you won\'t believe', 'doctors hate', 'simple trick',
        'one weird trick', 'click here to', 'subscribe to win',
    ];

    $titreLower = mb_strtolower($titre, 'UTF-8');
    $texteLower = mb_strtolower($texte, 'UTF-8');
    $bloc = $titreLower . "\n" . $texteLower;

    foreach ($phrases as $p) {
        if (mb_strpos($bloc, $p, 0, 'UTF-8') !== false) {
            return true;
        }
    }

    return false;
}

function dash_admin_index_promo_sql_fragment(): string
{
    static $fragment = null;
    if ($fragment !== null) {
        return $fragment;
    }

    $conditions = [
        'r.title NOT LIKE "%bon plan%"',
        'r.title NOT LIKE "%promo%"',
        'r.title NOT LIKE "%offre%"',
        'r.title NOT LIKE "%réduction%"',
        'r.text NOT LIKE "%code promo%"',
    ];

    return $fragment = "\n                  AND " . implode("\n                  AND ", $conditions);
}

/** Articles visibles dans « Le flux » (index admin). */
function dash_admin_rss_inbox_sql(?string $alias = null): string
{
    $p = ($alias !== null && $alias !== '') ? $alias . '.' : '';

    return $p . 'bin = 0 AND ' . $p . 'new = 1 AND ' . $p . 'sent = 0 AND ' . $p . 'deleted = 0';
}

/** Inbox éditoriale : exclut les sources espace Vigie. */
function dash_admin_rss_editorial_inbox_sql(?string $alias = null): string
{
    $p = ($alias !== null && $alias !== '') ? $alias . '.' : '';

    return dash_admin_rss_inbox_sql($alias)
        . ' AND ' . $p . "source NOT IN (SELECT name FROM rss_url WHERE audience = 'vigie')";
}

/** Inbox Vigie uniquement (pont infos). */
function dash_admin_rss_vigie_inbox_sql(?string $alias = null): string
{
    $p = ($alias !== null && $alias !== '') ? $alias . '.' : '';

    return dash_admin_rss_inbox_sql($alias)
        . ' AND ' . $p . "source IN (SELECT name FROM rss_url WHERE audience = 'vigie')";
}

/** @return list<string> */
function dash_admin_rss_vigie_themes(): array
{
    return ['politique', 'international', 'economie', 'hightech', 'societe'];
}

function dash_admin_rss_normalize_audience(mixed $raw, bool $isVigieCheckbox = false): string
{
    if ($isVigieCheckbox || (string) $raw === 'vigie') {
        return 'vigie';
    }

    return 'editorial';
}

function dash_admin_rss_normalize_theme(string $audience, mixed $raw): ?string
{
    if ($audience !== 'vigie') {
        return null;
    }
    $theme = strtolower(trim((string) $raw));
    if (!in_array($theme, dash_admin_rss_vigie_themes(), true)) {
        return null;
    }

    return $theme;
}

/** @return array<string,string> */
function dash_admin_rss_theme_labels(): array
{
    return [
        'politique' => 'Politique',
        'international' => 'International',
        'economie' => 'Économie',
        'hightech' => 'High-tech',
        'societe' => 'Société',
    ];
}

function dash_admin_rss_theme_label(string $themeKey): string
{
    $key = strtolower(trim($themeKey));
    if ($key === '') {
        return '';
    }
    $labels = dash_admin_rss_theme_labels();

    return $labels[$key] ?? $themeKey;
}

/** « High-tech · Ars Technica » → journal seul. */
function dash_admin_rss_journal_from_source(string $feedName): string
{
    $name = trim($feedName);
    if ($name === '') {
        return '';
    }
    $sep = ' · ';
    if (function_exists('mb_strpos') && mb_strpos($name, $sep) !== false) {
        return trim((string) mb_substr($name, mb_strpos($name, $sep) + mb_strlen($sep)));
    }
    $pos = strpos($name, $sep);
    if ($pos !== false) {
        return trim(substr($name, $pos + strlen($sep)));
    }

    return $name;
}

/** Articles dans la boîte d'envoi. */
function dash_admin_rss_sent_sql(?string $alias = null): string
{
    $p = ($alias !== null && $alias !== '') ? $alias . '.' : '';

    return $p . 'bin = 0 AND ' . $p . 'sent = 1 AND ' . $p . 'deleted = 0';
}

function dash_admin_rss_deleted_sql(?string $alias = null): string
{
    $p = ($alias !== null && $alias !== '') ? $alias . '.' : '';

    return $p . 'deleted = 1';
}

/** Compte cohérent avec les listes admin (nav, pagination). */
function dash_admin_rss_count(PDO $bdd, string $where): int
{
    return (int) $bdd->query('SELECT COUNT(*) FROM rss_post WHERE ' . $where)->fetchColumn();
}
