<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
	$sql = 'SELECT m.id, m.from_user, m.to_user, m.text, m.date, m.has_been_read
			FROM messages AS m
			WHERE m.from_user = '. $id_user .' OR m.to_user = '. $id_user .'
			ORDER BY m.date DESC
			';
			
	$result = mysql_query($sql);

	$messages = array();
	$text_messages = array();
	
	while ($row = mysql_fetch_assoc($result))
	{
		$direction = ($row['from_user'] == $id_user) ? 'sent' : 'received';
		$contact = ($row['from_user'] == $id_user) ? $row['to_user'] : $row['from_user'];
		
		if (!in_array($contact, $messages))
		{
				$messages[] = $contact;
				
				$json['last_messages'][] = array('id_message' => $row['id'], 'contact' => $contact, 'direction' => $direction, 'text' => $row['text'], 'date' => strtotime($row['date']), 'read' => $row['has_been_read']);
		}
	}
}

echo json_encode($json);