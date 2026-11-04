<?php
error_reporting(E_ALL);
ini_set("display_errors", 1);
echo "<script>console.log('Chargement footer.php');</script>";
include("connect.php");
include("connect_admin.php");
require_once __DIR__ . '/inc/assets.php';

function date_fran() {
    $mois = array("janvier", "février", "mars",
                  "avril","mai", "juin",
                  "juillet", "août","septembre",
                  "octobre", "novembre", "décembre");
    $jours = array("Dimanche", "Lundi", "Mardi",
                   "Mercredi", "Jeudi", "Vendredi",
                   "Samedi");
    return $jours[date("w")]." ".date("j")." ".
           $mois[date("n")-1]." ".date("Y");
}

$countAll = $bdd_admin->query('SELECT COUNT(*) FROM rss_post WHERE id_theme > 0')->fetchColumn();
$countToday = $bdd_admin->query('SELECT COUNT(*) FROM rss_post WHERE DATE(date) = CURDATE() AND id_theme > 0')->fetchColumn();
$countArchived = $bdd->query('SELECT COUNT(*) FROM archives WHERE login_user ='.intval($_SESSION["ID_UTILISATEUR"]))->fetchColumn();
?>
    <div id="footer">
        <div class="wrapper">
        <?php
        ?>
            <p id="date">
                <i class="icon-time icon-white right_margin"></i>Nous sommes le <strong>
                <?php echo date_fran(); ?></strong>.
            </p>
            <p id="logged_users">
                <?php
                     $stmt = $bdd->query('SELECT login_user FROM users WHERE last_connexion > \''.date("Y-m-d H:i:s", mktime(date("H"), date("i")-30, date("s"), date("m"),date("d"),date("Y"))).'\' AND id_user != '.intval($_SESSION["ID_UTILISATEUR"]).' ORDER BY id_user');
                 ?>
                <i class="icon-user icon-white right_margin"></i>Actuellement connecté(s) :<strong>
                <?php
                    echo ucfirst($_SESSION["NOM_UTILISATEUR"]);
                     while ($users = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        echo ', '.ucfirst($users['login_user']);
                    }
                ?>
                </strong>
            </p>
            <p id="count">
                <i class="icon-th-list icon-white right_margin"></i>Il y a actuellement <strong><?php echo $countAll; ?></strong> article(s) dans le Dash dont <strong><?php echo $countToday; ?></strong> publié(s) aujourd'hui.<br/>
                <i class="icon-download-alt icon-white right_margin"></i>Vous avez archivé <strong><?php echo $countArchived; ?></strong> article(s).
            </p>
            <p id="copyright"><a href="http://www.electronlibre.info">Tous droits réservés - Copyright © 2012 ElectronLibre</a><br/><a href="help.php">Aide</a> - <a href="mailto:dash@electronlibre.info">Contact</a> - <a href="#">Mentions légales</a></p>
        </div>
    </div>
<?php dash_electron_render_client_guard(); ?>
<script src="js/scripts.js"></script>
<?php dash_electron_render_lightbox_js(); ?>
<script src="<?= htmlspecialchars(dash_electron_asset('js/init_index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
<script>
  document.addEventListener("DOMContentLoaded", function() {
    if (typeof twttr !== 'undefined' && twttr.widgets && typeof twttr.widgets.load === 'function') {
      twttr.widgets.load();
    }
  });
</script>
</body>
</html>
