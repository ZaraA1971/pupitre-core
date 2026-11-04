<?php
/**
 * Connexion PDO dash_electron via shared/bootstrap.php.
 * Peut être inclus plusieurs fois sans rouvrir la connexion.
 */
require_once dirname(__DIR__) . '/shared/bootstrap.php';

qualif_bootstrap();

if (!defined('DB_NAME')) {
    define('DB_NAME', 'dash_electron');
}

global $bdd;
if (!($bdd instanceof PDO)) {
    $bdd = qualif_pdo(DB_NAME);
}
