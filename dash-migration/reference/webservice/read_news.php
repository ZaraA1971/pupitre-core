<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
    mysql_close();

	mysql_connect(getenv("DASH_DB_HOST") ?: "localhost", getenv("DASH_DB_USER") ?: "", getenv("DASH_DB_PASSWORD") ?: ""); // credentials via env; original secret not copied
	mysql_select_db("admin_dash");
	mysql_query("SET NAMES 'utf8'");

	$sql = 'SELECT source, title, author, text, link, hash, new, sent, deleted, DATE_FORMAT(date, \'%d\') AS jour, DATE_FORMAT(date, \'%b\') AS mois, DATE_FORMAT(date, \'%H\') AS heure, DATE_FORMAT(date, \'%i\') AS minute FROM rss_post WHERE id=' . mysql_real_escape_string($_GET['news']);
		
		
	$result = mysql_query($sql);
	$infos = mysql_fetch_assoc($result);
/*
	$valid_text = html_entity_decode ( $infos['text'] );
/* 	print_r($valid_text);				 
	$json['news'] = array('text' => $valid_text);
*/

$json['news'] = $infos;
}

echo json_encode($json);
						