<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
    mysql_close();

  mysql_connect(getenv("DASH_DB_HOST") ?: "localhost", getenv("DASH_DB_USER") ?: "", getenv("DASH_DB_PASSWORD") ?: ""); // credentials via env; original secret not copied
	mysql_select_db("admin_dash");
	mysql_query("SET NAMES 'utf8'");

/*
	$sql = "DELETE FROM ios_devices WHERE id_user = ". $id_user ."";
	mysql_query($sql);

*/
	$sql = "INSERT INTO ios_devices VALUES('', '". $id_user ."', '". mysql_escape_string($_GET['token']) ."', 1, 1)";
	mysql_query($sql);
}
