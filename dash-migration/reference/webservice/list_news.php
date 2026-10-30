<?php

require_once('auth.php');

$json = array('success' => $success);

if ($success)
{
    mysql_close();

	mysql_connect(getenv("DASH_DB_HOST") ?: "localhost", getenv("DASH_DB_USER") ?: "", getenv("DASH_DB_PASSWORD") ?: ""); // credentials via env; original secret not copied
	mysql_select_db("admin_dash");
	mysql_query("SET NAMES 'utf8'");

	$sql = 'SELECT rss_post.id AS id_post, hash, id_theme, source, title, author, alert, date_add_theme, date, DATE_FORMAT(date, \'%d\') AS jour, DATE_FORMAT(date, \'%b\') AS mois, DATE_FORMAT(date, \'%H\') AS heure, DATE_FORMAT(date, \'%i\') AS minute, theme.id, theme.name
							FROM rss_post, theme
							WHERE rss_post.id_theme = theme.id '. (($_GET['theme'] > 0) ? 'AND rss_post.id_theme='. $_GET['theme'] : '') .'
							'. (($_GET['since'] != '(null)') ? 'AND date '. (($_GET['before']) ? '<' : '>')  .'"'. $_GET['since'] .'"' : '') .'
							ORDER BY date DESC
						LIMIT 20
					';
			
	
	$result = mysql_query($sql);
	
	while ($row = mysql_fetch_assoc($result))
	{
/*
		$sql_keywords = 'SELECT *
									FROM post_keyword, keyword
									WHERE post_keyword.id_keyword = keyword.id_keyword AND hash_post = \''.$row['hash'].'\'
									GROUP BY post_keyword.id_keyword';
		
		$results = mysql_query($sql_keywords);

		$array_keywords = array();
		
		while ($rows = mysql_fetch_assoc($results))
		{
			$array_keywords[] = array('id' => $rows['id_keyword'], 'name' => $rows['name_keyword']);
		}
*/
										
		$json['news'][] = array('id' => $row['id_post'], 'hash' => $row['hash'], 'alert' => $row['alert'], 'id_theme' => $row['id_theme'], 'source' => stripslashes(html_entity_decode($row['source'])), 'title' => strip_tags(stripslashes(html_entity_decode($row['title']))), 'day' => $row['jour'], 'month' => $row['mois'], 'hour' => $row['heure'], 'minute' => $row['minute'], 'theme' => stripslashes(html_entity_decode($row['name'])), 'date' => $row['date']);
	}

}

echo json_encode($json);
						