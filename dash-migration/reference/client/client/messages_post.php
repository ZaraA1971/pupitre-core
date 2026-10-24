<?php
require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/functions.php';

dash_electron_boot(true);

$dashPageTitle = 'Le Dash · Message';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<?php require __DIR__ . '/partials/head_common.php'; ?>
</head>
<body style="background:none">
<div id="container" style="padding:10px 5px;">
	<div class="wrapper" style="width:415px;">
<?php
	
	if (isset($_POST['send_message']) && isset($_POST['message']) && $_POST['message'] != 'Tapez ici votre message' && !empty($_POST['message']) && isset($_POST['to_user']) && $_POST['to_user'] != 'empty') {
	
		$id_post = 0;
		if (isset($_POST['sent_id_post'])) { $id_post = intval($_POST['sent_id_post']); }

		$req = $bdd->prepare('INSERT INTO messages(from_user, to_user, id_post, text, date, has_been_read) VALUES(:from_user, :to_user, :id_post, :text, :date, :has_been_read)');
		$req->execute(array(
			'from_user' => intval($_SESSION["ID_UTILISATEUR"]),
			'to_user' => intval($_POST['to_user']),
			'id_post' => $id_post,
			'text' => htmlspecialchars($_POST['message']),
			'date' => date("Y-m-d H:i:s"),
			'has_been_read' => 0,
		));
		
		$alert = 'Votre message a été envoyé.';
		echo '<script type="text/javascript">setTimeout(function(){ if (window.parent && window.parent.Fancybox) { window.parent.Fancybox.close(); } }, 2000);</script>';
		$get_user_config = $bdd->query('SELECT message_notification, mail_user FROM users WHERE id_user = '.intval($_POST['to_user']).'');
		while($user_config = $get_user_config->fetch()) {
			if ($user_config['message_notification'] == '1') {
							
				$to      = $user_config['mail_user'];
				$subject = 'Le Dash - Vous avez reçu un message de la part de '.ucfirst($_SESSION["NOM_UTILISATEUR"]).'';
				$content = ucfirst($_SESSION["NOM_UTILISATEUR"]).' vous envoie : &laquo; '.htmlspecialchars(stripslashes($_POST['message'])).' &raquo; <br/><br/> <a href="http://'.$_SERVER["SERVER_NAME"].dirname($_SERVER['PHP_SELF']).'/messages.php">Cliquez ici pour consulter votre messagerie</a>';
				$headers  = 'MIME-Version: 1.0' . "\r\n";
			    $headers .= 'Content-type: text/html; charset=utf-8' . "\r\n";
				$headers .= 'From: dash@electronlibre.info' . "\r\n" .
				'X-Mailer: PHP/' . phpversion();
			
				mail($to, $subject, $content, $headers);							
			}
		}

	}
	
	if (isset($alert)) { echo '<p class="message" style="color: #468847; background-color: #DFF0D8; border: 1px dashed #D6E9C6;">'.$alert.'</p>'; }
	
	if(isset($_GET['id_post'])) { ?>

		<h4 style="width:380px;">Ecrire un nouveau message privé à propos de cet article</h4>
		<div class="sendbox rivolet">
			<form action="messages_post.php" method="post" class="message_form">
				<?php if (isset($_GET['id_post'])) { echo '<input type="hidden" name="sent_id_post" value="'.intval($_GET['id_post']).'"/>'; } ?>
				<p>Pour :
				<select name="to_user">
					<option value="empty" selected="selected">Sélectionnez un destinataire</option>
					<?php 
						$get_users = $bdd->query('SELECT * FROM users WHERE id_user != '.$_SESSION["ID_UTILISATEUR"].'');
						while ($users = $get_users->fetch()) {
					?>
					<option value="<?php echo intval($users['id_user']);?>"><?php echo ucfirst($users['login_user']);?></option>
					<?php } ?>
				</select>
				</p>
				<textarea name="message" onclick="if (this.value=='Tapez ici votre message') this.value=''" style="width:380px;">Tapez ici votre message</textarea>
				<input type="submit" name="send_message" class="send_user" style="float:right;" value="Envoyer"/>
			</form>
		</div>
	<?php
	} 
?>		
	</div>
</div>
</body>
</html>
