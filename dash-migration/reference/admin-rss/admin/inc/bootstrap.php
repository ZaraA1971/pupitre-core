<?php
declare(strict_types=1);

/**
 * Bootstrap dash_admin — PDO admin_dash via shared/bootstrap.php + /etc/electronlibre/qualif-db.php.
 */
function dash_admin_boot(array $options = []): PDO
{
    global $bdd;

    $timezone = $options['timezone'] ?? 'Europe/Paris';
    if ($timezone !== '') {
        date_default_timezone_set($timezone);
    }

    if (!isset($bdd) || !$bdd instanceof PDO) {
        require_once dirname(__DIR__) . '/connect.php';
    }

    return $bdd;
}
