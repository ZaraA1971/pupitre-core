<?php
declare(strict_types=1);

/**
 * Bootstrap Dash — PDO factory + gestion d'erreurs.
 * Secrets : /etc/electronlibre/qualif-db.php (hors webroot — nom de fichier legacy).
 */

function qualif_bootstrap(): void
{
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
}

/** @return array{host:string,charset:string,user:string,pass:string} */
function qualif_db_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $path = '/etc/electronlibre/qualif-db.php';
    if (!is_readable($path)) {
        throw new RuntimeException('Configuration base qualif introuvable.');
    }

    $loaded = require $path;
    if (!is_array($loaded)) {
        throw new RuntimeException('qualif-db.php doit retourner un tableau.');
    }

    foreach (['host', 'charset', 'user', 'pass'] as $key) {
        if (empty($loaded[$key]) || !is_string($loaded[$key])) {
            throw new RuntimeException("qualif-db.php : clé manquante ($key).");
        }
    }

    $config = $loaded;
    return $config;
}

/** Racine web Dash (parent de shared/). Surcharge : env DASH_ROOT ou QUALIF_ROOT (legacy). */
function dash_root(): string
{
    static $root = null;
    if ($root !== null) {
        return $root;
    }

    foreach (['DASH_ROOT', 'QUALIF_ROOT'] as $var) {
        $env = getenv($var);
        if (is_string($env) && $env !== '') {
            return $root = rtrim($env, '/');
        }
    }

    return $root = dirname(__DIR__);
}

/** @deprecated alias — utiliser dash_root() */
function qualif_root(): string
{
    return dash_root();
}

/**
 * Lit une clé d’env Dash / LLM.
 * Fichiers (premier trouvé gagne) : qualif-llm.env, qualif.env, puis getenv.
 * qualif-llm.env = secrets LLM lisibles www-data (OPENAI_*).
 */
function qualif_env(string $key): ?string
{
    static $fileEnv = null;
    if ($fileEnv === null) {
        $fileEnv = [];
        foreach ([
            '/etc/electronlibre/qualif-llm.env',
            '/etc/electronlibre/qualif.env',
        ] as $path) {
            if (!is_readable($path)) {
                continue;
            }
            foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') {
                    continue;
                }
                $pos = strpos($line, '=');
                if ($pos === false) {
                    continue;
                }
                $name = trim(substr($line, 0, $pos));
                $value = trim(substr($line, $pos + 1), " \t\"'");
                // Premier fichier qui définit la clé l’emporte.
                if ($name !== '' && !array_key_exists($name, $fileEnv)) {
                    $fileEnv[$name] = $value;
                }
            }
        }
    }

    if (array_key_exists($key, $fileEnv)) {
        return $fileEnv[$key];
    }

    $fromEnv = getenv($key);
    return is_string($fromEnv) && $fromEnv !== '' ? $fromEnv : null;
}

function qualif_pdo(string $database): PDO
{
    static $pool = [];

    if (isset($pool[$database])) {
        return $pool[$database];
    }

    if (!preg_match('/^[a-z0-9_]+$/', $database)) {
        throw new InvalidArgumentException('Nom de base invalide.');
    }

    $cfg = qualif_db_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $cfg['host'],
        $database,
        $cfg['charset']
    );

    $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES ' . $cfg['charset'],
    ]);

    $pool[$database] = $pdo;
    return $pdo;
}
