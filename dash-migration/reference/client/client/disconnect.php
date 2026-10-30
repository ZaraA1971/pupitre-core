<?php

require_once dirname(__DIR__) . '/shared/Session.php';

$sessionTtl = 24 * 60 * 60;
QualifSession::start(__DIR__, $sessionTtl);

if (QualifSession::isGuest()) {
    header('Location: login.php');
    exit;
}

session_unset();
session_destroy();

header('Location: login.php');
exit;
