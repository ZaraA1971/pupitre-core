<?php
require_once __DIR__ . '/header.php';

// Source selection (header.php lit POST/GET ; normaliser pour SQL)
$source_name = is_string($source_name ?? null) ? trim($source_name) : '%';
if ($source_name === '' || $source_name === '%25') {
    $source_name = '%';
}
$source_name_safe = htmlspecialchars($source_name, ENT_QUOTES, 'UTF-8');
$sourceFilter = ($source_name === '%') ? null : $source_name;
if (!isset($bdd)) {
    error_log("Connexion à la base de données échouée (variable \$bdd non définie)");
    exit("Erreur de connexion.");
}

$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = dash_admin_list_per_page('index');
$promoExclude = dash_admin_index_promo_sql_fragment();
$keywordId = isset($_GET['keyword_id']) ? (int) $_GET['keyword_id'] : 0;

$indexNavParams = [
    'tri' => $tri,
    'keyword_id' => $keywordId > 0 ? $keywordId : null,
    'source_name' => ($source_name !== '%' && $source_name !== '') ? $source_name : null,
    'page' => 1,
];

// Récupérer la liste des thèmes une seule fois
$themesList = [];
$result_theme = $bdd->query('SELECT name, id FROM theme ORDER BY name');
while ($theme = $result_theme->fetch(PDO::FETCH_ASSOC)) {
    $themesList[] = $theme;
}
$navTitle = 'Tous les flux';
if ($source_name !== '%') {
    $navTitle = $source_name_safe;
} elseif (isset($_GET['keyword_id'], $_GET['source_name']) && $_GET['source_name'] !== '%') {
    $navTitle = htmlspecialchars(urldecode((string) $_GET['source_name']), ENT_QUOTES, 'UTF-8');
}
$navCounts = dash_admin_nav_counts($bdd);
ob_start();
?>
        <div id="form_selectrss">
            <form action="<?= htmlspecialchars(dash_admin_base_path() . '/index.php', ENT_QUOTES, 'UTF-8') ?>" name="selectrss" method="get">
                <?php if ($tri !== 'date') { ?>
                    <input type="hidden" name="tri" value="<?= htmlspecialchars($tri, ENT_QUOTES, 'UTF-8') ?>"/>
                <?php } ?>
                <?php if ($keywordId > 0) { ?>
                    <input type="hidden" name="keyword_id" value="<?= (int) $keywordId ?>"/>
                <?php } ?>
                <select name="source_name" onchange="document.selectrss.submit();">
                    <?php $stmt = $bdd->query('SELECT DISTINCT source FROM rss_post ORDER BY source'); ?>
                    <option selected="selected">Choisir une source</option>
                    <option value="%">Tous les flux</option>
                    <?php while ($donnees = $stmt->fetch(PDO::FETCH_ASSOC)) { ?>
                        <option value="<?php echo htmlspecialchars($donnees['source']); ?>"><?php echo htmlspecialchars($donnees['source']); ?></option>
                    <?php } ?>
                </select>
            </form>
        </div>
<?php
dash_admin_include_nav_main($navTitle, $navCounts, 'index', 'standard', ob_get_clean());
?>

