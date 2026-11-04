<?php
require_once __DIR__ . '/header.php';

$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = dash_admin_list_per_page('sent');
$keywordId = !empty($_GET['keyword_id']) ? (int) $_GET['keyword_id'] : 0;
$filterUnprocessed = isset($_GET['filter']) && $_GET['filter'] === 'unprocessed';
?>

<?php
$navTitle = "Boîte d'envoi";
if ($keywordId > 0) {
    $stmt = $bdd->prepare('SELECT name_keyword FROM keyword WHERE id_keyword = ?');
    $stmt->execute([$keywordId]);
    $keyword_name = $stmt->fetch(PDO::FETCH_ASSOC);
    $navTitle = 'Boîte d\'envoi : Affichage par mot-clé "' . ($keyword_name['name_keyword'] ?? '') . '"';
}
dash_admin_include_nav_main($navTitle, dash_admin_nav_counts($bdd), 'sent');
?>

<!-- Conteneur principal -->
<div id="container">
<form name="sendform" method="post" action="sent.php" id="sendform">
    <?php
    $sentListParams = array_filter([
        'keyword_id' => $keywordId > 0 ? $keywordId : null,
        'filter' => $filterUnprocessed ? 'unprocessed' : null,
    ]);
    $sentListUrl = function ($p) use ($sentListParams) {
        $q = $sentListParams;
        $q['page'] = (int) $p;

        return 'sent.php?' . http_build_query($q);
    };
    ?>

    <!-- Tri : liens GET pour compatibilité avec la pagination -->
    <div class="actions shadow">
        <div class="sort">
            <a href="<?= htmlspecialchars($sentListUrl(1), ENT_QUOTES, 'UTF-8') ?>" class="sort_submit <?= !$filterUnprocessed ? 'current_action' : '' ?>">Par ordre chronologique</a>
            <a href="<?= htmlspecialchars(
                'sent.php?' . http_build_query(array_filter([
                    'keyword_id' => $keywordId > 0 ? $keywordId : null,
                    'filter' => 'unprocessed',
                    'page' => 1,
                ])),
                ENT_QUOTES,
                'UTF-8'
            ) ?>" class="sort_submit <?= $filterUnprocessed ? 'current_action' : '' ?>">Par articles non-traités</a>
        </div>
    </div>

    <!-- Barre d'actions (thèmes, alertes, actions) -->
    <div class="extend shadow">
        <div class="actions">
            <button id="toggle_alert" type="button" class="send">Alerte</button> <!-- Bouton pour activer une alerte -->
            <select name="theme" id="theme_select"> <!-- Sélection du thème -->
                <option value="empty" selected>Ajouter un thème</option>
                <option value="0">Ne pas mettre de thème</option>
                <?php
                $themes = $bdd->query('SELECT id, name FROM theme ORDER BY name');
                while ($theme = $themes->fetch(PDO::FETCH_ASSOC)) {
                    echo '<option value="'.$theme['id'].'">'.htmlspecialchars($theme['name']).'</option>';
                }
                ?>
            </select>
            <button id="apply_changes" type="button" class="send">Appliquer</button>
            <button id="send_to_desk" type="button" class="send">Envoyer au Pupitre</button>
            <button id="send_to_classify" type="button" class="send">Remettre dans le flux</button>
            <button id="send_to_trash" type="button" class="delete">Déplacer vers la corbeille</button>
        </div>
    </div>

    <?php
    $listSelect = '
        rss_post.id, rss_post.id_theme, rss_post.source, rss_post.author, rss_post.title,
        LEFT(rss_post.text, 1200) AS text, rss_post.link,
        DATE_FORMAT(rss_post.date, "%d") AS jour,
        DATE_FORMAT(rss_post.date, "%c") AS numero_mois,
        DATE_FORMAT(rss_post.date, "%Y %T") AS annee_heure
    ';

    if ($keywordId > 0) {
        $filtersKw = '
            FROM rss_post
            JOIN post_keyword ON post_keyword.hash_post = rss_post.hash
            WHERE post_keyword.id_keyword = :keyword_id AND ' . dash_admin_rss_sent_sql('rss_post');

        $stCount = $bdd->prepare('SELECT COUNT(DISTINCT rss_post.id) ' . $filtersKw);
        $stCount->bindValue(':keyword_id', $keywordId, PDO::PARAM_INT);
        $stCount->execute();
        $totalRows = (int) $stCount->fetchColumn();

        $pagination = dash_admin_pagination_state($page, $totalRows, $perPage);
        $page = $pagination['page'];
        $totalPages = $pagination['totalPages'];
        $offset = $pagination['offset'];

        $sql = '
            SELECT DISTINCT ' . $listSelect . '
            ' . $filtersKw . '
            ORDER BY rss_post.date DESC
            LIMIT :lim_offset, :lim_count';
        $stmt = $bdd->prepare($sql);
        $stmt->bindValue(':keyword_id', $keywordId, PDO::PARAM_INT);
        $stmt->bindValue(':lim_offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':lim_count', $perPage, PDO::PARAM_INT);
        $stmt->execute();
    } elseif ($filterUnprocessed) {
        $filters = '
            FROM rss_post
            WHERE breve_spip = \'0\' AND id_theme = 0 AND ' . dash_admin_rss_sent_sql();

        $totalRows = (int) $bdd->query('SELECT COUNT(*) ' . $filters)->fetchColumn();

        $pagination = dash_admin_pagination_state($page, $totalRows, $perPage);
        $page = $pagination['page'];
        $totalPages = $pagination['totalPages'];
        $offset = $pagination['offset'];

        $sql = '
            SELECT ' . $listSelect . '
            ' . $filters . '
            ORDER BY date DESC
            LIMIT :lim_offset, :lim_count';
        $stmt = $bdd->prepare($sql);
        $stmt->bindValue(':lim_offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':lim_count', $perPage, PDO::PARAM_INT);
        $stmt->execute();
    } else {
        $filters = '
            FROM rss_post
            WHERE ' . dash_admin_rss_sent_sql();

        $totalRows = (int) $bdd->query('SELECT COUNT(*) ' . $filters)->fetchColumn();

        $pagination = dash_admin_pagination_state($page, $totalRows, $perPage);
        $page = $pagination['page'];
        $totalPages = $pagination['totalPages'];
        $offset = $pagination['offset'];

        $sql = '
            SELECT ' . $listSelect . '
            ' . $filters . '
            ORDER BY date DESC
            LIMIT :lim_offset, :lim_count';
        $stmt = $bdd->prepare($sql);
        $stmt->bindValue(':lim_offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':lim_count', $perPage, PDO::PARAM_INT);
        $stmt->execute();
    }

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $authorByName = dash_admin_authors_lookup_for_posts($bdd, $rows);

    foreach ($rows as $rss) {
        $author = $authorByName[$rss['author'] ?? ''] ?? null;
        ?>
    <div class="entry">
        <div class="post shadow <?= ($rss['id_theme'] > 0 ? 'sent' : 'not_sent') ?>">
            <p class="data title">
                <a href="<?= htmlspecialchars($rss['link'], ENT_QUOTES, 'UTF-8') ?>" target="_blank">
                    <strong><?= htmlspecialchars($rss['title'], ENT_QUOTES, 'UTF-8') ?></strong>
                </a> - <span class="italic"><?= htmlspecialchars($rss['source'], ENT_QUOTES, 'UTF-8') ?></span>
            </p>
            <input type="checkbox" name="id_post[]" value="<?= (int) $rss['id'] ?>" class="post_checkbox"/>
            <div class="data data_content"><?= htmlspecialchars(couperChaineNombre2($rss['text'], 998), ENT_QUOTES, 'UTF-8') ?></div>
            <p class="grey data">
                <?php
                echo htmlspecialchars("{$rss['jour']} {$mois[(int) $rss['numero_mois']]} {$rss['annee_heure']}", ENT_QUOTES, 'UTF-8');
                if (($rss['author'] ?? '') !== '') {
                    echo ' — ';
                    dash_admin_echo_rss_author_links($rss, $author);
                }
                ?>
            </p>
        </div>
    </div>
    <?php } ?>

    <?php
    $dashPage = $page;
    $dashTotalPages = $totalPages;
    $dashTotalRows = $totalRows;
    $dashPageUrl = $sentListUrl;
    require __DIR__ . '/partials/pagination.php';
    ?>

</form>
</div>

<!-- JavaScript natif pour gérer les interactions -->
<?php require __DIR__ . '/partials/scripts_footer.php'; ?>
<script>
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');

    // Fonction générique pour les requêtes AJAX
    async function sendRequest(url, data) {
        loader.style.display = 'block';
        try {
            const response = await fetch(url, { method: 'POST', body: data, credentials: 'same-origin' });
            const text = await response.text();
            if (!response.ok) {
                return { ok: false, text };
            }
            return { ok: true, text };
        } catch (error) {
            return { ok: false, text: String(error) };
        } finally {
            loader.style.display = 'none';
        }
    }

    async function sendAndCloseCards(url, data) {
        const cards = dashAdminCheckedCards(document.getElementById('sendform'));
        cards.forEach((card) => card.classList.add('is-sending'));
        try {
            const result = await sendRequest(url, data);
            if (result.ok) {
                const processed = url.indexOf('send_to_desk.php') !== -1
                    ? dashAdminProcessedIds(result.text)
                    : null;
                dashAdminCloseCheckedPosts(dashAdminCardsForIds(cards, processed));
            }
            return result;
        } finally {
            cards.forEach((card) => card.classList.remove('is-sending'));
        }
    }

    // Récupère les données du formulaire en ajoutant une action spécifique
    function collectData(extra) {
        const data = new FormData(document.getElementById('sendform'));
        data.append(extra, 1);
        return data;
    }

    // Association des actions aux boutons correspondants
    document.getElementById('apply_changes').addEventListener('click', () => sendAndCloseCards('sent_actions.php', collectData('validate')));
    document.getElementById('send_to_desk').addEventListener('click', async () => {
        const btn = document.getElementById('send_to_desk');
        if (!btn || btn.disabled || btn.classList.contains('is-busy')) return;
        btn.disabled = true;
        btn.classList.add('is-busy');
        try {
            await sendAndCloseCards('send_to_desk.php', collectData('to_desk'));
        } finally {
            btn.classList.remove('is-busy');
            btn.disabled = false;
        }
    });
    document.getElementById('send_to_classify').addEventListener('click', () => sendAndCloseCards('sent_actions.php', collectData('toclassify')));
    document.getElementById('send_to_trash').addEventListener('click', () => sendAndCloseCards('sent_actions.php', collectData('trash')));

    // Alerte : envoi vers sent_actions.php (articles cochés)
    document.getElementById('toggle_alert').addEventListener('click', async () => {
        if (document.querySelectorAll('.post_checkbox:checked').length === 0) {
            return;
        }

        const data = collectData('validate');
        data.append('alert', 'oui');
        await sendAndCloseCards('sent_actions.php', data);
    });
});
</script>

<div id="footer"></div>
</body>
</html>
