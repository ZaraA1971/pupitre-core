<?php

require_once __DIR__ . '/header.php';

$message = '';
$authorEditId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$sort = $_GET['sort'] ?? $_POST['sort'] ?? null;
$viewId = isset($_GET['view']) ? (int) $_GET['view'] : 0;

if (isset($_GET['delete'])) {
    try {
        $delId = (int) $_GET['delete'];
        $bdd->prepare('DELETE FROM authors WHERE id = ?')->execute([$delId]);
        $message = 'L\'auteur a bien été supprimé.';
        if ($authorEditId === $delId) {
            $authorEditId = 0;
        }
    } catch (Throwable $e) {
        $message = 'Impossible de supprimer cet auteur.';
        error_log('[config_author.php] delete : ' . $e->getMessage());
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (isset($_POST['delete_author_post']) && !empty($_POST['id_author_post'])) {
            $bdd->prepare('DELETE FROM authors_posts WHERE id = ?')
                ->execute([(int) $_POST['id_author_post']]);
            $message = 'L\'article a bien été supprimé.';
            $authorEditId = (int) ($_POST['id'] ?? $_GET['id'] ?? $authorEditId);
        } elseif (isset($_POST['add_post'])) {
            $authorEditId = (int) ($_POST['id'] ?? $authorEditId);
            $title = trim((string) ($_POST['post_title'] ?? ''));
            $link = trim((string) ($_POST['post_link'] ?? ''));
            $source = trim((string) ($_POST['post_source'] ?? ''));
            if ($authorEditId < 1 || $title === '' || $link === '' || $source === '') {
                $message = 'L\'article n\'a pas été ajouté, veuillez bien remplir tous les champs.';
            } else {
                $bdd->prepare('
                    INSERT INTO authors_posts(id_author, title, link, source, date)
                    VALUES(:id_author, :title, :link, :source, :date)
                ')->execute([
                    'id_author' => $authorEditId,
                    'title' => htmlspecialchars($title, ENT_QUOTES, 'UTF-8'),
                    'link' => htmlspecialchars($link, ENT_QUOTES, 'UTF-8'),
                    'source' => htmlspecialchars($source, ENT_QUOTES, 'UTF-8'),
                    'date' => date('Y-m-d H:i:s'),
                ]);
                $message = 'L\'article a bien été ajouté.';
            }
        } elseif (isset($_POST['edit_author'])) {
            $authorEditId = (int) ($_POST['id'] ?? 0);
            $fields = dash_admin_author_fields_from_post($_POST);
            if ($authorEditId < 1 || $fields['name'] === '') {
                $message = 'Modification impossible : identifiant ou nom manquant.';
            } else {
                $bdd->prepare('
                    UPDATE authors SET
                        name = :name, nom = :nom, prenom = :prenom, description = :description,
                        media = :media, mail = :mail, tel = :tel, website = :website, twitter = :twitter
                    WHERE id = :id
                ')->execute($fields + ['id' => $authorEditId]);
                $message = 'Modifications effectuées.';
                if (isset($_FILES['img'])) {
                    $uploadMsg = dash_admin_author_apply_image_upload($bdd, $authorEditId, $_FILES['img']);
                    if ($uploadMsg !== null) {
                        $message = $uploadMsg;
                    }
                }
            }
        } elseif (isset($_POST['author'])) {
            $fields = dash_admin_author_fields_from_post($_POST);
            if ($fields['name'] === '') {
                $message = 'L\'identifiant RSS (name) est obligatoire.';
            } else {
                $test = $bdd->prepare('SELECT id FROM authors WHERE name = ? LIMIT 1');
                $test->execute([$fields['name']]);
                if ($test->fetchColumn() !== false) {
                    $message = 'Cet auteur existe déjà !';
                } else {
                    $bdd->prepare('
                        INSERT INTO authors(name, nom, prenom, description, media, mail, tel, website, twitter)
                        VALUES(:name, :nom, :prenom, :description, :media, :mail, :tel, :website, :twitter)
                    ')->execute($fields);
                    $newId = (int) $bdd->lastInsertId();
                    $message = 'L\'auteur a bien été inséré.';
                    if (isset($_FILES['img'])) {
                        $uploadMsg = dash_admin_author_apply_image_upload($bdd, $newId, $_FILES['img']);
                        if ($uploadMsg !== null) {
                            $message = $uploadMsg;
                        }
                    }
                }
            }
        }
    } catch (Throwable $e) {
        $message = 'Une erreur technique s\'est produite.';
        error_log('[config_author.php] ' . $e->getMessage());
    }
}

$navCounts = dash_admin_nav_counts($bdd);
dash_admin_include_nav_main('Configuration des auteurs', $navCounts, 'config');

$authorPlaceholderImg = 'https://images2.wikia.nocookie.net/__cb20110227154716/lanoire/images/e/ee/Unknown-person.gif';

?>
<div id="container">
    <div class="wrapper">
        <?php dash_admin_include_config_subnav('author'); ?>
        <?php if ($message !== '') {
            echo '<div class="message">' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</div>';
        } ?>

<?php if ($authorEditId > 0) {
    $stmt = $bdd->prepare('SELECT * FROM authors WHERE id = ?');
    $stmt->execute([$authorEditId]);
    $author = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$author) {
        echo '<p class="message">Auteur introuvable.</p>';
    } else {
?>
    <p style="float:right;"><a href="config_author.php">Retour</a></p>

    <h3>Modification de l'auteur</h3>

    <form method="post" action="config_author.php?id=<?= (int) $authorEditId ?>" class="form_rss" style="width:900px; margin-bottom:25px;" enctype="multipart/form-data">
        <p>
            Identifiant RSS (à ne pas modifier)<br/>
            <input type="text" name="name" value="<?= htmlspecialchars(stripslashes((string) $author['name']), ENT_QUOTES, 'UTF-8') ?>"/><br/>
            Nom<br/>
            <input type="text" name="nom" value="<?= htmlspecialchars(stripslashes((string) $author['nom']), ENT_QUOTES, 'UTF-8') ?>"/><br/>
            Prénom<br/>
            <input type="text" name="prenom" value="<?= htmlspecialchars(stripslashes((string) $author['prenom']), ENT_QUOTES, 'UTF-8') ?>"/><br/>
            Description<br/>
            <textarea name="description"><?= htmlspecialchars(stripslashes((string) $author['description']), ENT_QUOTES, 'UTF-8') ?></textarea><br/>
            Média<br/>
            <input type="text" name="media" value="<?= htmlspecialchars(stripslashes((string) $author['media']), ENT_QUOTES, 'UTF-8') ?>"/><br/>
            Mail<br/>
            <input type="text" name="mail" value="<?= htmlspecialchars(stripslashes((string) $author['mail']), ENT_QUOTES, 'UTF-8') ?>"/><br/>
            Tel<br/>
            <input type="text" name="tel" value="<?= htmlspecialchars(stripslashes((string) $author['tel']), ENT_QUOTES, 'UTF-8') ?>"/><br/>
            Site web<br/>
            <input type="text" name="website" value="<?= htmlspecialchars(stripslashes((string) $author['website']), ENT_QUOTES, 'UTF-8') ?>"/><br/>
            Twitter<br/>
            <input type="text" name="twitter" value="<?= htmlspecialchars(stripslashes((string) $author['twitter']), ENT_QUOTES, 'UTF-8') ?>"/><br/>
            Image
            <p class="img_upload">
                <?php if (!empty($author['img'])) { ?>
                    <a href="../dash_img/authors/<?= htmlspecialchars((string) $author['img'], ENT_QUOTES, 'UTF-8') ?>" target="_blank">
                        <img src="../dash_img/authors/<?= htmlspecialchars((string) $author['img'], ENT_QUOTES, 'UTF-8') ?>" title="Image de l'auteur" alt="Image de l'auteur" width="50" class="theme_img"/>
                    </a>
                <?php } else { ?>
                    <img src="<?= htmlspecialchars($authorPlaceholderImg, ENT_QUOTES, 'UTF-8') ?>" title="Image de l'auteur" alt="Image de l'auteur" width="50" class="theme_img"/>
                <?php } ?>
                <input type="hidden" name="MAX_FILE_SIZE" value="1048576" />
                <input type="file" name="img"/><br/>
            </p>
            <input type="hidden" name="id" value="<?= (int) $author['id'] ?>"/>
        </p>
        <input type="submit" name="edit_author" style="margin-top: 20px; float: left; clear: both;" value="Appliquer"/>
    </form>

    <div style="line-height:20px; float:left;">
        <h3 style="margin-bottom:15px;">Articles de l'auteur</h3>
        <?php
        $postsStmt = $bdd->prepare('
            SELECT *, DATE_FORMAT(date, \'%d/%m/%Y\') AS cdate
            FROM authors_posts WHERE id_author = ?
            ORDER BY date DESC
        ');
        $postsStmt->execute([$authorEditId]);
        $posts = $postsStmt->fetchAll(PDO::FETCH_ASSOC);
        if ($posts === []) {
            echo '<p>Aucun article ajouté pour cet auteur.</p>';
        }
        foreach ($posts as $authorPost) {
        ?>
        <form method="post" action="config_author.php?id=<?= (int) $authorEditId ?>">
            &laquo;<a href="<?= htmlspecialchars((string) $authorPost['link'], ENT_QUOTES, 'UTF-8') ?>" target="_blank"><?= htmlspecialchars(stripslashes((string) $authorPost['title']), ENT_QUOTES, 'UTF-8') ?></a>&raquo;
            (<?= htmlspecialchars(stripslashes((string) $authorPost['source']), ENT_QUOTES, 'UTF-8') ?>) — <?= htmlspecialchars((string) $authorPost['cdate'], ENT_QUOTES, 'UTF-8') ?>
            <input type="hidden" name="id_author_post" value="<?= (int) $authorPost['id'] ?>"/>
            <input type="hidden" name="id" value="<?= (int) $authorEditId ?>"/>
            <input type="submit" name="delete_author_post" value="Supprimer" class="delete_button" onclick="return window.confirm('Vous êtes sur le point de supprimer cet article.');"/>
        </form>
        <?php } ?>
    </div>

    <form method="post" action="config_author.php?id=<?= (int) $authorEditId ?>" class="form_rss" style="width:220px; float:right;">
        <p style="margin-bottom:15px;"><strong>Ajouter un nouvel article</strong></p>
        <p>
            Titre<br/><input type="text" name="post_title"/><br/>
            Lien URL<br/><input type="text" name="post_link"/><br/>
            Média<br/><input type="text" name="post_source"/><br/>
        </p>
        <input type="hidden" name="id" value="<?= (int) $authorEditId ?>"/>
        <input type="submit" name="add_post" value="Ajouter"/>
    </form>

<?php
    }
} else {
?>
    <div id="config_theme">
        <h3>Configuration des auteurs</h3>

        <p id="sort" style="margin-top:20px">
            <?php
            $sortLinks = ['<a href="config_author.php?sort=all">Tous</a>'];
            foreach (range('a', 'z') as $letter) {
                $sortLinks[] = '<a href="config_author.php?sort=' . $letter . '">' . strtoupper($letter) . '</a>';
            }
            $sortLinks[] = '<a href="config_author.php?sort=number">0-9</a>';
            echo implode(' - ', $sortLinks);
            ?>
        </p>

        <div id="author_list">
        <?php
        if ($viewId > 0) {
            $listStmt = $bdd->prepare('SELECT * FROM authors WHERE id = ? ORDER BY nom');
            $listStmt->execute([$viewId]);
        } elseif ($sort === 'number') {
            $listStmt = $bdd->query('SELECT * FROM authors WHERE nom REGEXP \'^[0-9]\' ORDER BY nom');
        } elseif ($sort !== null && $sort !== '' && $sort !== 'all') {
            $listStmt = $bdd->prepare('SELECT * FROM authors WHERE nom LIKE :sort ORDER BY nom');
            $listStmt->execute(['sort' => $sort . '%']);
        } else {
            $listStmt = $bdd->query('SELECT * FROM authors ORDER BY nom');
        }

        $authors = $listStmt->fetchAll(PDO::FETCH_ASSOC);
        if ($authors === []) {
            echo '<p>Aucun auteur ne correspond à vos critères.</p>';
        }

        foreach ($authors as $author) {
            $authorName = trim(stripslashes((string) $author['prenom']) . ' ' . stripslashes((string) $author['nom']));
        ?>
            <h4>
                <span>
                    <?= htmlspecialchars($authorName, ENT_QUOTES, 'UTF-8') ?>
                    <a href="config_author.php?id=<?= (int) $author['id'] ?>">Modifier</a> —
                    <a href="config_author.php?delete=<?= (int) $author['id'] ?>" onclick="return window.confirm('Vous êtes sur le point de supprimer cet auteur.');">Supprimer</a>
                </span>
            </h4>
            <div class="single_author">
                <?php if (!empty($author['img'])) { ?>
                    <a href="../dash_img/authors/<?= htmlspecialchars((string) $author['img'], ENT_QUOTES, 'UTF-8') ?>" target="_blank">
                        <img src="../dash_img/authors/<?= htmlspecialchars((string) $author['img'], ENT_QUOTES, 'UTF-8') ?>" title="Image de l'auteur" alt="Image de l'auteur" width="50" class="theme_img"/>
                    </a>
                <?php } else { ?>
                    <img src="<?= htmlspecialchars($authorPlaceholderImg, ENT_QUOTES, 'UTF-8') ?>" title="Image de l'auteur" alt="Image de l'auteur" width="50" class="theme_img"/>
                <?php } ?>
                <p><strong>Description</strong> : <?= htmlspecialchars(stripslashes((string) $author['description']), ENT_QUOTES, 'UTF-8') ?></p>
                <p><strong>Média</strong> : <?= htmlspecialchars(stripslashes((string) $author['media']), ENT_QUOTES, 'UTF-8') ?></p>
                <p><strong>Mail</strong> : <a href="mailto:<?= htmlspecialchars((string) $author['mail'], ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars((string) $author['mail'], ENT_QUOTES, 'UTF-8') ?></a></p>
                <p><strong>Tel</strong> : <?= htmlspecialchars(stripslashes((string) $author['tel']), ENT_QUOTES, 'UTF-8') ?></p>
                <p><strong>Site web</strong> : <a href="<?= htmlspecialchars((string) $author['website'], ENT_QUOTES, 'UTF-8') ?>" target="_blank"><?= htmlspecialchars((string) $author['website'], ENT_QUOTES, 'UTF-8') ?></a></p>
                <p><strong>Twitter</strong> : <a href="https://twitter.com/<?= htmlspecialchars((string) $author['twitter'], ENT_QUOTES, 'UTF-8') ?>" target="_blank">@<?= htmlspecialchars((string) $author['twitter'], ENT_QUOTES, 'UTF-8') ?></a></p>
            </div>
        <?php } ?>
        </div>

        <div id="add_new_author">
            <form method="post" action="config_author.php" class="form_rss" enctype="multipart/form-data">
                <h3>Ajout d'un nouvel auteur</h3>
                <p>
                    Identifiant RSS (à ne pas modifier)<br/><input type="text" name="name" /><br/>
                    Nom<br/><input type="text" name="nom" /><br/>
                    Prénom<br/><input type="text" name="prenom" /><br/>
                    Description<br/><textarea name="description"></textarea><br/>
                    Média<br/><input type="text" name="media" /><br/>
                    Mail<br/><input type="text" name="mail" /><br/>
                    Tel<br/><input type="text" name="tel" /><br/>
                    Site web<br/><input type="text" name="website" /><br/>
                    Twitter<br/><input type="text" name="twitter" /><br/>
                    Image
                    <p class="img_upload">
                        <input type="hidden" name="MAX_FILE_SIZE" value="1048576" />
                        <input type="file" name="img"/><br/>
                    </p>
                </p>
                <input type="submit" name="author" value="Ajouter l'auteur"/>
            </form>
        </div>
    </div>
<?php } ?>

    </div>
</div>
<script src="<?php echo htmlspecialchars(dash_admin_asset('js/script.js'), ENT_QUOTES, 'UTF-8'); ?>"></script>
</body>
</html>
