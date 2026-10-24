<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
    mysql_close();

  mysql_connect(getenv("DASH_DB_HOST") ?: "localhost", getenv("DASH_DB_USER") ?: "", getenv("DASH_DB_PASSWORD") ?: ""); // credentials via env; original secret not copied
	mysql_select_db("admin_dash");
	mysql_query("SET NAMES 'utf8'");

	$sql = 'SELECT u.mail, d.push_message, d.push_alert
			FROM users AS u
			LEFT JOIN ios_devices AS d ON d.id_user = u.id_user
			WHERE u.id_user = '. $id_user .'
			LIMIT 1
			';

	$result = mysql_query($sql);
	$row = mysql_fetch_assoc($result);
	$json['settings'] = array('mail' => $row['mail'], 'push_message' => $row['push_message'], 'push_alert' => $row['push_alert']);
}

echo json_encode($json);