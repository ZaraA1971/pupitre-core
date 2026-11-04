<?php
declare(strict_types=1);

/**
 * Bootstrap page dash_electron (session + PDO + auth optionnelle).
 */
function dash_electron_boot(bool $requireLogin = true, bool $allowGuest = false): void
{
    require_once dirname(__DIR__, 2) . '/shared/bootstrap.php';
    require_once dirname(__DIR__, 2) . '/shared/Session.php';
    require_once dirname(__DIR__, 2) . '/shared/Auth.php';

    qualif_bootstrap();

    $sessionTtl = 12 * 31 * 24 * 60 * 60;
    QualifSession::start(dirname(__DIR__), $sessionTtl);

    global $bdd;
    if (!$bdd instanceof PDO) {
        require dirname(__DIR__) . '/connect.php';
    }

    if ($allowGuest && QualifSession::isGuest()) {
        QualifSession::setGuest();
    }

    if ($requireLogin) {
        QualifAuth::requireLogin($bdd, dirname(__DIR__), $sessionTtl);
    }
}

/** Charge PDO admin_dash en plus du boot standard (endpoints AJAX notifications). */
function dash_electron_boot_ajax(): void
{
    dash_electron_boot(true);
    require_once dirname(__DIR__) . '/connect_admin.php';
}

/** @return PDO */
function dash_electron_pdo(): PDO
{
    global $bdd;
    if (!$bdd instanceof PDO) {
        require dirname(__DIR__) . '/connect.php';
    }

    return $bdd;
}
