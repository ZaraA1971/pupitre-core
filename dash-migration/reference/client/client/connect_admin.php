<?php
/**
 * Connexion PDO admin_dash via shared/bootstrap.php.
 * Peut être inclus plusieurs fois sans rouvrir la connexion.
 */
require_once dirname(__DIR__) . '/shared/bootstrap.php';

qualif_bootstrap();

global $bdd_admin;
if (!($bdd_admin instanceof PDO)) {
    $bdd_admin = qualif_pdo('admin_dash');
}
