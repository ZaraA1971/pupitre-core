<?php

function sendPush($id_user, $message, $type, $badge)
{
    // Credentials and APNS secrets moved to environment. Original secret not copied.
    // Production password rotation must be planned separately — not performed in this migration step.
    $dsn = getenv('DASH_DB_DSN') ?: 'mysql:host=localhost;dbname=admin_dash;charset=utf8mb4';
    $dbUser = getenv('DASH_DB_USER') ?: '';
    $dbPassword = getenv('DASH_DB_PASSWORD') ?: '';
    try {
        $pdo = new PDO($dsn, $dbUser, $dbPassword, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
    } catch (PDOException $e) {
        error_log('Erreur de connexion à la base de données : ' . $e->getMessage());
        exit('Erreur de connexion à la base de données.');
    }

    $stmt = $pdo->prepare('SELECT DISTINCT token, push_message, push_alert FROM ios_devices WHERE id_user = :id_user');
    $stmt->execute(['id_user' => $id_user]);

    $tHost = getenv('DASH_APNS_HOST') ?: 'gateway.sandbox.push.apple.com';
    $tPort = (int) (getenv('DASH_APNS_PORT') ?: 2195);
    $tCert = getenv('DASH_APNS_CERT') ?: '../webservice/CertificatePushSandbox.pem';
    $tPassphrase = getenv('DASH_APNS_PASSPHRASE') ?: '';
    $tAlert = $message;
    $tSound = 'default';
    $tPayload = 'APNS Message';

    $tBody['aps'] = [
        'alert' => $tAlert,
        'badge' => (int) $badge,
        'sound' => $tSound
    ];
    $tBody['payload'] = $tPayload;

    $tBodyJson = json_encode($tBody);

    $tContext = stream_context_create([
        'ssl' => [
            'local_cert' => $tCert,
            'passphrase' => $tPassphrase
        ]
    ]);

    $tSocket = stream_socket_client('ssl://' . $tHost . ':' . $tPort, $error, $errstr, 60, STREAM_CLIENT_CONNECT, $tContext);

    if (!$tSocket) {
        error_log("APNS Connection Failed: $error $errstr");
        exit("Connexion à APNS échouée.");
    }

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($row['push_' . $type])) {
            $tToken = $row['token'];
            $tMsg = chr(0) . chr(0) . chr(32) . pack('H*', $tToken) . pack('n', strlen($tBodyJson)) . $tBodyJson;
            fwrite($tSocket, $tMsg, strlen($tMsg));
        }
    }

    fclose($tSocket);
}
