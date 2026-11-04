<?php
require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/../webservice/send__push_.php';

dash_admin_boot();

if (!isset($bdd)) {
    http_response_code(500);
    exit('Erreur de connexion.');
}

try {
    $bdd->query('SELECT 1');
} catch (PDOException $e) {
    http_response_code(500);
    exit('Connexion test à la base échouée.');
}

$posts = dash_admin_post_ids_from_request($_POST);

if ($posts !== [] && isset($_POST['send'])) {
    foreach ($posts as $postId) {
        $themeKey = 'theme_' . $postId;

        try {
            if (isset($_POST[$themeKey]) && $_POST[$themeKey] !== 'empty') {
                $idTheme = (int) $_POST[$themeKey];
                $req = $bdd->prepare('UPDATE rss_post SET sent = 1, new = 0, deleted = 0, id_theme = :theme, date_add_theme = :date WHERE id = :id');
                $req->execute([
                    'theme' => $idTheme,
                    'id' => $postId,
                    'date' => date('Y-m-d H:i:s'),
                ]);
            } else {
                $req = $bdd->prepare('UPDATE rss_post SET sent = 1, new = 0, deleted = 0 WHERE id = :id');
                $req->execute(['id' => $postId]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo 'Erreur de mise à jour.';
            exit;
        }
    }
}

if ($posts !== [] && isset($_POST['alert'])) {
    $isAlert = $_POST['alert'] === 'oui';
    $alertValue = $isAlert ? 1 : 0;
    $dateAddTheme = $isAlert ? date('Y-m-d H:i:s') : '0000-00-00 00:00:00';

    $updateAlert = $bdd->prepare('UPDATE rss_post SET sent = 1, new = 0, deleted = 0, alert = :alert, date_add_theme = :date WHERE id = :id');
    $postStmt = $bdd->prepare('SELECT * FROM rss_post WHERE id = ? LIMIT 1');
    $postThemeStmt = $bdd->prepare('SELECT id_theme, title FROM rss_post WHERE id = ? LIMIT 1');

    foreach ($posts as $postId) {
        try {
            $updateAlert->execute([
                'alert' => $alertValue,
                'date' => $dateAddTheme,
                'id' => $postId,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo 'Erreur de mise à jour.';
            exit;
        }

        if (!$isAlert) {
            continue;
        }

        $postStmt->execute([$postId]);
        $post = $postStmt->fetch(PDO::FETCH_ASSOC);
        if (!$post) {
            continue;
        }

        dash_admin_link_author_post_if_known($bdd, $post);

        $usersStmt = $bdd->query('SELECT id, mail, dash, themes FROM users WHERE active = 1 AND notif = 1');
        while ($user = $usersStmt->fetch(PDO::FETCH_ASSOC)) {
            $themeIn = dash_admin_sql_int_in_list((string) ($user['themes'] ?? ''));
            $sql = 'SELECT u.mail, u.dash, r.title
                    FROM users u
                    INNER JOIN rss_post r ON r.id = :post_id
                    WHERE u.id = :user_id';
            if ($themeIn !== '') {
                $sql .= ' AND r.id_theme IN (' . $themeIn . ')';
            }
            $detailsStmt = $bdd->prepare($sql);
            $detailsStmt->execute([
                'post_id' => $postId,
                'user_id' => (int) $user['id'],
            ]);

            while ($details = $detailsStmt->fetch(PDO::FETCH_ASSOC)) {
                $to = (string) $details['mail'];
                $subject = 'Le Dash [Alerte] : ' . $details['title'];
                $content = 'Alerte : ' . $details['title'] . '<br/><a href="http://' . $_SERVER['SERVER_NAME'] . '/dash_' . $details['dash'] . '/post.php?show_post=' . $postId . '">Cliquez ici pour consulter l\'alerte</a>';
                $headers = "MIME-Version: 1.0\r\n";
                $headers .= "Content-type: text/html; charset=utf-8\r\n";
                $headers .= "From: dash@electronlibre.info\r\n";
                mail($to, $subject, $content, $headers);
            }
        }

        $postThemeStmt->execute([$postId]);
        $postData = $postThemeStmt->fetch(PDO::FETCH_ASSOC);
        if (!$postData || !(int) $postData['id_theme']) {
            continue;
        }

        $themeId = (int) $postData['id_theme'];
        $title = (string) $postData['title'];
        $deviceTokens = [];
        $firebaseAuth = qualif_env('FIREBASE_PUSH_AUTH');
        if ($firebaseAuth === null || $firebaseAuth === '') {
            error_log('[dash_admin] FIREBASE_PUSH_AUTH absent de /etc/electronlibre/qualif.env — push ignoré');
        }

        $getDashIds = $bdd->query('SELECT dash_id FROM dash_keys WHERE expired = 0');
        while ($dash = $getDashIds->fetch(PDO::FETCH_ASSOC)) {
            $dashName = 'dash_' . $dash['dash_id'];
            try {
                $pdo = qualif_pdo($dashName);
            } catch (Throwable $e) {
                error_log('[dash_admin] push : connexion ' . $dashName . ' : ' . $e->getMessage());
                continue;
            }
            $findConfig = $pdo->prepare('SELECT id_config FROM config WHERE id_theme = ? LIMIT 1');
            $findConfig->execute([$themeId]);
            $configRow = $findConfig->fetch(PDO::FETCH_ASSOC);

            if ($configRow) {
                $tokens = $pdo->query('SELECT token FROM push_devices WHERE alert = 1');
                while ($token = $tokens->fetch(PDO::FETCH_ASSOC)) {
                    $deviceTokens[] = [
                        'token' => $token['token'],
                        'dash' => $dash['dash_id'],
                    ];
                }
            }
        }

        if ($deviceTokens !== [] && $firebaseAuth !== null && $firebaseAuth !== '') {
            $order = [
                'msg' => $title,
                'devices' => $deviceTokens,
                'postId' => $postId,
                'status' => 'should_send',
            ];
            $ch = curl_init('https://electron-libre.firebaseio.com/dash::push.json');
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'Authorization: ' . $firebaseAuth,
                    'Content-Type: application/json',
                ],
                CURLOPT_POSTFIELDS => json_encode($order),
            ]);
            curl_exec($ch);
            curl_close($ch);
        }
    }
}

if ($posts !== [] && isset($_POST['delete'])) {
    $req = $bdd->prepare('UPDATE rss_post SET sent = 0, new = 0, deleted = 1 WHERE id = :id');
    foreach ($posts as $postId) {
        $req->execute(['id' => $postId]);
    }
}

if (isset($_POST['delete_all'])) {
    try {
        $update = $bdd->prepare('UPDATE rss_post SET bin = 1, new = 0, deleted = 1, sent = 0 WHERE bin = 0 AND new = 1 AND deleted = 0 AND sent = 0');
        $update->execute();
    } catch (PDOException $e) {
        http_response_code(500);
        echo 'Erreur lors de la suppression : ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
        exit;
    }
}
