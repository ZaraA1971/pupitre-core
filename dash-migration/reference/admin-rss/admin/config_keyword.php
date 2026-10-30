<?php

require_once __DIR__ . '/header.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!empty($_POST['new_keyword_name'])) {
            $test = $bdd->prepare('SELECT id_keyword FROM keyword WHERE name_keyword = :name LIMIT 1');
            $test->execute(['name' => $_POST['new_keyword_name']]);
            if ($test->fetchColumn() !== false) {
                $message = 'Ce mot-clé existe déjà !';
            } else {
                $insert_keyword = $bdd->prepare('INSERT INTO keyword(name_keyword) VALUES(:name)');
                $insert_keyword->execute(['name' => strtolower((string) $_POST['new_keyword_name'])]);
                $message = 'Le mot-clé a bien été inséré.';
            }
        } elseif (isset($_POST['edit_keyword'])) {
            $update_keyword = $bdd->prepare('UPDATE keyword SET name_keyword = :name WHERE id_keyword = :id');
            $update_keyword->execute([
                'name' => strtolower(htmlspecialchars((string) $_POST['keyword_name'], ENT_QUOTES, 'UTF-8')),
                'id' => (int) $_POST['keyword_id'],
            ]);
            $message = 'Le mot-clé a bien été modifié.';
        } elseif (isset($_POST['delete_keyword'])) {
            $kid = (int) $_POST['keyword_id'];
            $bdd->prepare('DELETE FROM keyword WHERE id_keyword = ?')->execute([$kid]);
            $bdd->prepare('DELETE FROM post_keyword WHERE id_keyword = ?')->execute([$kid]);
            $bdd->prepare('DELETE FROM keyword_alias WHERE id_keyword = ?')->execute([$kid]);
            $message = 'Le mot-clé a bien été supprimé.';
        } elseif (!empty($_POST['new_alias_name']) && isset($_POST['keyword_id'])) {
            $insert_alias = $bdd->prepare('INSERT INTO alias(name_alias) VALUES(:name)');
            $insert_alias->execute(['name' => strtolower((string) $_POST['new_alias_name'])]);
            $id_new_alias = (int) $bdd->lastInsertId();
            $bdd->prepare('INSERT INTO keyword_alias(id_alias, id_keyword) VALUES(?, ?)')
                ->execute([$id_new_alias, (int) $_POST['keyword_id']]);
            $message = 'L\'alias a bien été inséré.';
        } elseif (isset($_POST['edit_alias'])) {
            $update_alias = $bdd->prepare('UPDATE alias SET name_alias = :name WHERE id_alias = :id');
            $update_alias->execute([
                'name' => strtolower(htmlspecialchars((string) $_POST['alias_name'], ENT_QUOTES, 'UTF-8')),
                'id' => (int) $_POST['alias_id'],
            ]);
            $message = 'L\'alias a bien été modifié.';
        } elseif (isset($_POST['delete_alias'])) {
            $aid = (int) $_POST['alias_id'];
            $bdd->prepare('DELETE FROM alias WHERE id_alias = ?')->execute([$aid]);
            $bdd->prepare('DELETE FROM keyword_alias WHERE id_alias = ?')->execute([$aid]);
            $message = 'L\'alias a bien été supprimé.';
        }
    } catch (Throwable $e) {
        $message = 'Une erreur technique s\'est produite.';
        error_log('[config_keyword.php] ' . $e->getMessage());
    }
}

$sort = $_GET['sort'] ?? $_POST['sort'] ?? null;

$navCounts = dash_admin_nav_counts($bdd);
dash_admin_include_nav_main('Configuration des mots-clés', $navCounts, 'config');
?>

