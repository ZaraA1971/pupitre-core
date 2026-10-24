<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
include 'header.php';
include 'functions.php';
require_once 'connect_admin.php';

if (!defined('DASH_ELECTRON_RSS_TEXT_MAX')) {
    define('DASH_ELECTRON_RSS_TEXT_MAX', 1200);
}

$stmtMailCount = $bdd->prepare('SELECT COUNT(*) FROM user_post_selection WHERE id_user = ?');
$stmtMailCount->execute([(int) $_SESSION['ID_UTILISATEUR']]);
$user_mail_selection = (int) $stmtMailCount->fetchColumn();
?>
<div id="send_mail"<?php echo $user_mail_selection == 0 ? ' style="display:none"' : ''; ?>>
    <p id="selection_count"><?php echo $user_mail_selection; ?></p>
    <p id="selection_description">article(s)</p>
    <p class="btn_send_mail grey2" style="margin:0 auto;"><a href="mail.php"><i class="icon-envelope right_margin"></i>Envoyer</a></p>
</div>

<div id="container">
        <div class="wrapper">
    
        <?php

        $id_keyword = 0;
        if (!empty($_GET['keyword_id'])) {
            $id_keyword = (int) $_GET['keyword_id'];
        } elseif (!empty($_GET['search_keyword'])) {
            $sk = mb_strtolower(trim((string) $_GET['search_keyword']), 'UTF-8');
            if ($sk !== '' && $sk !== 'mot-clé' && $sk !== 'rechercher un mot-clé dans cette source') {
                $reqKw = $bdd_admin->prepare('SELECT id_keyword FROM keyword WHERE LOWER(name_keyword) = ? LIMIT 1');
                $reqKw->execute([$sk]);
                $recup_id = $reqKw->fetch(PDO::FETCH_ASSOC);
                $id_keyword = $recup_id ? (int) $recup_id['id_keyword'] : 0;
            }
        }

        $last_connexion = '1970-01-01 00:00:00';
        if (!empty($_SESSION['ID_UTILISATEUR'])) {
            $reqLc = $bdd->prepare('SELECT last_connexion FROM users WHERE id_user = ?');
            $reqLc->execute([(int) $_SESSION['ID_UTILISATEUR']]);
            if ($rowLc = $reqLc->fetch(PDO::FETCH_ASSOC)) {
                $last_connexion = $rowLc['last_connexion'];
            }
            $reqLc->closeCursor();
        }
        
        //Thèmes à afficher (à partir de la table "config")
        $liste_des_themes = '';
        $reponse = $bdd->query('SELECT id_theme FROM config');
        while ($donnees = $reponse->fetch()){
            $liste_des_themes .= ''.$donnees['id_theme'].', ';
        }
        $liste_des_themes .= 999;
        $reponse->closeCursor();
        
        // Favoris (liste d'ids pour requêtes IN)
        $liste_des_favoris = '';
        $reponse = $bdd->prepare('SELECT id_post FROM favorites WHERE id_user = ?');
        $reponse->execute([(int) $_SESSION['ID_UTILISATEUR']]);
        while ($donnees = $reponse->fetch()) {
            $liste_des_favoris .= ''.$donnees['id_post'].', ';
        }
        $liste_des_favoris .= 999;
        $reponse->closeCursor();
        
        //Liste des mot-clé enregistré
        $liste_keywords = '';
        $reponse = $bdd->query('SELECT id_keyword FROM user_keyword WHERE id_user = '.intval($_SESSION["ID_UTILISATEUR"]).'');
        while ($donnees = $reponse->fetch()){
            $liste_keywords .= ''.$donnees['id_keyword'].', ';
        }
        $liste_keywords .= 9999999;
        $reponse->closeCursor();


        // Pagination
        $page = (int) (!isset($_GET["page"]) ? 1 : $_GET["page"]);
        // Nombre d'article à afficher par page
        $limit = 25;
        $startpoint = ($page * $limit) - $limit;
        
        if ((empty($_GET['keyword_id']) && empty($_GET['search_keyword'])) || isset($_GET['source'])){
        ?>
        
        <div id="user_keyword_pannel">
            <div class="keyword_panel_toolbar">
            <form action="index.php" method="get" id="add_keyword_form" class="keyword_add_form">
                <input type="text" name="search_keyword" class="autocomplete add_keyword keyword_add_input" placeholder="Tapez un mot-clé…" value="" autocomplete="off"/>
                <button type="submit" class="keyword_add_submit">Rechercher</button>
            </form>
            </div>
            <div class="keyword_panel_tags">
        <?php
            if ($liste_keywords != 9999999) {
                
                foreach (dash_keyword_trends($bdd_admin, $liste_keywords) as $keyword) {
        ?>
                <a href="index.php?keyword_id=<?php echo $keyword['id_keyword'];?>" class="grey2"><?php echo $keyword['name_keyword'].' ('.$keyword['trend'].')';?></a>
        <?php
                }
            }
        ?>
            </div>
        </div>
            
        <form action="index.php" method="get" id="search-form">
            <input type="text" name="source" class="search_source autocomplete search left" value="Source" onclick="this.value='';"/>
            <div class="input-append left" style="margin:0 0 0 2px;">
                <span class="add-on-inset" style="height:20px; line-height:20px"><i class="icon-search" style="margin-top:1px;"></i></span>
                <input type="submit" value="OK" class="search-submit left"/>
            </div>
        </form>
        <?php
        }
        
        // Si l'utilisateur a cliqué sur un mot-clé
        if (!empty($id_keyword) && !isset($_GET['source'])) {
            
        ?>
        
        <?php
            
            if (!empty($id_keyword)) { ?>
            
            <div class="keyword-view-toolbar">
            <h3>Mot-clé
            <?php
                if (isset($_GET['keyword_id'])) {
                    $get_name_keyword = $bdd_admin->prepare('SELECT name_keyword FROM keyword WHERE id_keyword = ?');
                    $get_name_keyword->execute([$id_keyword]);
                    $keyword_name = $get_name_keyword->fetch(PDO::FETCH_ASSOC);
                    $keyword = $keyword_name ? stripslashes($keyword_name['name_keyword']) : '';
                    echo '&laquo;'.htmlspecialchars($keyword, ENT_QUOTES, 'UTF-8').'&raquo;';
                    $get_name_keyword->closeCursor();
                } elseif (isset($_GET['search_keyword'])) {
                    $keyword = stripslashes((string) $_GET['search_keyword']);
                    echo '&laquo;'.htmlspecialchars($keyword, ENT_QUOTES, 'UTF-8').'&raquo;';
                }
            ?>
            </h3>
            <?php
                // On cherche si l'association existe
                $get_association = $bdd->query('SELECT * FROM user_keyword WHERE id_keyword = '.intval($id_keyword).' AND id_user = '.intval($_SESSION["ID_UTILISATEUR"]).'');
                $association = $get_association->rowCount();
                
                // Elle n'existe pas, on l'ajoute
                if ($association == 0) {
            ?>
            <form action="user_keyword.php" method="post" id="user_keyword_form">
                <input type="hidden" name="id_keyword" value="<?php echo $id_keyword; ?>"/>
                <input type="submit" name="save_keyword" id="save_keyword" value="Ajouter à votre sélection"/>
            </form>
            <?php
                } else {
            ?>
            <form action="user_keyword.php" method="post" id="user_keyword_form_2">
                <input type="hidden" name="id_keyword" value="<?php echo $id_keyword; ?>"/>
                <input type="submit" name="delete_keyword" id="delete_keyword" value="Supprimer de votre sélection"/>
            </form>
            <?php
                }
            ?>
            <a href="#" onClick="history.back(); return false;" id="message_back" class="right"><i class="icon-arrow-left icon-white right_margin"></i>Retour</a>
            </div>
            <div class="keyword-graph-block">
            <?php
            if (!defined('DASH_ELECTRON_GRAPH_EMBED')) {
                define('DASH_ELECTRON_GRAPH_EMBED', true);
            }
            include __DIR__ . '/graph.php';
             ?>
             <div id="graph_articles" class="keyword-graph-day" aria-live="polite"></div>
            </div>

            <div class="keyword-related-block">
            <script>
            // Version native JavaScript de prettyDate
            function prettyDate(timeString) {
              const date = new Date(timeString.replace(/-/g, "/").replace(/[TZ]/g, " "));
              const diff = (new Date() - date) / 1000;
              const dayDiff = Math.floor(diff / 86400);

              if (isNaN(dayDiff) || dayDiff < 0 || dayDiff >= 31) return;

              if (dayDiff === 0) {
                if (diff < 60) return "à l'instant";
                if (diff < 120) return "il y a 1 minute";
                if (diff < 3600) return "il y a " + Math.floor(diff / 60) + " minutes";
                if (diff < 7200) return "il y a 1 heure";
                if (diff < 86400) return "il y a " + Math.floor(diff / 3600) + " heures";
              }
              if (dayDiff === 1) return "Hier";
              if (dayDiff < 7) return "il y a " + dayDiff + " jours";
              return "il y a " + Math.ceil(dayDiff / 7) + " semaines";
            }

            document.addEventListener("DOMContentLoaded", function () {
              const elements = document.querySelectorAll(".prettydate");
              elements.forEach(function (el) {
                const date = prettyDate(el.title);
                if (date) el.textContent = date;
              });
            });

            </script>
            </div>
            <p id="keywordlink" class="nav2 current"><a href="#">Articles liés</a></p>
            <div id="chronologie">
                <?php
                $textLen = (int) DASH_ELECTRON_RSS_TEXT_MAX;
                $sqlCountKw = '
                    SELECT COUNT(*)
                    FROM rss_post r
                    JOIN theme t ON r.id_theme = t.id
                    WHERE r.id_theme IN ('.$liste_des_themes.')
                      AND EXISTS (
                          SELECT 1 FROM post_keyword pk WHERE pk.hash_post = r.hash AND pk.id_keyword = :id_keyword
                      )';
                $stmtCountKw = $bdd_admin->prepare($sqlCountKw);
                $stmtCountKw->execute([':id_keyword' => $id_keyword]);
                $maxKwArticles = (int) $stmtCountKw->fetchColumn();
                $totalPagesKw = max(1, (int) ceil($maxKwArticles / $limit));
                $page = min(max(1, $page), $totalPagesKw);
                $startpoint = ($page - 1) * $limit;

                // Requête principale : posts (pagination + extrait texte)
                $stmtPosts = $bdd_admin->prepare('
                    SELECT
                        r.id AS id_post,
                        r.id_theme,
                        r.source,
                        r.title,
                        LEFT(r.text, '.$textLen.') AS text,
                        r.author,
                        r.link,
                        r.hash,
                        r.alert,
                        r.date_add_theme,
                        DATE_FORMAT(r.date, \'%Y-%m-%d\') AS last_date,
                        DATE_FORMAT(r.date, \'%w\') AS numero_jour,
                        DATE_FORMAT(r.date, \'%c\') AS numero_mois,
                        DATE_FORMAT(r.date, \'%d\') AS jour,
                        DATE_FORMAT(r.date, \'%b\') AS mois,
                        DATE_FORMAT(r.date, \'%Y\') AS annee,
                        DATE_FORMAT(r.date, \'%H\') AS heure,
                        DATE_FORMAT(r.date, \'%i\') AS minute,
                        t.id AS id_theme,
                        t.name
                    FROM rss_post r
                    JOIN theme t ON r.id_theme = t.id
                    WHERE r.id_theme IN ('.$liste_des_themes.')
                      AND EXISTS (
                          SELECT 1 FROM post_keyword pk WHERE pk.hash_post = r.hash AND pk.id_keyword = :id_keyword
                      )
                    ORDER BY r.date DESC
                    LIMIT :off, :lim
                ');
                $stmtPosts->bindValue(':id_keyword', $id_keyword, PDO::PARAM_INT);
                $stmtPosts->bindValue(':off', $startpoint, PDO::PARAM_INT);
                $stmtPosts->bindValue(':lim', $limit, PDO::PARAM_INT);
                $stmtPosts->execute();

                $articles = $stmtPosts->fetchAll(PDO::FETCH_ASSOC);
                // ===== Préchargement des métriques locales (dash_electron) =====
                $nb_comments_map = [];
                $nb_favorites_map = [];
                $is_favorite_set = [];
                $is_selected_set = [];
                $is_archived_set = [];

                if (!empty($articles)) {
                    $ids = array_map('intval', array_column($articles, 'id_post'));
                    $hashes = array_values(array_unique(array_column($articles, 'hash')));

                    if (!empty($ids)) {
                        $ph_ids = implode(',', array_fill(0, count($ids), '?'));

                        // Compte commentaires par post
                        $stmt = $bdd->prepare("SELECT id_post, COUNT(*) AS c FROM comments WHERE id_post IN ($ph_ids) GROUP BY id_post");
                        $stmt->execute($ids);
                        foreach ($stmt as $row) { $nb_comments_map[(int)$row['id_post']] = (int)$row['c']; }

                        // Compte favoris par post
                        $stmt = $bdd->prepare("SELECT id_post, COUNT(*) AS c FROM favorites WHERE id_post IN ($ph_ids) GROUP BY id_post");
                        $stmt->execute($ids);
                        foreach ($stmt as $row) { $nb_favorites_map[(int)$row['id_post']] = (int)$row['c']; }

                        // Est-ce favori pour l'utilisateur ?
                        $params = array_merge([ (int)$_SESSION['ID_UTILISATEUR'] ], $ids);
                        $stmt = $bdd->prepare("SELECT id_post FROM favorites WHERE id_user = ? AND id_post IN ($ph_ids)");
                        $stmt->execute($params);
                        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) { $is_favorite_set[(int)$r['id_post']] = true; }

                        // Est-ce sélectionné pour envoi mail ?
                        $stmt = $bdd->prepare("SELECT id_post FROM user_post_selection WHERE id_user = ? AND id_post IN ($ph_ids)");
                        $stmt->execute($params);
                        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) { $is_selected_set[(int)$r['id_post']] = true; }
                    }

                    if (!empty($hashes)) {
                        $ph_hashes = implode(',', array_fill(0, count($hashes), '?'));
                        $paramsHash = array_merge([ (int)$_SESSION['ID_UTILISATEUR'] ], $hashes);
                        $stmt = $bdd->prepare("SELECT hash FROM archives WHERE login_user = ? AND hash IN ($ph_hashes)");
                        $stmt->execute($paramsHash);
                        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) { $is_archived_set[$r['hash']] = true; }
                    }
                }
                // ===== Fin préchargement métriques =====
                $count = count($articles);

                if ($count == 0) {
                    echo '<div class="post" style="padding:10px;">Il n\'y a pas d\'articles pour ce mot-clé.</div>';
                }

                // Précharger tous les mots-clés liés aux articles affichés
                $keywords_by_hash = [];
                if ($count > 0) {
                    $hashes = array_column($articles, 'hash');
                    $placeholders = implode(',', array_fill(0, count($hashes), '?'));
                    $stmtKeywords = $bdd_admin->prepare('SELECT pk.hash_post, k.id_keyword, k.name_keyword FROM post_keyword pk JOIN keyword k ON pk.id_keyword = k.id_keyword WHERE pk.hash_post IN (' . $placeholders . ')');
                    $stmtKeywords->execute($hashes);
                    $keywordsRows = $stmtKeywords->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($keywordsRows as $row) {
                        $keywords_by_hash[$row['hash_post']][] = $row;
                    }
                }

                $mois = array("", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre");
                $jours = array("Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi");

                echo '<script>console.log("Nombre de résultats:", ' . intval($count) . ');</script>';

                $last_day = '';
                foreach ($articles as $donnees) {
                    $current_day = $donnees['last_date'];
                    if ($last_day != $current_day && !empty($last_day)) {
                        $num_jour = intval($donnees['numero_jour']);
                        $num_mois = intval($donnees['numero_mois']);
                        $jour_nom = $jours[$num_jour] ?? '';
                        $mois_nom = $mois[$num_mois] ?? '';
                        echo '<div class="date_separator">' . $jour_nom . ' ' . $donnees['jour'] . ' ' . $mois_nom . ' ' . $donnees['annee'] . '</div>';
                    }
                    $last_day = $current_day;
                ?>
                <div class="post" style="clear:none;">
                    <div class="toggleinfos">
                        <p class="date grey2"><span class="hour"><?php echo $donnees['heure']; ?>H<?php echo $donnees['minute']; ?></span><br/><span class="month"><?php echo $donnees['jour']; ?>/<?php echo strtoupper($donnees['mois']); ?></span></p>
                        <p class="source"><a href="index.php?source=<?php echo urlencode($donnees['source']); ?>" class="grey2"><?php $sourceShort = couperChaineNombre(stripslashes($donnees['source']), 45); echo $sourceShort; ?></a></p>
                        <p class="title" style="width:365px"><?php $titleShort = couperChaineNombre(stripslashes($donnees['title']), 175); echo $titleShort; ?></p>
                        <?php if (($last_connexion < $donnees['date_add_theme']) && ($donnees['alert'] == 1)) { echo '<div id="new_post_alert">Alerte</div>'; } else if ($last_connexion < $donnees['date_add_theme']) { echo '<div id="new_post">Nouveau</div>'; }?>
                    </div>
                    <div class="fav_com">
                        <?php
                            $nbCom = isset($nb_comments_map[$donnees['id_post']]) ? (int)$nb_comments_map[$donnees['id_post']] : 0;
                            if ($nbCom > 0) { echo '<p class="com">' . $nbCom . '</p>'; }
                            $nbFav = isset($nb_favorites_map[$donnees['id_post']]) ? (int)$nb_favorites_map[$donnees['id_post']] : 0;
                            $isFavUser = !empty($is_favorite_set[$donnees['id_post']]);
                            $favClass = ($isFavUser ? 'fav_on ' : '') . ($nbFav === 0 ? 'fav_off' : '');
                        ?>
                        <p class="fav <?php echo $favClass; ?>"><?php if ($nbFav > 0) echo $nbFav; ?></p>
                        <span class="list_fav"></span>
                        <p class="fav_com_id"><?php echo $donnees['id_post']; ?></p>
                    </div>
                    <div class="infos">
                        <p class="text"><span class="read"><a href="<?php echo $donnees['link']; ?>" class="no-style" target="_blank"><?php $titleShort = couperChaineNombre2(stripslashes($donnees['text']), 999); echo $titleShort; ?></a></span><br/><span class="author"><i class="icon-eye-open right_margin"></i><a href="<?php echo $donnees['link']; ?>" target="_blank">Consulter l'article</a><i class="icon-edit left_margin right_margin"></i> Auteur : <strong><?php echo htmlspecialchars($donnees['author']); ?></strong></span></p>
                        <?php if (!empty($keywords_by_hash[$donnees['hash']])) { echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : '; $i=0; foreach ($keywords_by_hash[$donnees['hash']] as $kw) { if($i>0) echo ', '; echo '<a href="index.php?keyword_id=' . $kw['id_keyword'] . '" class="grey2">' . htmlspecialchars($kw['name_keyword']) . '</a>'; $i++; } } ?>
                    </div>
                </div>
                <?php }

                $current_articles = $count;
                ?>
                <?php
                $pagination_param = '';
                if (isset($_GET['keyword_id'])) $pagination_param = 'keyword_id=' . intval($_GET['keyword_id']);
                else if (isset($_GET['theme_id'])) $pagination_param = 'theme_id=' . intval($_GET['theme_id']);
                else if (isset($_GET['source'])) $pagination_param = 'source=' . urlencode($_GET['source']);
                ?>
                <?php
                // --- Calcul unifié du nombre d’articles restants ---
                $where_clause = '';
                $params = [];

                if (isset($_GET['keyword_id'])) {
                    // Vue mot-clé
                    $where_clause = 'r.id_theme IN (' . $liste_des_themes . ') AND EXISTS (SELECT 1 FROM post_keyword pk WHERE pk.hash_post = r.hash AND pk.id_keyword = :id_keyword)';
                    $params = [':id_keyword' => $id_keyword];
                } elseif (isset($_GET['theme_id'])) {
                    // Vue thème
                    $where_clause = 'r.id_theme = :theme_id';
                    $params = [':theme_id' => intval($_GET['theme_id'])];
                } elseif (isset($_GET['source'])) {
                    // Vue source
                    $where_clause = 'r.source = :source';
                    $params = [':source' => $_GET['source']];
                } elseif (isset($_GET['sort_by']) && $_GET['sort_by'] == 'favorites') {
                    // Vue favoris
                    $where_clause = 'f.id_user = :user_id';
                    $params = [':user_id' => $_SESSION['ID_UTILISATEUR']];
                } else {
                    // Chronologie par défaut
                    $where_clause = '1';
                }

                $stmt_count = $bdd_admin->prepare('SELECT COUNT(*) FROM rss_post r WHERE ' . $where_clause);
                $stmt_count->execute($params);
                $max_articles = (int)$stmt_count->fetchColumn();

                $remaining_articles = max(0, $max_articles - $startpoint - $limit);
                ?>
                <div class="pagination">
                  <?php if ($remaining_articles > 0){ ?>
                    <div class="prev">
                      <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page+1; ?>">
                        <i class="icon-arrow-left icon-white"></i> Articles précédents
                      </a>
                    </div>
                  <?php } ?>
                  <?php if ($page > 1){ ?>
                    <div class="next">
                      <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page-1; ?>">
                        Articles suivants <i class="icon-arrow-right icon-white"></i>
                      </a>
                    </div>
                  <?php } ?>
                </div>
                </div>
                                     
        <?php
            }
            else { ?>
                <h3 style="width:300px; float:left;">Erreur : Mot-clé introuvable.</h3>
                <a href="#" onClick="history.back(); return false;" id="message_back" class="right"><i class="icon-arrow-left icon-white right_margin"></i>Retour</a>
            <?php
            }
        }
        else if (isset($_GET['theme_id']) && !empty($_GET['theme_id'])) {
            // Si l'utilisateur a cliqué sur un thème
            ?>
            <p id="themelink" class="nav2 current"><a href="#">
            <?php
                $get_name_theme = $bdd_admin->prepare('SELECT name FROM theme WHERE id = ?');
                $get_name_theme->execute([(int) $_GET['theme_id']]);
                $theme_name = $get_name_theme->fetch(PDO::FETCH_ASSOC);
                echo 'Thème : ' . htmlspecialchars($theme_name ? stripslashes($theme_name['name']) : '', ENT_QUOTES, 'UTF-8');
                $get_name_theme->closeCursor();
            ?>
            </a></p><p class="back"><a href="#" onClick="history.back(); return false;"><img src="img/back.png" title="Retour" alt=""/></a></p>
            <div id="chronologie">
            <?php
            $textLen = (int) DASH_ELECTRON_RSS_TEXT_MAX;
            $themeIdView = (int) $_GET['theme_id'];
            $stmtCountTheme = $bdd_admin->prepare('SELECT COUNT(*) FROM rss_post r WHERE r.id_theme = :theme_id');
            $stmtCountTheme->execute([':theme_id' => $themeIdView]);
            $maxThemeArticles = (int) $stmtCountTheme->fetchColumn();
            $totalPagesTheme = max(1, (int) ceil($maxThemeArticles / $limit));
            $page = min(max(1, $page), $totalPagesTheme);
            $startpoint = ($page - 1) * $limit;

            // Requête principale optimisée pour la vue Thème
            $stmtPosts = $bdd_admin->prepare('
                SELECT
                    r.id AS id_post,
                    r.id_theme,
                    r.source,
                    r.title,
                    LEFT(r.text, '.$textLen.') AS text,
                    r.author,
                    r.link,
                    r.hash,
                    r.alert,
                    r.date_add_theme,
                    DATE_FORMAT(r.date, \'%Y-%m-%d\') AS last_date,
                    DATE_FORMAT(r.date, \'%w\') AS numero_jour,
                    DATE_FORMAT(r.date, \'%c\') AS numero_mois,
                    DATE_FORMAT(r.date, \'%d\') AS jour,
                    DATE_FORMAT(r.date, \'%b\') AS mois,
                    DATE_FORMAT(r.date, \'%Y\') AS annee,
                    DATE_FORMAT(r.date, \'%H\') AS heure,
                    DATE_FORMAT(r.date, \'%i\') AS minute,
                    t.id AS id_theme,
                    t.name
                FROM rss_post r
                JOIN theme t ON r.id_theme = t.id
                WHERE r.id_theme = :theme_id
                ORDER BY r.date DESC
                LIMIT :off, :lim
            ');
            $stmtPosts->bindValue(':theme_id', $themeIdView, PDO::PARAM_INT);
            $stmtPosts->bindValue(':off', $startpoint, PDO::PARAM_INT);
            $stmtPosts->bindValue(':lim', $limit, PDO::PARAM_INT);
            $stmtPosts->execute();

            $articles = $stmtPosts->fetchAll(PDO::FETCH_ASSOC);
            // ===== Préchargement des métriques locales (dash_electron) =====
            $nb_comments_map = [];
            $nb_favorites_map = [];
            $is_favorite_set = [];
            $is_selected_set = [];
            $is_archived_set = [];

            if (!empty($articles)) {
                $ids = array_map('intval', array_column($articles, 'id_post'));
                $hashes = array_values(array_unique(array_column($articles, 'hash')));

                if (!empty($ids)) {
                    $ph_ids = implode(',', array_fill(0, count($ids), '?'));

                    // Compte commentaires par post
                    $stmt = $bdd->prepare("SELECT id_post, COUNT(*) AS c FROM comments WHERE id_post IN ($ph_ids) GROUP BY id_post");
                    $stmt->execute($ids);
                    foreach ($stmt as $row) { $nb_comments_map[(int)$row['id_post']] = (int)$row['c']; }

                    // Compte favoris par post
                    $stmt = $bdd->prepare("SELECT id_post, COUNT(*) AS c FROM favorites WHERE id_post IN ($ph_ids) GROUP BY id_post");
                    $stmt->execute($ids);
                    foreach ($stmt as $row) { $nb_favorites_map[(int)$row['id_post']] = (int)$row['c']; }

                    // Est-ce favori pour l'utilisateur ?
                    $params = array_merge([ (int)$_SESSION['ID_UTILISATEUR'] ], $ids);
                    $stmt = $bdd->prepare("SELECT id_post FROM favorites WHERE id_user = ? AND id_post IN ($ph_ids)");
                    $stmt->execute($params);
                    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) { $is_favorite_set[(int)$r['id_post']] = true; }

                    // Est-ce sélectionné pour envoi mail ?
                    $stmt = $bdd->prepare("SELECT id_post FROM user_post_selection WHERE id_user = ? AND id_post IN ($ph_ids)");
                    $stmt->execute($params);
                    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) { $is_selected_set[(int)$r['id_post']] = true; }
                }

                if (!empty($hashes)) {
                    $ph_hashes = implode(',', array_fill(0, count($hashes), '?'));
                    $paramsHash = array_merge([ (int)$_SESSION['ID_UTILISATEUR'] ], $hashes);
                    $stmt = $bdd->prepare("SELECT hash FROM archives WHERE login_user = ? AND hash IN ($ph_hashes)");
                    $stmt->execute($paramsHash);
                    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) { $is_archived_set[$r['hash']] = true; }
                }
            }
            // ===== Fin préchargement métriques =====
            $count = count($articles);

            if ($count == 0) {
                echo '<div class="post" style="padding:10px;">Aucun article disponible pour ce thème.</div>';
            }

            // Précharger les mots-clés pour tous les articles affichés
            $keywords_by_hash = [];
            if ($count > 0) {
                $hashes = array_column($articles, 'hash');
                $placeholders = implode(',', array_fill(0, count($hashes), '?'));
                $stmtKeywords = $bdd_admin->prepare('SELECT pk.hash_post, k.id_keyword, k.name_keyword FROM post_keyword pk JOIN keyword k ON pk.id_keyword = k.id_keyword WHERE pk.hash_post IN (' . $placeholders . ')');
                $stmtKeywords->execute($hashes);
                $keywordsRows = $stmtKeywords->fetchAll(PDO::FETCH_ASSOC);
                foreach ($keywordsRows as $row) {
                    $keywords_by_hash[$row['hash_post']][] = $row;
                }
            }

            $mois = ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
            $jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
            $last_day = '';

            foreach ($articles as $donnees) {
                $current_day = $donnees['last_date'];
                if ($last_day != $current_day && !empty($last_day)) {
                    $num_jour = intval($donnees['numero_jour']);
                    $num_mois = intval($donnees['numero_mois']);
                    $jour_nom = $jours[$num_jour] ?? '';
                    $mois_nom = $mois[$num_mois] ?? '';
                    echo '<div class="date_separator">' . $jour_nom . ' ' . $donnees['jour'] . ' ' . $mois_nom . ' ' . $donnees['annee'] . '</div>';
                }
                $last_day = $current_day;
            ?>
                <div class="post" style="clear:none;">
                    <div class="toggleinfos">
                        <p class="date grey2"><span class="hour"><?php echo $donnees['heure']; ?>H<?php echo $donnees['minute']; ?></span><br/><span class="month"><?php echo $donnees['jour']; ?>/<?php echo strtoupper($donnees['mois']); ?></span></p>
                        <p class="source"><a href="index.php?source=<?php echo urlencode($donnees['source']); ?>" class="grey2"><?php $sourceShort = couperChaineNombre(stripslashes($donnees['source']), 45); echo $sourceShort; ?></a></p>
                        <p class="title" style="width:365px"><?php $titleShort = couperChaineNombre(stripslashes($donnees['title']), 175); echo $titleShort; ?></p>
                        <?php if (($last_connexion < $donnees['date_add_theme']) && ($donnees['alert'] == 1)) { echo '<div id="new_post_alert">Alerte</div>'; } else if ($last_connexion < $donnees['date_add_theme']) { echo '<div id="new_post">Nouveau</div>'; }?>
                    </div>
                <div class="fav_com">
                    <?php
                        $nbCom = isset($nb_comments_map[$donnees['id_post']]) ? (int)$nb_comments_map[$donnees['id_post']] : 0;
                        if ($nbCom > 0) { echo '<p class="com">' . $nbCom . '</p>'; }
                        $nbFav = isset($nb_favorites_map[$donnees['id_post']]) ? (int)$nb_favorites_map[$donnees['id_post']] : 0;
                        $isFavUser = !empty($is_favorite_set[$donnees['id_post']]);
                        $favClass = ($isFavUser ? 'fav_on ' : '') . ($nbFav === 0 ? 'fav_off' : '');
                    ?>
                    <p class="fav <?php echo $favClass; ?>"><?php if ($nbFav > 0) echo $nbFav; ?></p>
                    <span class="list_fav"></span>
                    <p class="fav_com_id"><?php echo $donnees['id_post']; ?></p>
                </div>
                    <div class="infos">
                        <p class="text"><span class="read"><a href="<?php echo $donnees['link']; ?>" class="no-style" target="_blank"><?php $titleShort = couperChaineNombre2(stripslashes($donnees['text']), 999); echo $titleShort; ?></a></span><br/><span class="author"><i class="icon-eye-open right_margin"></i><a href="<?php echo $donnees['link']; ?>" target="_blank">Consulter l'article</a><i class="icon-edit left_margin right_margin"></i> Auteur : <strong><?php echo htmlspecialchars($donnees['author']); ?></strong></span></p>
                        <?php if (!empty($keywords_by_hash[$donnees['hash']])) { echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : '; $i=0; foreach ($keywords_by_hash[$donnees['hash']] as $kw) { if($i>0) echo ', '; echo '<a href="index.php?keyword_id=' . $kw['id_keyword'] . '" class="grey2">' . htmlspecialchars($kw['name_keyword']) . '</a>'; $i++; } } ?>
                    </div>
                </div>
            <?php }
            $current_articles = $count;
            ?>
                <?php
                $pagination_param = '';
                if (isset($_GET['keyword_id'])) $pagination_param = 'keyword_id=' . intval($_GET['keyword_id']);
                else if (isset($_GET['theme_id'])) $pagination_param = 'theme_id=' . intval($_GET['theme_id']);
                else if (isset($_GET['source'])) $pagination_param = 'source=' . urlencode($_GET['source']);
                ?>

                <?php
                // --- Calcul unifié du nombre d’articles restants ---
                $where_clause = '';
                $params = [];

                if (isset($_GET['keyword_id'])) {
                    // Vue mot-clé
                    $where_clause = 'r.id_theme IN (' . $liste_des_themes . ') AND EXISTS (SELECT 1 FROM post_keyword pk WHERE pk.hash_post = r.hash AND pk.id_keyword = :id_keyword)';
                    $params = [':id_keyword' => $id_keyword];
                } elseif (isset($_GET['theme_id'])) {
                    // Vue thème
                    $where_clause = 'r.id_theme = :theme_id';
                    $params = [':theme_id' => intval($_GET['theme_id'])];
                } elseif (isset($_GET['source'])) {
                    // Vue source
                    $where_clause = 'r.source = :source';
                    $params = [':source' => $_GET['source']];
                } elseif (isset($_GET['sort_by']) && $_GET['sort_by'] == 'favorites') {
                    // Vue favoris
                    $where_clause = 'f.id_user = :user_id';
                    $params = [':user_id' => $_SESSION['ID_UTILISATEUR']];
                } else {
                    // Chronologie par défaut
                    $where_clause = '1';
                }

                $stmt_count = $bdd_admin->prepare('SELECT COUNT(*) FROM rss_post r WHERE ' . $where_clause);
                $stmt_count->execute($params);
                $max_articles = (int)$stmt_count->fetchColumn();

                $remaining_articles = max(0, $max_articles - $startpoint - $limit);
                ?>
                <div class="pagination">
                  <?php if ($remaining_articles > 0){ ?>
                    <div class="prev">
                      <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page+1; ?>">
                        <i class="icon-arrow-left icon-white"></i> Articles précédents
                      </a>
                    </div>
                  <?php } ?>
                  <?php if ($page > 1){ ?>
                    <div class="next">
                      <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page-1; ?>">
                        Articles suivants <i class="icon-arrow-right icon-white"></i>
                      </a>
                    </div>
                  <?php } ?>
                </div>
            </div>
            <?php
        }
        else if (isset($_GET['source']) && !empty($_GET['source'])) {
            // Si l'utilisateur a cliqué sur une source ?>
            <form action="index.php" method="get" id="add_keyword_form" class="left bot_margin">
                <input type="text" name="search_keyword" class="autocomplete search_keyword add_keyword left" value="Rechercher un mot-clé dans cette source" onclick="this.value='';"/>
                <input type="hidden" name="source" value="<?php echo htmlspecialchars((string) $_GET['source'], ENT_QUOTES, 'UTF-8'); ?>">
                <div class="input-append left" style="margin:0 0 0 2px;">
                    <span class="add-on-inset" style="height:20px; line-height:20px"><i class="icon-search" style="margin-top:1px;"></i></span>
                    <input type="submit" value="OK" class="search-submit left"/>
                </div>
            </form>
            <p id="themelink" class="nav2 current clear top_margin"><a href="#">
            <strong>Source</strong> : <?php echo htmlspecialchars(ucfirst(stripslashes((string) $_GET['source'])), ENT_QUOTES, 'UTF-8'); ?> <?php if (!empty($id_keyword)) { ?> / <strong>Mot-clé</strong> : <?php
                if (isset($_GET['keyword_id'])) {
                    $get_name_keyword = $bdd_admin->prepare('SELECT name_keyword FROM keyword WHERE id_keyword = ?');
                    $get_name_keyword->execute([$id_keyword]);
                    $keyword_name = $get_name_keyword->fetch(PDO::FETCH_ASSOC);
                    $keyword = $keyword_name ? stripslashes($keyword_name['name_keyword']) : '';
                    echo '&laquo;'.htmlspecialchars($keyword, ENT_QUOTES, 'UTF-8').'&raquo;';
                    $get_name_keyword->closeCursor();
                } elseif (isset($_GET['search_keyword'])) {
                    $keyword = stripslashes((string) $_GET['search_keyword']);
                    echo '&laquo;'.htmlspecialchars($keyword, ENT_QUOTES, 'UTF-8').'&raquo;';
                }
                }
            ?></a></p><p class="back"><a href="index.php"><img src="img/back.png" title="Retour" alt=""/></a></p>
            <div id="chronologie">
            <?php
            $textLen = (int) DASH_ELECTRON_RSS_TEXT_MAX;
            $sourceView = (string) $_GET['source'];
            $stmtCountSrc = $bdd_admin->prepare('SELECT COUNT(*) FROM rss_post r JOIN theme t ON r.id_theme = t.id WHERE r.source = :source');
            $stmtCountSrc->execute([':source' => $sourceView]);
            $maxSrcArticles = (int) $stmtCountSrc->fetchColumn();
            $totalPagesSrc = max(1, (int) ceil($maxSrcArticles / $limit));
            $page = min(max(1, $page), $totalPagesSrc);
            $startpoint = ($page - 1) * $limit;

            // Requête principale optimisée pour la vue Source
            $stmtPosts = $bdd_admin->prepare('
                SELECT
                    r.id AS id_post,
                    r.id_theme,
                    r.source,
                    r.title,
                    LEFT(r.text, '.$textLen.') AS text,
                    r.author,
                    r.link,
                    r.hash,
                    r.alert,
                    r.date_add_theme,
                    DATE_FORMAT(r.date, \'%Y-%m-%d\') AS last_date,
                    DATE_FORMAT(r.date, \'%w\') AS numero_jour,
                    DATE_FORMAT(r.date, \'%c\') AS numero_mois,
                    DATE_FORMAT(r.date, \'%d\') AS jour,
                    DATE_FORMAT(r.date, \'%b\') AS mois,
                    DATE_FORMAT(r.date, \'%Y\') AS annee,
                    DATE_FORMAT(r.date, \'%H\') AS heure,
                    DATE_FORMAT(r.date, \'%i\') AS minute,
                    t.id AS id_theme,
                    t.name
                FROM rss_post r
                JOIN theme t ON r.id_theme = t.id
                WHERE r.source = :source
                ORDER BY r.date DESC
                LIMIT :off, :lim
            ');
            $stmtPosts->bindValue(':source', $sourceView, PDO::PARAM_STR);
            $stmtPosts->bindValue(':off', $startpoint, PDO::PARAM_INT);
            $stmtPosts->bindValue(':lim', $limit, PDO::PARAM_INT);
            $stmtPosts->execute();

            $articles = $stmtPosts->fetchAll(PDO::FETCH_ASSOC);
            // ===== Préchargement des métriques locales (dash_electron) =====
            $nb_comments_map = [];
            $nb_favorites_map = [];
            $is_favorite_set = [];
            $is_selected_set = [];
            $is_archived_set = [];

            if (!empty($articles)) {
                $ids = array_map('intval', array_column($articles, 'id_post'));
                $hashes = array_values(array_unique(array_column($articles, 'hash')));

                if (!empty($ids)) {
                    $ph_ids = implode(',', array_fill(0, count($ids), '?'));

                    // Compte commentaires par post
                    $stmt = $bdd->prepare("SELECT id_post, COUNT(*) AS c FROM comments WHERE id_post IN ($ph_ids) GROUP BY id_post");
                    $stmt->execute($ids);
                    foreach ($stmt as $row) { $nb_comments_map[(int)$row['id_post']] = (int)$row['c']; }

                    // Compte favoris par post
                    $stmt = $bdd->prepare("SELECT id_post, COUNT(*) AS c FROM favorites WHERE id_post IN ($ph_ids) GROUP BY id_post");
                    $stmt->execute($ids);
                    foreach ($stmt as $row) { $nb_favorites_map[(int)$row['id_post']] = (int)$row['c']; }

                    // Est-ce favori pour l'utilisateur ?
                    $params = array_merge([ (int)$_SESSION['ID_UTILISATEUR'] ], $ids);
                    $stmt = $bdd->prepare("SELECT id_post FROM favorites WHERE id_user = ? AND id_post IN ($ph_ids)");
                    $stmt->execute($params);
                    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) { $is_favorite_set[(int)$r['id_post']] = true; }

                    // Est-ce sélectionné pour envoi mail ?
                    $stmt = $bdd->prepare("SELECT id_post FROM user_post_selection WHERE id_user = ? AND id_post IN ($ph_ids)");
                    $stmt->execute($params);
                    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) { $is_selected_set[(int)$r['id_post']] = true; }
                }

                if (!empty($hashes)) {
                    $ph_hashes = implode(',', array_fill(0, count($hashes), '?'));
                    $paramsHash = array_merge([ (int)$_SESSION['ID_UTILISATEUR'] ], $hashes);
                    $stmt = $bdd->prepare("SELECT hash FROM archives WHERE login_user = ? AND hash IN ($ph_hashes)");
                    $stmt->execute($paramsHash);
                    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) { $is_archived_set[$r['hash']] = true; }
                }
            }
            // ===== Fin préchargement métriques =====
            $count = count($articles);

            if ($count == 0) {
                echo '<div class="post" style="padding:10px;">Aucun article disponible pour cette source.</div>';
            }

            // Précharger les mots-clés pour tous les articles affichés
            $keywords_by_hash = [];
            if ($count > 0) {
                $hashes = array_column($articles, 'hash');
                $placeholders = implode(',', array_fill(0, count($hashes), '?'));
                $stmtKeywords = $bdd_admin->prepare('SELECT pk.hash_post, k.id_keyword, k.name_keyword FROM post_keyword pk JOIN keyword k ON pk.id_keyword = k.id_keyword WHERE pk.hash_post IN (' . $placeholders . ')');
                $stmtKeywords->execute($hashes);
                $keywordsRows = $stmtKeywords->fetchAll(PDO::FETCH_ASSOC);
                foreach ($keywordsRows as $row) {
                    $keywords_by_hash[$row['hash_post']][] = $row;
                }
            }

            $mois = ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
            $jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
            $last_day = '';

            foreach ($articles as $donnees) {
                $current_day = $donnees['last_date'];
                if ($last_day != $current_day && !empty($last_day)) {
                    $num_jour = intval($donnees['numero_jour']);
                    $num_mois = intval($donnees['numero_mois']);
                    $jour_nom = $jours[$num_jour] ?? '';
                    $mois_nom = $mois[$num_mois] ?? '';
                    echo '<div class="date_separator">' . $jour_nom . ' ' . $donnees['jour'] . ' ' . $mois_nom . ' ' . $donnees['annee'] . '</div>';
                }
                $last_day = $current_day;
            ?>
                <div class="post" style="clear:none;">
                    <div class="toggleinfos">
                        <p class="date grey2"><span class="hour"><?php echo $donnees['heure']; ?>H<?php echo $donnees['minute']; ?></span><br/><span class="month"><?php echo $donnees['jour']; ?>/<?php echo strtoupper($donnees['mois']); ?></span></p>
                        <p class="theme"><a href="index.php?theme_id=<?php echo intval($donnees['id_theme']); ?>" class="grey2"><?php echo stripslashes($donnees['name']); ?></a></p>
                        <p class="title" style="width:365px"><?php $titleShort = couperChaineNombre(stripslashes($donnees['title']), 175); echo $titleShort; ?></p>
                        <?php if (($last_connexion < $donnees['date_add_theme']) && ($donnees['alert'] == 1)) { echo '<div id="new_post_alert">Alerte</div>'; } else if ($last_connexion < $donnees['date_add_theme']) { echo '<div id="new_post">Nouveau</div>'; }?>
                    </div>
                <div class="fav_com">
                    <?php
                        $nbCom = isset($nb_comments_map[$donnees['id_post']]) ? (int)$nb_comments_map[$donnees['id_post']] : 0;
                        if ($nbCom > 0) { echo '<p class="com">' . $nbCom . '</p>'; }
                        $nbFav = isset($nb_favorites_map[$donnees['id_post']]) ? (int)$nb_favorites_map[$donnees['id_post']] : 0;
                        $isFavUser = !empty($is_favorite_set[$donnees['id_post']]);
                        $favClass = ($isFavUser ? 'fav_on ' : '') . ($nbFav === 0 ? 'fav_off' : '');
                    ?>
                    <p class="fav <?php echo $favClass; ?>"><?php if ($nbFav > 0) echo $nbFav; ?></p>
                    <span class="list_fav"></span>
                    <p class="fav_com_id"><?php echo $donnees['id_post']; ?></p>
                </div>
                    <div class="infos">
                        <p class="text"><span class="read"><a href="<?php echo $donnees['link']; ?>" class="no-style" target="_blank"><?php $titleShort = couperChaineNombre2(stripslashes($donnees['text']), 999); echo $titleShort; ?></a></span><br/><span class="author"><i class="icon-eye-open right_margin"></i><a href="<?php echo $donnees['link']; ?>" target="_blank">Consulter l'article</a><i class="icon-edit left_margin right_margin"></i> Auteur : <strong><?php echo htmlspecialchars($donnees['author']); ?></strong></span></p>
                        <?php if (!empty($keywords_by_hash[$donnees['hash']])) { echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : '; $i=0; foreach ($keywords_by_hash[$donnees['hash']] as $kw) { if($i>0) echo ', '; echo '<a href="index.php?keyword_id=' . $kw['id_keyword'] . '" class="grey2">' . htmlspecialchars($kw['name_keyword']) . '</a>'; $i++; } } ?>
                    </div>
                </div>
            <?php }

            $current_articles = $count;
            // Pagination (reste à afficher)
            $stmt_count = $bdd_admin->prepare('SELECT COUNT(*) FROM rss_post WHERE source = :source');
            $stmt_count->execute([':source' => $_GET['source']]);
            $resultat = $stmt_count->fetch();
            $max_articles = $resultat[0];
            $remaining_articles = $max_articles - $startpoint - $limit;
            ?>
            <?php
            $pagination_param = '';
            if (isset($_GET['keyword_id'])) $pagination_param = 'keyword_id=' . intval($_GET['keyword_id']);
            else if (isset($_GET['theme_id'])) $pagination_param = 'theme_id=' . intval($_GET['theme_id']);
            else if (isset($_GET['source'])) $pagination_param = 'source=' . urlencode($_GET['source']);
            ?>

            <?php
            // --- Calcul unifié du nombre d’articles restants ---
            $where_clause = '';
            $params = [];

            if (isset($_GET['keyword_id'])) {
                // Vue mot-clé
                $where_clause = 'r.id_theme IN (' . $liste_des_themes . ') AND EXISTS (SELECT 1 FROM post_keyword pk WHERE pk.hash_post = r.hash AND pk.id_keyword = :id_keyword)';
                $params = [':id_keyword' => $id_keyword];
            } elseif (isset($_GET['theme_id'])) {
                // Vue thème
                $where_clause = 'r.id_theme = :theme_id';
                $params = [':theme_id' => intval($_GET['theme_id'])];
            } elseif (isset($_GET['source'])) {
                // Vue source
                $where_clause = 'r.source = :source';
                $params = [':source' => $_GET['source']];
            } elseif (isset($_GET['sort_by']) && $_GET['sort_by'] == 'favorites') {
                // Vue favoris
                $where_clause = 'f.id_user = :user_id';
                $params = [':user_id' => $_SESSION['ID_UTILISATEUR']];
            } else {
                // Chronologie par défaut
                $where_clause = '1';
            }

            $stmt_count = $bdd_admin->prepare('SELECT COUNT(*) FROM rss_post r WHERE ' . $where_clause);
            $stmt_count->execute($params);
            $max_articles = (int)$stmt_count->fetchColumn();

            $remaining_articles = max(0, $max_articles - $startpoint - $limit);
            ?>
            <div class="pagination">
              <?php if ($remaining_articles > 0){ ?>
                <div class="prev">
                  <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page+1; ?>">
                    <i class="icon-arrow-left icon-white"></i> Articles précédents
                  </a>
                </div>
              <?php } ?>
              <?php if ($page > 1){ ?>
                <div class="next">
                  <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page-1; ?>">
                    Articles suivants <i class="icon-arrow-right icon-white"></i>
                  </a>
                </div>
              <?php } ?>
            </div>
            </div>
        <?php
        }
        else if (isset($_GET['sort_by']) && !empty($_GET['sort_by']) && $_GET['sort_by'] == 'theme') {
        // Si l'utilisateur veut classer par theme
        ?>
                <p id="chronolink" class="nav2 passive"><a href="index.php">Chronologie</a></p><p id="themalink" class="nav2 current2"><a href="index.php?sort_by=theme">Thématique</a></p><p id="themalink" class="nav2 passive"><a href="index.php?sort_by=favorites">Favoris</a></p>
            <?php
            //afficher seulement si l'utilisateur est admin
            $check_if_admin = $bdd->prepare("SELECT 1 FROM users WHERE admin_user = '1' AND id_user = ?");
            $check_if_admin->execute([(int) $_SESSION['ID_UTILISATEUR']]);
            if($check_if_admin->rowCount() > 0) {
            ?>
                <p id="themalink" class="nav2 passive"><a href="author.php">Auteurs</a></p>
            <?php
            }
            ?>
                <div id="thematique">
                <?php
                //Afficher les articles par thématique
                $reponse = $bdd_admin->query('SELECT DISTINCT id_theme, name, img FROM rss_post, theme WHERE id_theme in ('.$liste_des_themes.') AND rss_post.id_theme = theme.id ORDER BY name');
                
                
                while ($themes = $reponse->fetch()) {
                
                    echo '<div style="background:url(../dash_img/themes/'.$themes['img'].') no-repeat center center;" class="category_title"><a href="index.php?theme_id='.intval($themes['id_theme']).'" title="'.stripslashes($themes['name']).'">'.stripslashes($themes['name']).'</a></div>';
                    
                }
                
                $reponse->closeCursor();
                
                ?>
                </div>
        <?php
        }
        else if (isset($_GET['sort_by']) && !empty($_GET['sort_by']) && $_GET['sort_by'] == 'favorites') {
        ?>
            <p id="chronolink" class="nav2"><a href="index.php">Chronologie</a></p><p id="themalink" class="nav2"><a href="index.php?sort_by=theme">Thématique</a></p><p id="themalink" class="nav2 current"><a href="index.php?sort_by=favorites">Favoris</a></p>
            <?php
            //afficher seulement si l'utilisateur est admin
            $check_if_admin = $bdd->prepare("SELECT 1 FROM users WHERE admin_user = '1' AND id_user = ?");
            $check_if_admin->execute([(int) $_SESSION['ID_UTILISATEUR']]);
            if($check_if_admin->rowCount() > 0) {
            ?>
                <p id="themalink" class="nav2"><a href="author.php">Auteurs</a></p>
            <?php
            }
            ?>
            <div id="chronologie">
                <?php
                $tlFav = (int) DASH_ELECTRON_RSS_TEXT_MAX;
                $stmtFavArticles = $bdd_admin->query('
                    SELECT rss_post.id AS id_post, id_theme, source, title, LEFT(rss_post.text, '.$tlFav.') AS text, author, link, hash, alert, date, date_add_theme, DATE_FORMAT(date, \'%Y-%m-%d\') AS last_date, DATE_FORMAT(date, \'%w\') AS numero_jour, DATE_FORMAT(date, \'%c\') AS numero_mois, DATE_FORMAT(date, \'%d\') AS jour, DATE_FORMAT(date, \'%b\') AS mois, DATE_FORMAT(date, \'%Y\') AS annee, DATE_FORMAT(date, \'%H\') AS heure, DATE_FORMAT(date, \'%i\') AS minute, theme.id AS id_theme, theme.name
                    FROM rss_post, theme
                    WHERE id_theme in ('.$liste_des_themes.') AND rss_post.id in ('.$liste_des_favoris.') AND rss_post.id_theme = theme.id
                    ORDER BY date DESC
                    LIMIT '.(int)$startpoint.', '.(int)$limit.'
                ');
                $favArticles = $stmtFavArticles->fetchAll(PDO::FETCH_ASSOC);
                $mois = array("", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre");
                $jours= array("Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi");
                $count = count($favArticles);
                if ($count == 0) {
                    echo '<div class="post" style="padding:10px;">Vous n\'avez pas encore mis d\'article en favoris.</div>';
                }

                $preloaded = dash_electron_preload_index_posts(
                    $bdd,
                    $bdd_admin,
                    $favArticles,
                    (int) $_SESSION['ID_UTILISATEUR']
                );
                $nb_comments_map = $preloaded['nb_comments_map'];
                $nb_favorites_map = $preloaded['nb_favorites_map'];
                $is_favorite_set = $preloaded['is_favorite_set'];
                $is_selected_set = $preloaded['is_selected_set'];
                $is_archived_set = $preloaded['is_archived_set'];
                $keywords_by_hash = $preloaded['keywords_by_hash'];
                $authors_by_name = $preloaded['authors_by_name'];
                $comments_by_post = $preloaded['comments_by_post'];
                $user_logins = $preloaded['user_logins'];

                $last_day = '';
                foreach ($favArticles as $donnees) {
                    $current_day = $donnees['last_date'];
                    if ($last_day != $current_day && !empty($last_day)) {
                        $num_jour = isset($donnees['numero_jour']) ? intval($donnees['numero_jour']) : 0;
                        $num_mois = isset($donnees['numero_mois']) ? intval($donnees['numero_mois']) : 0;
                        $jour_nom = isset($jours[$num_jour]) ? $jours[$num_jour] : '';
                        $mois_nom = isset($mois[$num_mois]) ? $mois[$num_mois] : '';
                        echo '<div class="date_separator">'.$jour_nom.' '.$donnees['jour'].' '.$mois_nom.' '.$donnees['annee'].'</div>';
                    }
                    $last_day = $current_day;
                    $postId = (int) $donnees['id_post'];
                ?>
                    <div class="post">
                        <div class="toggleinfos">
                            <p class="date grey2"><span class="hour"><?php echo $donnees['heure']; ?>H<?php echo $donnees['minute']; ?></span><br/><span class="month"><?php echo $donnees['jour']; ?>/<?php echo strtoupper($donnees['mois']); ?></span></p>
                            <p class="theme"><a href="index.php?theme_id=<?php echo intval($donnees['id_theme']);?>"><?php echo stripslashes($donnees['name']); ?></a></p>
                            <p class="source"><a href="index.php?source=<?php echo urlencode($donnees['source']); ?>" class="grey2"><?php $sourceShort = couperChaineNombre(stripslashes($donnees['source']), 45); echo $sourceShort; ?></a></p>
                            <p class="title"><?php $titleShort = couperChaineNombre(stripslashes($donnees['title']), 175); echo $titleShort; ?></p>
                            <?php if (($last_connexion < $donnees['date_add_theme']) && ($donnees['alert'] == 1)) { echo '<div id="new_post_alert">Alerte</div>'; } else if ($last_connexion < $donnees['date_add_theme']) { echo '<div id="new_post">Nouveau</div>'; }?>
                        </div>
                        <div class="fav_com">
                                <?php
                                $nbCom = $nb_comments_map[$postId] ?? 0;
                                if ($nbCom > 0) {
                                    echo '<p class="com">'.ucfirst((string) $nbCom).'</p>';
                                }
                                $nbFav = $nb_favorites_map[$postId] ?? 0;
                                $isFavUser = !empty($is_favorite_set[$postId]);
                                $favClass = ($isFavUser ? 'fav_on ' : '') . ($nbFav === 0 ? 'fav_off' : '');
                                ?>
                                <p class="fav <?php echo $favClass; ?>">
                                    <?php if ($nbFav > 0) { echo $nbFav; } ?>
                                </p>
                                <span class="list_fav"></span>
                                <p class="fav_com_id"><?php echo $postId; ?></p>
                        </div>
                        <div class="infos">
                            <p class="text"><span class="read"><a href="<?php echo $donnees['link']; ?>" class="no-style" target="_blank"><?php $titleShort = couperChaineNombre2(stripslashes($donnees['text']), 999); echo $titleShort; ?></a></span><br/><span class="author"><i class="icon-eye-open right_margin"></i><a href="<?php echo $donnees['link']; ?>" target="_blank">Consulter l'article</a>
                            <i class="icon-edit left_margin right_margin"></i>
                            Auteur :
                            <strong>
                            <?php
                                $authorRow = $authors_by_name[$donnees['author']] ?? null;
                                if ($authorRow === null && $donnees['author'] != 'Auteur inconnu') {
                                    echo '<a href="author.php?view=">'.$donnees['author'].'</a>';
                                }
                                else if ($donnees['author'] == 'Auteur inconnu'){
                                    echo $donnees['author'];
                                }
                                else {
                                    echo '<a href="author.php?view='.$authorRow['id'].'">'.$authorRow['name'].'</a>';
                                }
                            ?>
                            </strong>
                                <?php
                                $keywords_list = $keywords_by_hash[$donnees['hash']] ?? [];
                                if (count($keywords_list) > 0) {
                                    echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : ';
                                    $compteur = 0;
                                    foreach ($keywords_list as $keyword) {
                                        $compteur ++;
                                        ?><a href="index.php?keyword_id=<?php echo $keyword['id_keyword'];?>" class="grey2"><?php if($compteur > 1){echo ', ';} echo $keyword['name_keyword'];?></a><?php
                                    }
                                }
                                else { echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : <strong>aucun</strong>'; }
                                ?></span></p>
                            <div class="share">
                                <span class="btn_add_mail left grey2 ">
                                    <?php
                                        if (!empty($is_selected_set[$postId])) { echo '<i class="icon-ok right_margin"></i>Ajouté à la liste'; }
                                        else { echo '<i class="icon-envelope right_margin"></i>Sélectionner'; }
                                    ?>
                                </span>
                                <p class="post_mail_id"><?php echo $postId; ?></p>
                                <a href="messages_post.php?id_post=<?php echo $postId;?>" class="link_private_message dash-lightbox-iframe dash-lightbox-iframe--message" data-fancybox data-type="iframe" data-width="440" data-height="320"><span class="btn_private_message"><i class="icon-user icon-white right_margin"></i>Message</span></a>
                                <div style="float:right; margin-left:10px;"><a id="sharepost" href="http://www.facebook.com/share.php?u=<?php echo urlencode($donnees['link']);?>" title="Partager via Facebook" target="_BLANK"><img src="img/but_share.png" alt="Partagez sur Facebook" /></a>
                                </div>
                                <div style="float:right; margin-left:10px;"><script charset="utf-8" type="text/javascript"></script>
                                    <a href="http://twitter.com/share" class="twitter-share-button"
                                      data-url="<?php echo $donnees['link'];?>"
                                      data-text="<?php echo $donnees['title']; ?>"
                                      data-related="Le Dash"
                                      data-count="none">
                                    </a>
                                </div>
                            </div>

                            <p class="comments_title georgia">Commentaires</p>
                            <div class="comments">
                            <?php
                                foreach ($comments_by_post[$postId] ?? [] as $comments) {
                            ?>
                                <div class="comment">
                                    <p class="user_comment"><?php echo ucfirst($user_logins[(int) $comments['id_user']] ?? ''); ?> <span class="date_comment grey"><?php echo $comments['converted_date']; ?></span> :</p>
                                    <?php if ($_SESSION["ID_UTILISATEUR"] == $comments['id_user']) { ?>
                                    <form action="comments.php" method="post" class="delete_comment_form">
                                        <input type="hidden" name="id_comment" value="<?php echo $comments['id']; ?>"/>
                                        <input type="submit" class="delete_comment" value="(Supprimer)"/>
                                    </form>
                                    <?php } ?>
                                    <p class="text_comment"><?php echo make_clickable(stripslashes($comments['text'])); ?></p>
                                </div>
                            <?php
                            }
                            ?>
                                <form action="comments.php" method="post" class="commenter">
                                    <input type="hidden" name="id_post" value="<?php echo $postId; ?>"/>
                                    <textarea class="comment_text" name="comment_text" onclick="if (this.value=='Tapez ici votre message') this.value=''">Tapez ici votre message</textarea>
                                    <input type="submit" class="send_comment" value="Commenter"/>
                                </form>
                            </div>
                            <div class="archiver">
                                <?php $isArchived = !empty($is_archived_set[$donnees['hash']]); ?>
                                <form action="archives.php" method="post" class="btn_action archiver"<?php if ($isArchived) { echo 'style="opacity:0.2"'; } ?>>
                                    <input type="hidden" name="id_post" value="<?php echo $postId; ?>"/>
                                    <?php
                                        if (!$isArchived) {
                                            echo '<i class="icon-download-alt icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archiver"/>';
                                        }
                                        else {
                                            echo '<i class="icon-ok icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archivé"/>';
                                        }
                                    ?>
                                </form>
                            </div>
                        </div>
                </div>
            <?php
            }
            $current_articles = $count;
            
            //Compte le nombre d'articles total
            $stmt_count = $bdd_admin->query('SELECT COUNT(*) AS total FROM rss_post WHERE id_theme in ('.$liste_des_themes.') AND rss_post.id in ('.$liste_des_favoris.')');
            $resultat = $stmt_count->fetch();
            $max_articles = isset($resultat['total']) ? $resultat['total'] : 0;
            
            // Compte le nombre d'articles restant à afficher
            $remaining_articles = $max_articles - $startpoint - $limit;
            ?>
            </div> <!-- fermeture ajoutée pour chronologie (ligne 977) -->
            <?php
            $pagination_param = '';
            if (isset($_GET['keyword_id'])) $pagination_param = 'keyword_id=' . intval($_GET['keyword_id']);
            else if (isset($_GET['theme_id'])) $pagination_param = 'theme_id=' . intval($_GET['theme_id']);
            else if (isset($_GET['source'])) $pagination_param = 'source=' . urlencode($_GET['source']);
            ?>

            <?php
            // --- Calcul unifié du nombre d’articles restants ---
            $where_clause = '';
            $params = [];

            if (isset($_GET['keyword_id'])) {
                // Vue mot-clé
                $where_clause = 'r.id_theme IN (' . $liste_des_themes . ') AND EXISTS (SELECT 1 FROM post_keyword pk WHERE pk.hash_post = r.hash AND pk.id_keyword = :id_keyword)';
                $params = [':id_keyword' => $id_keyword];
            } elseif (isset($_GET['theme_id'])) {
                // Vue thème
                $where_clause = 'r.id_theme = :theme_id';
                $params = [':theme_id' => intval($_GET['theme_id'])];
            } elseif (isset($_GET['source'])) {
                // Vue source
                $where_clause = 'r.source = :source';
                $params = [':source' => $_GET['source']];
            } elseif (isset($_GET['sort_by']) && $_GET['sort_by'] == 'favorites') {
                // Vue favoris
                $where_clause = 'f.id_user = :user_id';
                $params = [':user_id' => $_SESSION['ID_UTILISATEUR']];
            } else {
                // Chronologie par défaut
                $where_clause = '1';
            }

            $stmt_count = $bdd_admin->prepare('SELECT COUNT(*) FROM rss_post r WHERE ' . $where_clause);
            $stmt_count->execute($params);
            $max_articles = (int)$stmt_count->fetchColumn();

            $remaining_articles = max(0, $max_articles - $startpoint - $limit);
            ?>
            <div class="pagination">
              <?php if ($remaining_articles > 0){ ?>
                <div class="prev">
                  <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page+1; ?>">
                    <i class="icon-arrow-left icon-white"></i> Articles précédents
                  </a>
                </div>
              <?php } ?>
              <?php if ($page > 1){ ?>
                <div class="next">
                  <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page-1; ?>">
                    Articles suivants <i class="icon-arrow-right icon-white"></i>
                  </a>
                </div>
              <?php } ?>
            </div>
        <?php }
        else {
        ?>
            
            <p id="chronolink" class="nav2 current"><a href="index.php">Chronologie</a></p><p id="themalink" class="nav2"><a href="index.php?sort_by=theme">Thématique</a></p><p id="themalink" class="nav2"><a href="index.php?sort_by=favorites">Favoris</a></p>
            <?php
            //afficher seulement si l'utilisateur est admin
            $check_if_admin = $bdd->prepare("SELECT 1 FROM users WHERE admin_user = '1' AND id_user = ?");
            $check_if_admin->execute([(int) $_SESSION['ID_UTILISATEUR']]);
            if($check_if_admin->rowCount() > 0) {
            ?>
                <p id="themalink" class="nav2"><a href="author.php">Auteurs</a></p>
            <?php
            }
            ?>

            <div id="chronologie">
                <?php
                $mois = ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
                $jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

                // Afficher les nouveaux articles ou alertes
                $textLenChrono = (int) DASH_ELECTRON_RSS_TEXT_MAX;
                $stmtNewArticles = $bdd_admin->prepare('
                    SELECT rss_post.id AS id_post, id_theme, source, title, LEFT(rss_post.text, '.$textLenChrono.') AS text, author, link, hash, alert, date, date_add_theme, DATE_FORMAT(date, \'%Y-%m-%d\') AS last_date, DATE_FORMAT(date, \'%w\') AS numero_jour, DATE_FORMAT(date, \'%c\') AS numero_mois, DATE_FORMAT(date, \'%d\') AS jour, DATE_FORMAT(date, \'%b\') AS mois, DATE_FORMAT(date, \'%Y\') AS annee, DATE_FORMAT(date, \'%H\') AS heure, DATE_FORMAT(date, \'%i\') AS minute, theme.id AS id_theme, theme.name
                    FROM rss_post, theme
                    WHERE id_theme in ('.$liste_des_themes.') AND rss_post.id_theme = theme.id AND date_add_theme > :lc
                    ORDER BY date_add_theme DESC
                    LIMIT :off, :lim
                ');
                $stmtNewArticles->bindValue(':lc', $last_connexion, PDO::PARAM_STR);
                $stmtNewArticles->bindValue(':off', (int) $startpoint, PDO::PARAM_INT);
                $stmtNewArticles->bindValue(':lim', (int) $limit, PDO::PARAM_INT);
                $stmtNewArticles->execute();
                $newArticles = $stmtNewArticles->fetchAll(PDO::FETCH_ASSOC);

                if (!isset($liste_des_themes_array) || !is_array($liste_des_themes_array)) {
                    $liste_des_themes_array = array_map('intval', explode(',', $liste_des_themes));
                }
                $inQuery = implode(',', array_map('intval', $liste_des_themes_array));
                $stmtOldArticles = $bdd_admin->prepare('
                    SELECT rss_post.id AS id_post, id_theme, source, title, LEFT(rss_post.text, '.$textLenChrono.') AS text, author, link, hash, alert, date, date_add_theme, DATE_FORMAT(date, \'%Y-%m-%d\') AS last_date, DATE_FORMAT(date, \'%w\') AS numero_jour, DATE_FORMAT(date, \'%c\') AS numero_mois, DATE_FORMAT(date, \'%d\') AS jour, DATE_FORMAT(date, \'%b\') AS mois, DATE_FORMAT(date, \'%Y\') AS annee, DATE_FORMAT(date, \'%H\') AS heure, DATE_FORMAT(date, \'%i\') AS minute, theme.id AS id_theme, theme.name
                    FROM rss_post
                    JOIN theme ON rss_post.id_theme = theme.id
                    WHERE id_theme IN (' . $inQuery . ')
                      AND rss_post.id_theme = theme.id
                      AND date_add_theme < :last_connexion
                    ORDER BY date DESC
                    LIMIT :startpoint, :limit
                ');
                $stmtOldArticles->bindValue(':last_connexion', $last_connexion);
                $stmtOldArticles->bindValue(':startpoint', (int) $startpoint, PDO::PARAM_INT);
                $stmtOldArticles->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
                $stmtOldArticles->execute();
                $oldArticles = $stmtOldArticles->fetchAll(PDO::FETCH_ASSOC);

                $preloaded = dash_electron_preload_index_posts(
                    $bdd,
                    $bdd_admin,
                    array_merge($newArticles, $oldArticles),
                    (int) $_SESSION['ID_UTILISATEUR']
                );
                $nb_comments_map = $preloaded['nb_comments_map'];
                $nb_favorites_map = $preloaded['nb_favorites_map'];
                $is_favorite_set = $preloaded['is_favorite_set'];
                $is_selected_set = $preloaded['is_selected_set'];
                $is_archived_set = $preloaded['is_archived_set'];
                $keywords_by_hash = $preloaded['keywords_by_hash'];
                $authors_by_name = $preloaded['authors_by_name'];
                $comments_by_post = $preloaded['comments_by_post'];
                $user_logins = $preloaded['user_logins'];

                $last_day_new = '';
                foreach ($newArticles as $donnees) {
                    $current_day_new = $donnees['last_date'];
                    if ($last_day_new != $current_day_new && !empty($last_day_new)) {
                        $num_jour = isset($donnees['numero_jour']) ? intval($donnees['numero_jour']) : 0;
                        $num_mois = isset($donnees['numero_mois']) ? intval($donnees['numero_mois']) : 0;
                        $jour_nom = isset($jours[$num_jour]) ? $jours[$num_jour] : '';
                        $mois_nom = isset($mois[$num_mois]) ? $mois[$num_mois] : '';
                        echo '<div class="date_separator">'.$jour_nom.' '.$donnees['jour'].' '.$mois_nom.' '.$donnees['annee'].'</div>';
                    }
                    $last_day_new = $current_day_new;
                    $postId = (int) $donnees['id_post'];
                ?>
                    <div class="post">
                        <div class="toggleinfos">
                            <p class="date grey2"><span class="hour"><?php echo $donnees['heure']; ?>H<?php echo $donnees['minute']; ?></span><br/><span class="month"><?php echo $donnees['jour']; ?>/<?php echo strtoupper($donnees['mois']); ?></span></p>
                            <p class="theme"><a href="index.php?theme_id=<?php echo intval($donnees['id_theme']);?>"><?php echo stripslashes($donnees['name']); ?></a></p>
                            <p class="source"><a href="index.php?source=<?php echo urlencode($donnees['source']); ?>" class="grey2"><?php $sourceShort = couperChaineNombre(stripslashes($donnees['source']), 45); echo $sourceShort; ?></a></p>
                            <p class="title"><?php $titleShort = couperChaineNombre(stripslashes($donnees['title']), 175); echo $titleShort; ?></p>
                            <?php if (($last_connexion < $donnees['date_add_theme']) && ($donnees['alert'] == 1)) { echo '<div id="new_post_alert">Alerte</div>'; } else if ($last_connexion < $donnees['date_add_theme']) { echo '<div id="new_post">Nouveau</div>'; }?>
                        </div>
                        <div class="fav_com">
                                <?php
                                $nbCom = $nb_comments_map[$postId] ?? 0;
                                if ($nbCom > 0) {
                                    echo '<p class="com">'.ucfirst((string) $nbCom).'</p>';
                                }
                                $nbFav = $nb_favorites_map[$postId] ?? 0;
                                $isFavUser = !empty($is_favorite_set[$postId]);
                                $favClass = ($isFavUser ? 'fav_on ' : '') . ($nbFav === 0 ? 'fav_off' : '');
                                ?>
                                <p class="fav <?php echo $favClass; ?>">
                                    <?php if ($nbFav > 0) { echo $nbFav; } ?>
                                </p>
                                <span class="list_fav"></span>
                                <p class="fav_com_id"><?php echo $postId; ?></p>
                        </div>
                        <div class="infos">
                            <p class="text"><span class="read"><a href="<?php echo $donnees['link']; ?>" class="no-style" target="_blank"><?php $titleShort = couperChaineNombre2(stripslashes($donnees['text']), 999); echo $titleShort; ?></a></span><br/><span class="author"><i class="icon-eye-open right_margin"></i><a href="<?php echo $donnees['link']; ?>" target="_blank">Consulter l'article</a>
                            <i class="icon-edit left_margin right_margin"></i>
                            Auteur :
                            <strong>
                            <?php
                                $authorRow = $authors_by_name[$donnees['author']] ?? null;
                                if ($authorRow === null && $donnees['author'] != 'Auteur inconnu') {
                                    echo '<a href="author.php?view=">'.$donnees['author'].'</a>';
                                }
                                else if ($donnees['author'] == 'Auteur inconnu'){
                                    echo $donnees['author'];
                                }
                                else {
                                    echo '<a href="author.php?view='.$authorRow['id'].'">'.$authorRow['name'].'</a>';
                                }
                            ?>
                            </strong>
                                <?php
                                $keywords_list = $keywords_by_hash[$donnees['hash']] ?? [];
                                if (count($keywords_list) > 0) {
                                    echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : ';
                                    $compteur = 0;
                                    foreach ($keywords_list as $keyword) {
                                        $compteur ++;
                                        ?><a href="index.php?keyword_id=<?php echo $keyword['id_keyword'];?>" class="grey2"><?php if($compteur > 1){echo ', ';} echo $keyword['name_keyword'];?></a><?php
                                    }
                                }
                                else { echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : <strong>aucun</strong>'; }
                                ?></span></p>
                            <div class="share">
                                <span class="btn_add_mail left grey2 ">
                                    <?php
                                        if (!empty($is_selected_set[$postId])) { echo '<i class="icon-ok right_margin"></i>Ajouté à la liste'; }
                                        else { echo '<i class="icon-envelope right_margin"></i>Sélectionner'; }
                                    ?>
                                </span>
                                <p class="post_mail_id"><?php echo $postId; ?></p>
                                <a href="messages_post.php?id_post=<?php echo $postId;?>" class="link_private_message dash-lightbox-iframe dash-lightbox-iframe--message" data-fancybox data-type="iframe" data-width="440" data-height="320"><span class="btn_private_message"><i class="icon-user icon-white right_margin"></i>Message</span></a>
                                <div style="float:right; margin-left:10px;"><a id="sharepost" href="http://www.facebook.com/share.php?u=<?php echo urlencode($donnees['link']);?>" title="Partager via Facebook" target="_BLANK"><img src="img/but_share.png" alt="Partagez sur Facebook" /></a>
                                </div>
                                <div style="float:right; margin-left:10px;"><script charset="utf-8" type="text/javascript"></script>
                                    <a href="http://twitter.com/share" class="twitter-share-button"
                                      data-url="<?php echo $donnees['link'];?>"
                                      data-text="<?php echo $donnees['title']; ?>"
                                      data-related="Le Dash"
                                      data-count="none">
                                    </a>
                                </div>
                            </div>
                            <p class="comments_title georgia">Commentaires</p>
                            <div class="comments">
                            <?php
                                foreach ($comments_by_post[$postId] ?? [] as $comments) {
                            ?>
                                <div class="comment">
                                    <p class="user_comment"><?php echo ucfirst($user_logins[(int) $comments['id_user']] ?? ''); ?> <span class="date_comment grey"><?php echo $comments['converted_date']; ?></span> :</p>
                                    <?php if ($_SESSION["ID_UTILISATEUR"] == $comments['id_user']) { ?>
                                    <form action="comments.php" method="post" class="delete_comment_form">
                                        <input type="hidden" name="id_comment" value="<?php echo $comments['id']; ?>"/>
                                        <input type="submit" class="delete_comment" value="(Supprimer)"/>
                                    </form>
                                    <?php } ?>
                                    <p class="text_comment"><?php echo make_clickable(stripslashes($comments['text'])); ?></p>
                                </div>
                            <?php
                            }
                            ?>
                                <form action="comments.php" method="post" class="commenter">
                                    <input type="hidden" name="id_post" value="<?php echo $postId; ?>"/>
                                    <textarea class="comment_text" name="comment_text" onclick="if (this.value=='Tapez ici votre message') this.value=''">Tapez ici votre message</textarea>
                                    <input type="submit" class="send_comment" value="Commenter"/>
                                </form>
                            </div>
                            <div class="archiver">
                                <?php $isArchived = !empty($is_archived_set[$donnees['hash']]); ?>
                                <form action="archives.php" method="post" class="btn_action archiver"<?php if ($isArchived) { echo 'style="opacity:0.2"'; } ?>>
                                    <input type="hidden" name="id_post" value="<?php echo $postId; ?>"/>
                                    <?php
                                        if (!$isArchived) {
                                            echo '<i class="icon-download-alt icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archiver"/>';
                                        }
                                        else {
                                            echo '<i class="icon-ok icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archivé"/>';
                                        }
                                    ?>
                                </form>
                            </div>
                        </div>
                    </div>
                <?php
                }

                $count = count($newArticles);
                if ($count > 0) {
                    echo '<div style="clear:both; padding:5px 0;"></div>';
                }

                $last_day = '';
                foreach ($oldArticles as $donnees) {
                    $current_day = $donnees['last_date'];
                    if ($last_day != $current_day && !empty($last_day)) {
                        $num_jour = isset($donnees['numero_jour']) ? intval($donnees['numero_jour']) : 0;
                        $num_mois = isset($donnees['numero_mois']) ? intval($donnees['numero_mois']) : 0;
                        $jour_nom = isset($jours[$num_jour]) ? $jours[$num_jour] : '';
                        $mois_nom = isset($mois[$num_mois]) ? $mois[$num_mois] : '';
                        echo '<div class="date_separator">'.$jour_nom.' '.$donnees['jour'].' '.$mois_nom.' '.$donnees['annee'].'</div>';
                    }
                    $last_day = $current_day;
                    $postId = (int) $donnees['id_post'];
                ?>
                    <div class="post">
                        <div class="toggleinfos">
                            <p class="date grey2"><span class="hour"><?php echo $donnees['heure']; ?>H<?php echo $donnees['minute']; ?></span><br/><span class="month"><?php echo $donnees['jour']; ?>/<?php echo strtoupper($donnees['mois']); ?></span></p>
                            <p class="theme"><a href="index.php?theme_id=<?php echo intval($donnees['id_theme']);?>"><?php echo stripslashes($donnees['name']); ?></a></p>
                            <p class="source"><a href="index.php?source=<?php echo urlencode($donnees['source']); ?>" class="grey2"><?php $sourceShort = couperChaineNombre(stripslashes($donnees['source']), 45); echo $sourceShort; ?></a></p>
                            <p class="title"><?php $titleShort = couperChaineNombre(stripslashes($donnees['title']), 175); echo $titleShort; ?></p>
                            <?php if ($donnees['alert'] == 1) { echo '<div id="new_post_alert">Alerte</div>'; } ?>
                        </div>
                        <div class="fav_com">
                                <?php
                                $nbCom = $nb_comments_map[$postId] ?? 0;
                                if ($nbCom > 0) {
                                    echo '<p class="com">'.ucfirst((string) $nbCom).'</p>';
                                }
                                $nbFav = $nb_favorites_map[$postId] ?? 0;
                                $isFavUser = !empty($is_favorite_set[$postId]);
                                $favClass = ($isFavUser ? 'fav_on ' : '') . ($nbFav === 0 ? 'fav_off' : '');
                                ?>
                                <p class="fav <?php echo $favClass; ?>">
                                    <?php if ($nbFav > 0) { echo $nbFav; } ?>
                                </p>
                                <span class="list_fav"></span>
                                <p class="fav_com_id"><?php echo $postId; ?></p>
                        </div>
                        <div class="infos">
                            <p class="text"><span class="read"><a href="<?php echo $donnees['link']; ?>" class="no-style" target="_blank"><?php $titleShort = couperChaineNombre2(stripslashes($donnees['text']), 999); echo $titleShort; ?></a></span><br/><span class="author"><i class="icon-eye-open right_margin"></i><a href="<?php echo $donnees['link']; ?>" target="_blank">Consulter l'article</a>
                            <i class="icon-edit left_margin right_margin"></i>
                            Auteur :
                            <strong>
                            <?php
                                $authorRow = $authors_by_name[$donnees['author']] ?? null;
                                if ($authorRow === null && $donnees['author'] != 'Auteur inconnu') {
                                    echo '<a href="author.php?view=">'.$donnees['author'].'</a>';
                                }
                                else if ($donnees['author'] == 'Auteur inconnu'){
                                    echo $donnees['author'];
                                }
                                else {
                                    echo '<a href="author.php?view='.$authorRow['id'].'">'.$authorRow['name'].'</a>';
                                }
                            ?>
                            </strong>
                                <?php
                                $keywords_list = $keywords_by_hash[$donnees['hash']] ?? [];
                                if (count($keywords_list) > 0) {
                                    echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : ';
                                    $compteur = 0;
                                    foreach ($keywords_list as $keyword) {
                                        $compteur ++;
                                        ?><a href="index.php?keyword_id=<?php echo $keyword['id_keyword'];?>" class="grey2"><?php if($compteur > 1){echo ', ';} echo $keyword['name_keyword'];?></a><?php
                                    }
                                }
                                else { echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : <strong>aucun</strong>'; }
                                ?></span></p>
                            <div class="share">
                                <span class="btn_add_mail left grey2 ">
                                    <?php
                                        if (!empty($is_selected_set[$postId])) { echo '<i class="icon-ok right_margin"></i>Ajouté à la liste'; }
                                        else { echo '<i class="icon-envelope right_margin"></i>Sélectionner'; }
                                    ?>
                                </span>
                                <p class="post_mail_id"><?php echo $postId; ?></p>
                                <a href="messages_post.php?id_post=<?php echo $postId;?>" class="link_private_message dash-lightbox-iframe dash-lightbox-iframe--message" data-fancybox data-type="iframe" data-width="440" data-height="320"><span class="btn_private_message"><i class="icon-user icon-white right_margin"></i>Message</span></a>
                                <div style="float:right; margin-left:10px;"><a id="sharepost" href="http://www.facebook.com/share.php?u=<?php echo urlencode($donnees['link']);?>" title="Partager via Facebook" target="_BLANK"><img src="img/but_share.png" alt="Partagez sur Facebook" /></a>
                                </div>
                                <div style="float:right; margin-left:10px;"><script charset="utf-8" type="text/javascript"></script>
                                    <a href="http://twitter.com/share" class="twitter-share-button"
                                      data-url="<?php echo $donnees['link'];?>"
                                      data-text="<?php echo $donnees['title']; ?>"
                                      data-related="Le Dash"
                                      data-count="none">
                                    </a>
                                </div>
                            </div>
                            <p class="comments_title georgia">Commentaires</p>
                            <div class="comments">
                            <?php
                                foreach ($comments_by_post[$postId] ?? [] as $comments) {
                            ?>
                                <div class="comment">
                                    <p class="user_comment"><?php echo ucfirst($user_logins[(int) $comments['id_user']] ?? ''); ?> <span class="date_comment grey"><?php echo $comments['converted_date']; ?></span> :</p>
                                    <?php if ($_SESSION["ID_UTILISATEUR"] == $comments['id_user']) { ?>
                                    <form action="comments.php" method="post" class="delete_comment_form">
                                        <input type="hidden" name="id_comment" value="<?php echo $comments['id']; ?>"/>
                                        <input type="submit" class="delete_comment" value="(Supprimer)"/>
                                    </form>
                                    <?php } ?>
                                    <p class="text_comment"><?php echo make_clickable(stripslashes($comments['text'])); ?></p>
                                </div>
                            <?php
                            }
                            ?>
                                <form action="comments.php" method="post" class="commenter">
                                    <input type="hidden" name="id_post" value="<?php echo $postId; ?>"/>
                                    <textarea class="comment_text" name="comment_text" onclick="if (this.value=='Tapez ici votre message') this.value=''">Tapez ici votre message</textarea>
                                    <input type="submit" class="send_comment" value="Commenter"/>
                                </form>
                            </div>
                            <div class="archiver">
                                <?php $isArchived = !empty($is_archived_set[$donnees['hash']]); ?>
                                <form action="archives.php" method="post" class="btn_action archiver"<?php if ($isArchived) { echo 'style="opacity:0.2"'; } ?>>
                                    <input type="hidden" name="id_post" value="<?php echo $postId; ?>"/>
                                    <?php
                                        if (!$isArchived) {
                                            echo '<i class="icon-download-alt icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archiver"/>';
                                        }
                                        else {
                                            echo '<i class="icon-ok icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archivé"/>';
                                        }
                                    ?>
                                </form>
                            </div>
                        </div>
                    </div>
                <?php
                }
                $current_articles = count($oldArticles);
                
                //Compte le nombre d'articles total (version PDO sécurisée et robuste)
                if (!empty($liste_des_themes_array)) {
                    $placeholders = implode(',', array_fill(0, count($liste_des_themes_array), '?'));
                    $stmt_count = $bdd_admin->prepare('SELECT COUNT(*) FROM rss_post WHERE id_theme in (' . $placeholders . ')');
                    foreach ($liste_des_themes_array as $k => $id) {
                        $stmt_count->bindValue(($k+1), $id, PDO::PARAM_INT);
                    }
                    $stmt_count->execute();
                    $resultat = $stmt_count->fetch();
                    $max_articles = isset($resultat[0]) ? $resultat[0] : 0;
                } else {
                    $max_articles = 0;
                }
                
                // Compte le nombre d'articles restant à afficher
                $remaining_articles = $max_articles - $startpoint - $limit;
                ?>
            <?php
            $pagination_param = '';
            if (isset($_GET['keyword_id'])) $pagination_param = 'keyword_id=' . intval($_GET['keyword_id']);
            else if (isset($_GET['theme_id'])) $pagination_param = 'theme_id=' . intval($_GET['theme_id']);
            else if (isset($_GET['source'])) $pagination_param = 'source=' . urlencode($_GET['source']);
            ?>

            <div class="pagination">
              <?php if ($remaining_articles > 0){ ?>
                <div class="prev">
                  <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page+1; ?>">
                    <i class="icon-arrow-left icon-white"></i> Articles précédents
                  </a>
                </div>
              <?php } ?>
              <?php if ($page > 1){ ?>
                <div class="next">
                  <a href="index.php?<?php echo $pagination_param; ?>&page=<?php echo $page-1; ?>">
                    Articles suivants <i class="icon-arrow-right icon-white"></i>
                  </a>
                </div>
              <?php } ?>
            </div>
            </div><!-- /#chronologie -->
        <?php } ?>

<?php
flush();
include("footer.php");
if (isset($_SESSION["ID_UTILISATEUR"])) {
    dash_electron_mark_articles_seen($bdd, $bdd_admin, (int) $_SESSION['ID_UTILISATEUR']);
}
?>
