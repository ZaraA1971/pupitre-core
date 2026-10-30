<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
	$json['infos'] = array('id_user' => $id_user);
}

echo json_encode($json);

