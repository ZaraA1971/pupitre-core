<?php
require_once __DIR__ . '/header.php';

$keywordId = isset($_GET['keyword_id']) ? (int) $_GET['keyword_id'] : 0;
$deletedWhere = dash_admin_rss_deleted_sql('rss_post');

$navTitle = 'Articles supprimés';
if ($keywordId > 0) {
    $stmt = $bdd->prepare('SELECT name_keyword FROM keyword WHERE id_keyword = :id');
    $stmt->execute(['id' => $keywordId]);
    $keyword_name = $stmt->fetchColumn();
    $navTitle = 'Articles supprimés : Affichage par mot-clé "' . (string) $keyword_name . '"';
}
dash_admin_include_nav_main($navTitle, dash_admin_nav_counts($bdd), 'deleted');
?>

<div id="container">
<form id="deleteform">
    <?php
    $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $limit = dash_admin_list_per_page('deleted');

    $listSelect = '
        rss_post.id, rss_post.hash, rss_post.link, rss_post.title, rss_post.source, rss_post.author,
        LEFT(rss_post.text, 1200) AS text,
        DATE_FORMAT(rss_post.date, "%d") AS jour,
        DATE_FORMAT(rss_post.date, "%c") AS numero_mois,
        DATE_FORMAT(rss_post.date, "%Y %T") AS annee_heure
    ';

    $deletedWhereBare = dash_admin_rss_deleted_sql();

    if ($keywordId > 0) {
        $count_stmt = $bdd->prepare("
            SELECT COUNT(*)
            FROM rss_post
            INNER JOIN post_keyword ON post_keyword.hash_post = rss_post.hash
            WHERE {$deletedWhere} AND post_keyword.id_keyword = :keyword_id
        ");
        $count_stmt->execute(['keyword_id' => $keywordId]);
    } else {
        $count_stmt = $bdd->query('SELECT COUNT(*) FROM rss_post WHERE ' . $deletedWhereBare);
    }

    $totalRows = (int) $count_stmt->fetchColumn();
    $pagination = dash_admin_pagination_state($page, $totalRows, $limit);
    $page = $pagination['page'];
    $totalPages = $pagination['totalPages'];
    $startpoint = $pagination['offset'];

    if ($keywordId > 0) {
        $stmt = $bdd->prepare("
            SELECT $listSelect
            FROM rss_post
            INNER JOIN post_keyword ON post_keyword.hash_post = rss_post.hash
            WHERE {$deletedWhere} AND post_keyword.id_keyword = :keyword_id
            ORDER BY rss_post.date DESC
            LIMIT :startpoint, :limit
        ");
        $stmt->bindValue(':keyword_id', $keywordId, PDO::PARAM_INT);
        $stmt->bindValue(':startpoint', $startpoint, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
    } else {
        $stmt = $bdd->prepare("
            SELECT $listSelect
            FROM rss_post
            WHERE {$deletedWhereBare}
            ORDER BY date DESC
            LIMIT :startpoint, :limit
        ");
        $stmt->bindValue(':startpoint', $startpoint, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
    }
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $authorByName = dash_admin_authors_lookup_for_posts($bdd, $rows);

    $delPageHref = static function (int $p) use ($keywordId): string {
        $q = ['page=' . $p];
        if ($keywordId > 0) {
            $q[] = 'keyword_id=' . $keywordId;
        }
        return 'deleted.php?' . implode('&', $q);
    };

    foreach ($rows as $rss) {
        $author = $authorByName[$rss['author']] ?? null;
    ?>
    <div class="entry">
        <div class="post shadow deleted_post">
            <p class="data title">
                <a href="<?php echo htmlspecialchars($rss['link'], ENT_QUOTES, 'UTF-8'); ?>" title="<?php echo htmlspecialchars($rss['title'], ENT_QUOTES, 'UTF-8'); ?>" target="_blank">
                    <strong><?php echo htmlspecialchars($rss['title'], ENT_QUOTES, 'UTF-8'); ?></strong>
                </a>
                - <span class="italic"><?php echo htmlspecialchars($rss['source'], ENT_QUOTES, 'UTF-8'); ?></span>
            </p>
            <input type="checkbox" name="id_post[]" value="<?php echo (int) $rss['id']; ?>" class="post_checkbox"/>
            <div class="data data_content">
                <?php echo htmlspecialchars(couperChaineNombre2($rss['text'], 998), ENT_QUOTES, 'UTF-8'); ?>
            </div>
            <p class="grey data">
                <?php echo htmlspecialchars("{$rss['jour']} {$mois[(int) $rss['numero_mois']]} {$rss['annee_heure']}", ENT_QUOTES, 'UTF-8'); ?>
                <?php dash_admin_echo_rss_author_links($rss, $author); ?>
            </p>
        </div>
    </div>
    <?php } ?>

    <div class="pagination">
        <?php if ($page * $limit < $totalRows) { ?>
            <div class="prev"><a href="<?php echo htmlspecialchars($delPageHref($page + 1), ENT_QUOTES, 'UTF-8'); ?>">Articles précédents</a></div>
        <?php } ?>
        <?php if ($page > 1) { ?>
            <div class="next"><a href="<?php echo htmlspecialchars($delPageHref($page - 1), ENT_QUOTES, 'UTF-8'); ?>">Articles suivants</a></div>
        <?php } ?>
    </div>

    <div class="extend shadow fixed-bottom-bar">
        <div class="actions">
            <button type="submit" id="restore" class="send">Restaurer l'article</button>
        </div>
    </div>
</form>
</div>
<div id="footer"></div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('deleteform').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(document.getElementById('deleteform'));
        formData.append('restore', 1);

        try {
            const response = await fetch('deleted_actions.php', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                document.querySelectorAll(".post_checkbox:checked").forEach(checkbox => {
                    checkbox.closest('.post').style.display = 'none';
                });
            }
        } catch (error) {
            console.error('Erreur AJAX:', error);
        }
    });
});
</script>

<?php require __DIR__ . '/partials/scripts_footer.php'; ?>

</body>
</html>
