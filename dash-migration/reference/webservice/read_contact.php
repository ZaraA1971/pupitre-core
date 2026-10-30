<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
	$sql = 'UPDATE messages SET has_been_read = \'1\'
			WHERE (from_user = '. $id_user .' AND to_user = '. mysql_escape_string($_GET['user']) .') OR (from_user = '. mysql_escape_string($_GET['user']) .' AND to_user = '. $id_user .') AND has_been_read = \'0\'
			';
			
	mysql_query($sql);
}

echo json_encode($json);