<div id="container">
    <form name="actionform" action="index.php" method="post" id="actionform">
        <div class="actions shadow">
            <div class="sort">
                <?php
                $sortHref = static function (string $mode) use ($indexNavParams): string {
                    $p = $indexNavParams;
                    $p['tri'] = $mode === 'date' ? null : $mode;
                    $p['page'] = 1;

                    return dash_admin_index_list_url($p);
                };
                ?>
                <a href="<?= htmlspecialchars($sortHref('date'), ENT_QUOTES, 'UTF-8') ?>" class="sort_submit <?php if (($tri != 'pertinence') && ($tri != 'tendance')) echo 'current_action'; ?>">Par ordre chronologique</a>
                <?php if ($keywordId <= 0) { ?>
                    <a href="<?= htmlspecialchars($sortHref('pertinence'), ENT_QUOTES, 'UTF-8') ?>" class="sort_submit <?php if ($tri == 'pertinence') echo 'current_action'; ?>">Par pertinence</a>
                    <a href="<?= htmlspecialchars($sortHref('tendance'), ENT_QUOTES, 'UTF-8') ?>" class="sort_submit <?php if ($tri == 'tendance') echo 'current_action'; ?>">Par tendance</a>
                <?php } else {
                    $get_name_keyword = $bdd->prepare('SELECT name_keyword FROM keyword WHERE id_keyword = ?');
                    $get_name_keyword->execute([$keywordId]);
                    $keyword_name = $get_name_keyword->fetch(PDO::FETCH_ASSOC);
                    echo 'Articles associés au mot-clé "' . htmlspecialchars((string) ($keyword_name['name_keyword'] ?? ''), ENT_QUOTES, 'UTF-8') . '"';
                    echo ' · <a href="' . htmlspecialchars(dash_admin_index_list_url(['page' => 1]), ENT_QUOTES, 'UTF-8') . '" class="sort_submit">Tous les flux</a>';
                }
                ?>
            </div>
                    <input type="hidden" name="source_name" value="<?php echo $source_name; ?>"/>
        </div>

        <?php if ($keywordId > 0) {
            $id_keyword = $keywordId;
            ?>
        <div class="keyword-graph-block">
            <?php include __DIR__ . '/graph.php'; ?>
            <div id="graph_articles" class="keyword-graph-day" aria-live="polite"></div>
        </div>
        <?php } ?>

        <!-- Post Loop -->
        <?php
        $textSelect = 'LEFT(r.text, 1200) AS text';

        $orderBySql = dash_admin_index_order_sql($tri);

        if ($keywordId > 0) {
            $filtersKw = '
                FROM rss_post r
                JOIN post_keyword pk ON pk.hash_post = r.hash
                JOIN keyword k ON k.id_keyword = pk.id_keyword
                WHERE ' . dash_admin_rss_editorial_inbox_sql('r') . '
                  ' . ($sourceFilter === null ? '' : ' AND r.source = :source_name ') . '
                  AND pk.id_keyword = :keyword_id' . $promoExclude;

            $sqlCount = 'SELECT COUNT(DISTINCT r.id) ' . $filtersKw;
            $stCount = $bdd->prepare($sqlCount);
            if ($sourceFilter !== null) {
                $stCount->bindValue(':source_name', $sourceFilter, PDO::PARAM_STR);
            }
            $stCount->bindValue(':keyword_id', $keywordId, PDO::PARAM_INT);
            $stCount->execute();
            $totalRows = (int) $stCount->fetchColumn();

            $pagination = dash_admin_pagination_state($page, $totalRows, $perPage);
            $page = $pagination['page'];
            $totalPages = $pagination['totalPages'];
            $offset = $pagination['offset'];

            $sql = '
                SELECT DISTINCT r.id, r.id AS id, r.id_theme, r.source, r.author, r.title, ' . $textSelect . ', r.link, r.hash,
                       DATE_FORMAT(r.date, "%d") AS jour,
                       DATE_FORMAT(r.date, "%c") AS numero_mois,
                       DATE_FORMAT(r.date, "%Y %T") AS annee_heure
                ' . $filtersKw . '
                ' . $orderBySql . '
                LIMIT :lim_offset, :lim_count';
            $result = $bdd->prepare($sql);
            if ($sourceFilter !== null) {
                $result->bindValue(':source_name', $sourceFilter, PDO::PARAM_STR);
            }
            $result->bindValue(':keyword_id', $keywordId, PDO::PARAM_INT);
            $result->bindValue(':lim_offset', $offset, PDO::PARAM_INT);
            $result->bindValue(':lim_count', $perPage, PDO::PARAM_INT);
            $result->execute();
        } else {
            $filters = '
                FROM rss_post r
                WHERE ' . dash_admin_rss_editorial_inbox_sql('r') . '
                  ' . ($sourceFilter === null ? '' : ' AND r.source = :source_name ') . $promoExclude;

            $sqlCount = 'SELECT COUNT(*) ' . $filters;
            $stCount = $bdd->prepare($sqlCount);
            if ($sourceFilter !== null) {
                $stCount->bindValue(':source_name', $sourceFilter, PDO::PARAM_STR);
            }
            $stCount->execute();
            $totalRows = (int) $stCount->fetchColumn();

            $pagination = dash_admin_pagination_state($page, $totalRows, $perPage);
            $page = $pagination['page'];
            $totalPages = $pagination['totalPages'];
            $offset = $pagination['offset'];

            $sql = '
                SELECT r.id, r.id_theme, r.source, r.author, r.title, ' . $textSelect . ', r.link, r.hash,
                       DATE_FORMAT(r.date, "%d") AS jour,
                       DATE_FORMAT(r.date, "%c") AS numero_mois,
                       DATE_FORMAT(r.date, "%Y %T") AS annee_heure
                ' . $filters . '
                ' . $orderBySql . '
                LIMIT :lim_offset, :lim_count';
            $result = $bdd->prepare($sql);
            if ($sourceFilter !== null) {
                $result->bindValue(':source_name', $sourceFilter, PDO::PARAM_STR);
            }
            $result->bindValue(':lim_offset', $offset, PDO::PARAM_INT);
            $result->bindValue(':lim_count', $perPage, PDO::PARAM_INT);
            $result->execute();
        }

        $paginationQuery = array_filter([
            'keyword_id' => $keywordId > 0 ? $keywordId : null,
            'source_name' => ($source_name !== '%' && $source_name !== '') ? $source_name : null,
            'tri' => ($tri !== 'date') ? $tri : null,
        ]);
        $paginationUrl = function ($p) use ($paginationQuery) {
            $q = $paginationQuery;
            $q['page'] = (int) $p;

            return dash_admin_index_list_url($q);
        };

        $posts = [];
        $hashes = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $posts[] = $row;
            $hashes[] = $row['hash'];
        }
        $keywordsByHash = [];

        if (!empty($hashes)) {
            $inQuery = implode(',', array_fill(0, count($hashes), '?'));
            $stmt_keywords = $bdd->prepare("
                SELECT pk.hash_post, k.name_keyword, k.id_keyword
                FROM post_keyword pk
                JOIN keyword k ON pk.id_keyword = k.id_keyword
                WHERE pk.hash_post IN ($inQuery)
            ");
            $stmt_keywords->execute($hashes);
            while ($kw = $stmt_keywords->fetch(PDO::FETCH_ASSOC)) {
                $keywordsByHash[$kw['hash_post']][] = $kw;
            }
        }

        $authorByName = dash_admin_authors_lookup_for_posts($bdd, $posts);

        foreach ($posts as $rss) {
            $author = $authorByName[$rss['author'] ?? ''] ?? null;
            $themeId = isset($rss['id_theme']) ? (int) $rss['id_theme'] : null;
            $themeApplied = $themeId !== null;
            ?>
            <label class="post shadow new_post">
                <div class="post-card__head">
                    <div class="post-card__head-main">
                        <p class="data title">
                            <a href="<?php echo htmlspecialchars($rss['link']); ?>" title="<?php echo htmlspecialchars($rss['title'], ENT_QUOTES, 'UTF-8'); ?>" target="_blank">
                                <strong><?php echo htmlspecialchars($rss['title'], ENT_QUOTES, 'UTF-8'); ?></strong>
                            </a>
                            —
                            <span class="italic"><?php echo htmlspecialchars($rss['source']); ?></span>
                        </p>
                    </div>
                    <input type="checkbox" name="id_post[]" value="<?php echo $rss['id']; ?>" class="post_checkbox"<?php
                    if (isset($_POST['id_post']) && in_array($rss['id'], $_POST['id_post'])) {
                        echo ' checked';
                    }
                    ?>/>
                </div>

                <div class="data data_content post-card__excerpt"><?php
                    echo couperChaineNombre2($rss['text'], 998);
                ?></div>

                <p class="grey data post-card__date">
                    <?php
                    echo htmlspecialchars("{$rss['jour']} {$mois[(int) $rss['numero_mois']]} {$rss['annee_heure']}", ENT_QUOTES, 'UTF-8');
                    if (($rss['author'] ?? '') !== '') {
                        echo ' — ';
                        dash_admin_echo_rss_author_links($rss, $author);
                    }
                    ?>
                </p>

                <div class="post-card__controls">
                    <select name="theme_<?php echo $rss['id']; ?>" id="select_theme_<?php echo $rss['id']; ?>" class="theme-select<?php echo $themeApplied ? ' is-theme-applied' : ''; ?>">
                        <option value="" disabled<?php echo !$themeApplied ? ' selected' : ''; ?>>Ajouter un thème</option>
                        <option value="0"<?php echo $themeId === 0 ? ' selected' : ''; ?>>Ne pas mettre de thème</option>
                        <?php foreach ($themesList as $theme) { ?>
                            <option value="<?php echo $theme['id']; ?>" <?php if ($themeId === (int) $theme['id']) echo 'selected'; ?>>
                                <?php echo htmlspecialchars($theme['name']); ?>
                            </option>
                        <?php } ?>
                    </select>
                    <button type="button" id="alert_button_<?php echo $rss['id']; ?>" class="alert_button">
                        Activer / désactiver l'alerte
                    </button>
                </div>

                <div class="post-card__keywords" aria-label="Mots-clés">
                    <?php
                    $hash = $rss['hash'];
                    if (!empty($keywordsByHash[$hash])) {
                        echo '<span class="post-card__keywords-label">Mot(s)-clé(s) :</span> ';
                        $compteur = 0;
                        foreach ($keywordsByHash[$hash] as $keyword) {
                            $compteur++;
                            $kwHref = dash_admin_index_list_url([
                                'keyword_id' => (int) $keyword['id_keyword'],
                                'source_name' => $sourceFilter !== null ? $source_name : null,
                                'tri' => $tri !== 'date' ? $tri : null,
                                'page' => 1,
                            ]);
                            echo '<a href="' . htmlspecialchars($kwHref, ENT_QUOTES, 'UTF-8') . '" class="grey2 post-card__keyword-link" onclick="event.stopPropagation();">';
                            if ($compteur > 1) {
                                echo ', ';
                            }
                            echo htmlspecialchars($keyword['name_keyword']) . '</a>';
                        }
                    } else {
                        echo '<span class="post-card__keywords-empty">Aucun mot-clé associé.</span>';
                    }
                    ?>
                    <a href="edit_keyword.php?hash_post=<?= rawurlencode($hash) ?>"
                       class="post-card__keyword-edit dash-lightbox-iframe"
                       data-fancybox
                       data-type="iframe"
                       data-src="edit_keyword.php?hash_post=<?= rawurlencode($hash) ?>"
                       data-width="520"
                       data-height="380">+ mot-clé</a>
                </div>
            </label>
        <?php } ?>

        <?php
        $dashPage = $page;
        $dashTotalPages = $totalPages;
        $dashTotalRows = $totalRows;
        $dashPageUrl = $paginationUrl;
        require __DIR__ . '/partials/pagination.php';
        ?>

        <!-- Barre d'actions en bas de l'écran -->
        <div class="extend">
            <div class="actions">
                <button type="button" id="send_to_box" class="send">Envoyer</button>
                <button type="button" id="send_to_desk" class="send">Envoyer au Pupitre</button>
                <button type="button" id="send_to_trash" class="delete">Supprimer</button>
                <button type="button" id="send_all_to_trash" class="delete">Tout supprimer</button>
            </div>
        </div>
    </form>
</div>

<div id="footer"></div>

<!-- Bouton Scroll to Top -->
<div id="scrollToTop">
    <a href="#"></a>
</div>
<!-- JavaScript en bas de page -->
<?php require __DIR__ . '/partials/scripts_footer.php'; ?>
</body>
</html>
