<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
	$sql = 'SELECT id_user, login_user FROM users WHERE id_user != '.$id_user;
	$result = mysql_query($sql);
					
	while ($row = mysql_fetch_assoc($result))
	{
		$json['contacts'][] = array('id_user' => $row['id_user'], 'login_user' => $row['login_user']);
	}
}

echo json_encode($json);