<div id="container">
    <div class="wrapper">
        <?php dash_admin_include_config_subnav('keyword'); ?>
        <?php if ($message !== '') {
            echo '<div class="message">' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</div>';
        } ?>

    <div id="config_keyword">

        <h3>Configuration des mots-clés</h3>

        <form action="config_keyword.php" method="post" class="form_theme form_theme_style">
            <?php if ($sort !== null && $sort !== '') { ?><input type="hidden" name="sort" value="<?php echo htmlspecialchars((string) $sort, ENT_QUOTES, 'UTF-8'); ?>"/><?php } ?>
            <input type="text" name="new_keyword_name" value=""/><input type="submit" value="Ajouter"/>
        </form>

        <p id="sort">
        <a href="config_keyword.php?sort=a">A</a> - <a href="config_keyword.php?sort=b">B</a> - <a href="config_keyword.php?sort=c">C</a> - <a href="config_keyword.php?sort=d">D</a> - <a href="config_keyword.php?sort=e">E</a> - <a href="config_keyword.php?sort=f">F</a> - <a href="config_keyword.php?sort=g">G</a> - <a href="config_keyword.php?sort=h">H</a> - <a href="config_keyword.php?sort=i">I</a> - <a href="config_keyword.php?sort=j">J</a> - <a href="config_keyword.php?sort=k">K</a> - <a href="config_keyword.php?sort=l">L</a> - <a href="config_keyword.php?sort=m">M</a> - <a href="config_keyword.php?sort=n">N</a> - <a href="config_keyword.php?sort=o">O</a> - <a href="config_keyword.php?sort=p">P</a> - <a href="config_keyword.php?sort=q">Q</a> - <a href="config_keyword.php?sort=r">R</a> - <a href="config_keyword.php?sort=s">S</a> - <a href="config_keyword.php?sort=t">T</a> - <a href="config_keyword.php?sort=u">U</a> - <a href="config_keyword.php?sort=v">V</a> - <a href="config_keyword.php?sort=w">W</a> - <a href="config_keyword.php?sort=x">X</a> - <a href="config_keyword.php?sort=y">Y</a> - <a href="config_keyword.php?sort=z">Z</a> - <a href="config_keyword.php?sort=number">0-9</a>
        </p>
    <?php
        if ($sort === 'number') {
            $stmt = $bdd->prepare('SELECT * FROM keyword WHERE name_keyword REGEXP \'^[0-9]\' ORDER BY name_keyword');
            $stmt->execute();
        } elseif ($sort !== null && $sort !== '') {
            $stmt = $bdd->prepare('SELECT * FROM keyword WHERE name_keyword LIKE :sort ORDER BY name_keyword');
            $stmt->execute(['sort' => $sort . '%']);
        } else {
            $stmt = $bdd->prepare('SELECT * FROM keyword WHERE name_keyword LIKE \'a%\' ORDER BY name_keyword');
            $stmt->execute();
        }
        while ($donnees = $stmt->fetch(PDO::FETCH_ASSOC)) {
    ?>
        <form action="config_keyword.php" method="post" class="form_theme parent_trigger_alias">
            <input type="text" name="keyword_name" value="<?php echo htmlspecialchars(stripslashes($donnees['name_keyword']), ENT_QUOTES, 'UTF-8'); ?>"/>
            <input type="hidden" name="keyword_id" value="<?php echo (int) $donnees['id_keyword']; ?>"/>
            <?php if ($sort !== null && $sort !== '') { ?><input type="hidden" name="sort" value="<?php echo htmlspecialchars((string) $sort, ENT_QUOTES, 'UTF-8'); ?>"/><?php } ?>
            <input type="submit" name="edit_keyword" value="Modifier"/><input type="submit" class="delete_button" name="delete_keyword" value="Supprimer" onclick="if(window.confirm('Vous êtes sur le point de supprimer ce mot-clé.')){return true;}else{return false;}"/><span class="trigger_alias">Alias</span>
        </form>
        <div class="show_alias">
            <?php
                $get_alias = $bdd->prepare('
                    SELECT * FROM keyword
                    JOIN keyword_alias ON keyword.id_keyword = keyword_alias.id_keyword
                    JOIN alias ON alias.id_alias = keyword_alias.id_alias
                    WHERE keyword.id_keyword = :id_keyword
                ');
                $get_alias->execute(['id_keyword' => $donnees['id_keyword']]);
                while ($alias = $get_alias->fetch(PDO::FETCH_ASSOC)) {
            ?>
                <form action="config_keyword.php" method="post" class="alias">
                    <input type="text" name="alias_name" value="<?php echo htmlspecialchars(stripslashes($alias['name_alias']), ENT_QUOTES, 'UTF-8'); ?>"/>
                    <input type="hidden" name="alias_id" value="<?php echo (int) $alias['id_alias']; ?>"/>
                    <?php if ($sort !== null && $sort !== '') { ?><input type="hidden" name="sort" value="<?php echo htmlspecialchars((string) $sort, ENT_QUOTES, 'UTF-8'); ?>"/><?php } ?>
                    <input type="submit" name="edit_alias" value="Modifier"/><input type="submit" class="delete_button" name="delete_alias" value="Supprimer" onclick="if(window.confirm('Vous êtes sur le point de supprimer cet alias.')){return true;}else{return false;}"/>
                </form>

            <?php
                }
            ?>
            <form action="config_keyword.php" method="post" class="alias">
                <input type="hidden" name="keyword_id" value="<?php echo (int) $donnees['id_keyword']; ?>"/>
                <?php if ($sort !== null && $sort !== '') { ?><input type="hidden" name="sort" value="<?php echo htmlspecialchars((string) $sort, ENT_QUOTES, 'UTF-8'); ?>"/><?php } ?>
                <input type="text" name="new_alias_name" value=""/><input type="submit" value="Ajouter un nouvel alias"/>
            </form>
        </div>
    <?php
        }
    ?>
    </div>

    </div>
</div>
<script src="<?php echo htmlspecialchars(dash_admin_asset('js/script.js'), ENT_QUOTES, 'UTF-8'); ?>"></script>
</body>
</html>
