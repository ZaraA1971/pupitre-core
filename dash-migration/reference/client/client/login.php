<?php
error_reporting(0);

require_once __DIR__ . '/inc/bootstrap.php';
require_once dirname(__DIR__) . '/shared/Password.php';
require_once dirname(__DIR__) . '/shared/Auth.php';

include('connect.php');

$sessionTtl = 24 * 60 * 60;
require_once dirname(__DIR__) . '/shared/Session.php';
QualifSession::start(__DIR__, $sessionTtl);

if (QualifAuth::sessionValidForRedirect($bdd, __DIR__, $sessionTtl)) {
    header('Location: index.php');
    exit;
}

$masquer_formulaire = false;

if (isset($_POST['BT_Envoyer'])) {
    if (!preg_match('/^[A-Za-z0-9_]{4,20}$/', $_POST['TB_Nom_Utilisateur'])) {
        $message = "Votre nom d'utilisateur doit comporter entre 4 et 20 caractères<br />\n";
        $message .= "L'utilisation de l'underscore est autorisée";
    } elseif (!preg_match('/^[A-Za-z0-9]{4,}$/', $_POST['TB_Mot_de_Passe'])) {
        $message = 'Votre mot de passe doit comporter au moins 4 caractères';
    } else {
        $stmt = $bdd->prepare('SELECT id_user, login_user, pass_user, active_user FROM users WHERE login_user = :login');
        $stmt->execute(['login' => $_POST['TB_Nom_Utilisateur']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $message = 'Le nom d\'utilisateur ' . htmlspecialchars($_POST['TB_Nom_Utilisateur']) . ' n\'existe pas';
        } elseif ((int) $row['active_user'] === 0) {
            $message = 'Votre compte utilisateur n\'a pas été activé';
        } elseif (!QualifPassword::verify($_POST['TB_Mot_de_Passe'], $row['pass_user'], $bdd, (int) $row['id_user'])) {
            $message = 'Votre mot de passe est incorrect';
        } else {
            QualifAuth::loginUser($row);
            header('Location: index.php');
            exit;
        }
    }
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Le Dash - Electron Libre</title>
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
<link rel="stylesheet" type="text/css" href="css/login.css"/>
</head>

<body>
    <div id="login">
        <a href="http://www.electronlibre.info"><img src="img/logo.png" alt="Electron Libre" id="logo"/></a>
<?php if (isset($message)) { ?>
     <p><?php echo $message; ?></p>
<?php } if ($masquer_formulaire != true) { ?>

        <form name="loginform" id="loginform" action="login.php" method="post">
            <h1>Connexion au dash Electron Libre</h1>
            <p>
                <label>Nom d'utilisateur<br />
                <input type="text" name="TB_Nom_Utilisateur" id="user_login" class="input" value="" size="20" tabindex="10" /></label>
            </p>
            <p>
                <label>Mot de passe<br />
                <input type="password" name="TB_Mot_de_Passe" id="user_pass" class="input" value="" size="20" tabindex="20" /></label>
            </p>
            <p class="submit">
                <input type="submit" name="BT_Envoyer" id="submit" class="button-primary" value="Se connecter" tabindex="100" />
            </p>
        </form>
        <p id="nav">
            <a href="register.php">Cliquez ici pour créer un compte utilisateur</a> | © 2011 Electron Libre
        </p>
<?php } ?>
    </div>
</body>
</html>
