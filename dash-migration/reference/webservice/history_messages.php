<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
	$direction = ($_GET['old'] == 1) ? '<' : '>';
	
	$sql = 'SELECT m.id, m.from_user, m.to_user, m.text, m.date, m.has_been_read
			FROM messages AS m
			WHERE ((m.from_user = '. $id_user .' AND m.to_user = '. mysql_escape_string($_GET['user']) .') OR (m.from_user = '. mysql_escape_string($_GET['user']) .' AND m.to_user = '. $id_user .')) '. ( ($_GET['since'] > 0) ? 'AND m.id '. $direction . mysql_escape_string($_GET['since']) : '' ) .'
			ORDER BY m.date DESC
			LIMIT 0, 20
			';

	$result = mysql_query($sql);
	
	while ($row = mysql_fetch_assoc($result))
	{
		$direction = ($row['from_user'] == $id_user) ? 'sent' : 'received';
				
		$messages[] = array('id_message' => $row['id'], 'direction' => $direction, 'text' => $row['text'], 'date' => strtotime($row['date']), 'read' => $row['has_been_read']);
	}
	
	$json['messages'] = array_reverse($messages);
}

echo json_encode($json);