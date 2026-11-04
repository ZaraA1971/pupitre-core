<?php

require_once __DIR__ . '/header.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (isset($_POST['new_theme_name']) && trim((string) $_POST['new_theme_name']) !== '') {
            $rawName = trim((string) $_POST['new_theme_name']);
            $nameStored = htmlspecialchars($rawName, ENT_QUOTES, 'UTF-8');
            $test = $bdd->prepare('SELECT id FROM theme WHERE name = :name LIMIT 1');
            $test->execute(['name' => $nameStored]);
            if ($test->fetchColumn() !== false) {
                $message = 'Ce thème existe déjà !';
            } else {
                $insert_theme = $bdd->prepare('INSERT INTO theme (name, img) VALUES (:name, :img)');
                $insert_theme->execute([
                    'name' => $nameStored,
                    'img' => '',
                ]);
                $message = 'Le thème a bien été inséré.';
            }
        } elseif (isset($_POST['edit_theme'])) {
            $update_theme = $bdd->prepare('UPDATE theme SET name = :name WHERE id = :id');
            $update_theme->execute([
                'name' => htmlspecialchars((string) $_POST['theme_name'], ENT_QUOTES, 'UTF-8'),
                'id' => (int) $_POST['theme_id'],
            ]);
            $message = 'Le thème a bien été modifié.';
        } elseif (isset($_POST['delete_theme'])) {
            $tid = (int) $_POST['theme_id'];
            $bdd->exec('DELETE FROM theme WHERE id = ' . $tid);
            $bdd->exec(
                'UPDATE rss_post SET id_theme = 0, new = 1, sent = 0, deleted = 0, date_add_theme = \'0000-00-00 00:00:00\' WHERE id_theme = ' . $tid
            );
            $message = 'Le thème a bien été supprimé.';
        } elseif (isset($_POST['upload_img']) && isset($_FILES['img'])) {
            $upload = dash_admin_store_uploaded_image($_FILES['img'], 'themes');
            if (!$upload['ok']) {
                $message = $upload['error'];
            } else {
                $bdd->prepare('UPDATE theme SET img = :img WHERE id = :id')->execute([
                    'img' => $upload['filename'],
                    'id' => (int) $_POST['theme_id'],
                ]);
                $message = 'Transfert réussi !';
            }
        }
    } catch (Throwable $e) {
        $message = 'Une erreur technique s\'est produite. Merci de réessayer ou de contacter l\'administrateur.';
        if ($e instanceof PDOException && (int) $e->errorInfo[1] === 1062) {
            $message = 'Ce thème existe déjà !';
        }
        error_log('[config_theme.php] ' . $e->getMessage());
    }
}

$navCounts = dash_admin_nav_counts($bdd);
dash_admin_include_nav_main('Configuration des thèmes', $navCounts, 'config');
?>

<div id="container">
    <div class="wrapper">
        <?php if ($message !== '') {
            echo '<div class="message">' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</div>';
        } ?>
        <?php dash_admin_include_config_subnav('theme'); ?>

    <div id="config_theme">
        <h3>Configuration des thèmes</h3>
        <form action="config_theme.php" method="post" class="form_theme form_theme_style">
            <input type="text" name="new_theme_name" value=""/><input type="submit" value="Ajouter un nouveau theme"/>
        </form>

        <ul class="grey" style="list-style:square inside;">
        <?php
            $result = $bdd->query('SELECT * FROM theme ORDER BY name');
            while ($donnees = $result->fetch(PDO::FETCH_ASSOC)) {
        ?>
            <li class="theme" style=""><a href="#" title="Modifier le theme" class="toggle_form_theme"><?php echo stripslashes($donnees['name']); ?></a><br/>
                <form action="config_theme.php" method="post" class="form_theme single_theme" enctype="multipart/form-data">
                    <p>
                        Modifier le theme :<br/>
                        <input type="text" name="theme_name" value="<?php echo stripslashes($donnees['name']); ?>"/>
                        <input type="hidden" name="theme_id" value="<?php echo $donnees['id']; ?>"/>
                        <input type="submit" value="Modifier le nom" name="edit_theme"/>
                    </p>
                    <p class="img_upload">
                        <?php if (!empty($donnees['img'])) { ?>
                        <a href="../dash_img/themes/<?php echo $donnees['img']; ?>" target="_blank"><img src="../dash_img/themes/<?php echo $donnees['img']; ?>" title="Image du theme" alt="Image du theme" width="50px" class="theme_img"/></a>
                        <?php } ?>
                        <input type="hidden" name="MAX_FILE_SIZE" value="1048576" />
                        <input type="file" name="img"/><br/>
                        <input type="submit" name="upload_img" value="Charger l'image" /><br/>
                    </p>
                    <p style="margin-top:20px">
                        <input type="submit" class="delete_button" name="delete_theme" value="Supprimer le theme" onclick="if(window.confirm('Vous êtes sur le point de supprimer ce thème. Les articles liés à ce thème seront remis dans le flux.')){return true;}else{return false;}"/>
                    </p>
                </form>
            </li>
        <?php
            }
        ?>
        </ul>
    </div>

    </div>
</div>
<script src="<?php echo htmlspecialchars(dash_admin_asset('js/script.js'), ENT_QUOTES, 'UTF-8'); ?>"></script>
</body>
</html>
