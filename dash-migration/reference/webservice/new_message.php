<?php

	include("../webservice/send__push_.php");

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
	$sql = "INSERT INTO messages VALUES('', '". $id_user ."', '". mysql_escape_string($_GET['user']) ."', '0', '". mysql_escape_string($_GET['text']) ."', NOW(), '0')";
				
	mysql_query($sql);
	
	$json['insert'] = mysql_insert_id();
	
	sendPush(intval($_GET['user']), ucfirst($name_user) . ' : ' . $_GET['text'], 'message', 1);
}

echo json_encode($json);