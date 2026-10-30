<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
	$json['themes'] = $themes;
}

echo json_encode($json);