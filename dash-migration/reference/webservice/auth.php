<?php
	header('Content-Type: text/json; charset=utf-8');
	
	mysql_connect(getenv("DASH_DB_HOST") ?: "localhost", getenv("DASH_DB_USER") ?: "", getenv("DASH_DB_PASSWORD") ?: ""); // credentials via env; original secret not copied
	mysql_select_db("dash_". mysql_escape_string(strtolower($_GET['section'])));
	mysql_query("SET NAMES 'utf8'");
	
	$sql = "SELECT id_user, login_user, pass_user, active_user
	    	FROM users
	    	WHERE login_user = '" . $_GET['login'] . "'";
	    	
	$result = mysql_query($sql);
	
	$success = 0;
	
    if(mysql_num_rows($result) == 1) 
    {
	    $row = mysql_fetch_array($result);
	    
	    if ($row["active_user"] == 1 && $_GET["password"] == $row["pass_user"])
	    {
	    	$id_user = $row['id_user'];
	    	$name_user = $row['login_user'];
		    $success = 1;
		    
		    mysql_close();

        mysql_connect(getenv("DASH_DB_HOST") ?: "localhost", getenv("DASH_DB_USER") ?: "", getenv("DASH_DB_PASSWORD") ?: ""); // credentials via env; original secret not copied
			mysql_select_db("admin_dash");
			mysql_query("SET NAMES 'utf8'");
		
			$sql = "SELECT themes 
					FROM users
					WHERE id_user = ". $row['id_user'];
			    	
			$result = mysql_query($sql);
			$row = mysql_fetch_array($result);
			$themes_list = $row['themes'];
			
			$sql = "SELECT id, name, img
					FROM theme
					WHERE id in (" . $themes_list .")";
								
			$result = mysql_query($sql);
			$themes = array();
			
			while ($row = mysql_fetch_array($result))
			{
				$themes[] = array('id' => $row['id'], 'name' => stripslashes($row['name']), 'img' => $row['img']);
			}
			
			mysql_close();

      mysql_connect(getenv("DASH_DB_HOST") ?: "localhost", getenv("DASH_DB_USER") ?: "", getenv("DASH_DB_PASSWORD") ?: ""); // credentials via env; original secret not copied
			mysql_select_db("dash_". mysql_escape_string(strtolower($_GET['section'])));
			mysql_query("SET NAMES 'utf8'");

/*
			mysql_connect(getenv("DASH_DB_HOST") ?: "localhost", getenv("DASH_DB_USER") ?: "", getenv("DASH_DB_PASSWORD") ?: ""); // credentials via env; original secret not copied
			mysql_select_db("admin_dash");
			mysql_query("SET NAMES 'utf8'");
*/

	    }
    }

