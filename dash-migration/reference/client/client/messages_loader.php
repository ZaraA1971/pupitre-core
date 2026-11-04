<?php
declare(strict_types=1);

require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/inc/bootstrap.php';

dash_electron_boot(true);

if (!isset($_SESSION['ID_UTILISATEUR']) || !isset($_POST['user']) || $_POST['user'] === '') {
    return;
}

$userId = (int) $_SESSION['ID_UTILISATEUR'];
$peerId = (int) $_POST['user'];
$start = max(0, (int) ($_POST['start'] ?? 0));

$get_message = $bdd->prepare('
    SELECT *
    FROM (
        SELECT id_post, login_user, from_user, to_user, text, DATE_FORMAT(date, \'%d/%m/%Y %H:%i\') AS converted_date, date
        FROM messages, users
        WHERE messages.from_user = users.id_user
          AND (messages.from_user = ? OR messages.to_user = ?)
          AND (messages.to_user = ? OR messages.from_user = ?)
        ORDER BY date DESC
        LIMIT ' . $start . ', 5
    ) AS bg
    ORDER BY date
');
$get_message->execute([$peerId, $peerId, $userId, $userId]);

while ($message = $get_message->fetch(PDO::FETCH_ASSOC)) {
    if ((int) $message['from_user'] !== $userId) {
        $from_user = $message['from_user'];
    } else {
        $from_user = 'self';
    }

    if ((int) $message['id_post'] > 0) {
        require_once __DIR__ . '/connect_admin.php';
        $reponse = $bdd_admin->prepare('
            SELECT rss_post.id AS id_post, id_theme, source, title, text, author, link, hash, alert, date, date_add_theme,
                DATE_FORMAT(date, \'%Y-%m-%d\') AS last_date, DATE_FORMAT(date, \'%w\') AS numero_jour,
                DATE_FORMAT(date, \'%c\') AS numero_mois, DATE_FORMAT(date, \'%d\') AS jour,
                DATE_FORMAT(date, \'%b\') AS mois, DATE_FORMAT(date, \'%Y\') AS annee,
                DATE_FORMAT(date, \'%H\') AS heure, DATE_FORMAT(date, \'%i\') AS minute,
                theme.id AS id_theme, theme.name
            FROM rss_post, theme
            WHERE rss_post.id = ? AND rss_post.id_theme = theme.id
        ');
        $reponse->execute([(int) $message['id_post']]);
        while ($donnees = $reponse->fetch(PDO::FETCH_ASSOC)) {
        ?>
            <div class="post post_message <?php echo $from_user === 'self' ? 'right' : 'left'; ?>">
                <p class="date grey2"><span class="hour"><?php echo $donnees['heure']; ?>H<?php echo $donnees['minute']; ?></span><br/><span class="month"><?php echo $donnees['jour']; ?>/<?php echo strtoupper($donnees['mois']); ?></span></p>
                <p class="theme"><a href="index.php?theme_id=<?php echo (int) $donnees['id_theme']; ?>"><?php echo stripslashes($donnees['name']); ?></a></p>
                <p class="source grey2"><?php echo couperChaineNombre($donnees['source'], 45); ?></p>
                <p class="title"><?php echo couperChaineNombre($donnees['title'], 175); ?></p>
                <p class="text"><span class="read"><a href="<?php echo htmlspecialchars($donnees['link'], ENT_QUOTES, 'UTF-8'); ?>" class="no-style" target="_blank"><?php echo couperChaineNombre2($donnees['text'], 999); ?></a></span><br/><span class="author"><i class="icon-eye-open right_margin"></i><a href="<?php echo htmlspecialchars($donnees['link'], ENT_QUOTES, 'UTF-8'); ?>" target="_blank">Consulter l'article</a><i class="icon-edit left_margin right_margin"></i>Auteur : <strong><?php echo htmlspecialchars($donnees['author'], ENT_QUOTES, 'UTF-8'); ?></strong>
                    <?php
                    $kwStmt = $bdd_admin->prepare('
                        SELECT keyword.id_keyword, keyword.name_keyword
                        FROM post_keyword
                        JOIN keyword ON post_keyword.id_keyword = keyword.id_keyword
                        WHERE hash_post = ?
                        GROUP BY post_keyword.id_keyword
                    ');
                    $kwStmt->execute([$donnees['hash']]);
                    $keywords = $kwStmt->fetchAll(PDO::FETCH_ASSOC);
                    if ($keywords !== []) {
                        echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : ';
                        $compteur = 0;
                        foreach ($keywords as $keyword) {
                            $compteur++;
                            ?><a href="index.php?keyword_id=<?php echo (int) $keyword['id_keyword']; ?>" class="grey2"><?php if ($compteur > 1) {
                                echo ', ';
                            } echo htmlspecialchars($keyword['name_keyword'], ENT_QUOTES, 'UTF-8'); ?></a><?php
                        }
                    } else {
                        echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : <strong>aucun</strong>';
                    }
                    ?></span></p>
                    <div class="archiver" style="padding-top:10px;">
                        <?php
                        require_once __DIR__ . '/connect.php';
                        $archives = $bdd->prepare('SELECT id FROM archives WHERE hash = ? AND login_user = ?');
                        $archives->execute([$donnees['hash'], $userId]);
                        $check = $archives->rowCount();
                        ?>
                        <form action="archives.php" method="post" class="btn_action archiver" <?php if ($check !== 0) {
                            echo 'style="opacity:0.2"';
                        } ?>>
                            <input type="hidden" name="id_post" value="<?php echo (int) $donnees['id_post']; ?>"/>
                            <?php
                            if ($check === 0) {
                                echo '<i class="icon-download-alt icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archiver"/>';
                            } else {
                                echo '<i class="icon-ok icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archivé"/>';
                            }
                            ?>
                        </form>
                    </div>
            </div>
        <?php
        }
    }
    ?>

    <div class="show_message <?php echo $from_user === 'self' ? 'right from_me' : 'left not_from_me'; ?>">
        <p class="bot_margin"><strong><?php echo ucfirst($message['login_user']); ?></strong><?php if ((int) $message['id_post'] > 0) {
            echo ' <small>(à propos de l\'article)</small>';
        } ?><br/><span class="grey2 small">[<?php echo $message['converted_date']; ?>]</span></p>
        <p><?php echo make_clickable(stripslashes($message['text'])); ?></p>
    </div>
<?php
}
