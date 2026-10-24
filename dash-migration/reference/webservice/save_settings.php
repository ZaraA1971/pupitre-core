<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
	$json['message'] = '.';

	$sql = 'SELECT COUNT(u.login_user) AS number_login
			FROM users AS u
			WHERE u.login_user = "'. mysql_real_escape_string($_GET['newLogin']) .'" AND u.id_user != '. $id_user ;
			
	$result = mysql_query($sql);

	$row = mysql_fetch_assoc($result);
	
	if ($row['number_login'] > 0)
	{
		$json['message'] = 'Ce nom d\'utilisateur est déjà utilisé.';
	}
	else
	{
		$sql = 'UPDATE users SET login_user = "'. mysql_real_escape_string($_GET['newLogin']) .'"
		WHERE id_user = "'. $id_user .'"';
		mysql_query($sql);
	}
	
	$sql = 'UPDATE users SET pass_user = "'. mysql_real_escape_string($_GET['newPassword']) .'", mail_user = "'. mysql_real_escape_string($_GET['newMail']) .'"
			WHERE id_user = "'. $id_user .'"';

	mysql_query($sql);

	mysql_close();
  mysql_connect(getenv("DASH_DB_HOST") ?: "localhost", getenv("DASH_DB_USER") ?: "", getenv("DASH_DB_PASSWORD") ?: ""); // credentials via env; original secret not copied
	mysql_select_db("admin_dash");
	mysql_query("SET NAMES 'utf8'");

	$sql = 'UPDATE users SET mail = "'. mysql_real_escape_string($_GET['newMail']) .'"
			WHERE id_user = "'. $id_user .'"';

	mysql_query($sql);

	$sql = 'UPDATE ios_devices SET push_message = "'. mysql_real_escape_string($_GET['notifMessage']) .'", push_alert = "'. mysql_real_escape_string($_GET['notifAlert']) .'"
			WHERE id_user = "'. $id_user .'"';

	mysql_query($sql);
}

echo json_encode($json);