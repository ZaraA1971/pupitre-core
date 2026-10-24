<?php

	include("header.php");
	include("functions.php");
	include ("connect.php");
	include("../webservice/send__push_.php");
	
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
		
		sendPush(intval($_POST['to_user']), ucfirst($_SESSION["NOM_UTILISATEUR"]) . ' : ' . $_POST['message'], 'message', 1);
			
		$get_user_config = $bdd->query('SELECT message_notification, mail_user FROM users WHERE id_user = '.intval($_POST['to_user']).'');
		while($user_config = $get_user_config->fetch()) {
			if ($user_config['message_notification'] == '1') {
							
				// Envoi du mail
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

	if(isset($_GET['id_message']) && !empty($_GET['id_message'])) {
		$req = $bdd->prepare('UPDATE messages SET has_been_read = :has_been_read WHERE id= :id_message AND from_user != '.$_SESSION["ID_UTILISATEUR"].'');
		$req->execute(array(
			'id_message' => intval($_GET['id_message']),
			'has_been_read' => 1,
		));
	}
	
?>
<script type="text/javascript">

	$(document).ready(function(){
	
	<?php if (isset($_GET['user']) && !empty($_GET['user'])) { ?>
		$('html, body').animate({scrollTop:$(document).height()}, 'slow');
	<?php } ?>
	
		start = 5;
		
		// Chargement de messages
		$('.load_messages').click(function(e){
			var parent = $(this);
			$.ajax({
				type: "POST",
				url: "messages_loader.php",
				data: 'start='+start+'<?php if(isset($_GET['user']) && !empty($_GET['user'])) { echo '&user='.intval($_GET['user']).'';}?>',
				success:function(msg){
					if (msg == 0) {
						parent.html('<i class="icon-exclamation-sign right_margin"></i><strong>Il n\'y a pas d\'autre message à charger</strong>');
					} else {
						parent.next('.spacer').after(msg);
						start = start+5;
					}
				}
			});
		});
		
	});
</script>
<div id="container" <?php if (isset($_GET['user']) && !empty($_GET['user'])) { echo'style="padding:0; margin-bottom:-20px;"'; } ?>>
	<div class="wrapper">
		
		<?php
		
		// Pagination
		$page = (int) (!isset($_GET["page"]) ? 1 : $_GET["page"]);
		// Nombre d'article à afficher par page
		$limit = 20;
		$startpoint = ($page * $limit) - $limit;
		
		// Si on consulte un message
		if (isset($_GET['user']) && !empty($_GET['user'])) {			
			
			$get_message = $bdd->query('
				SELECT *
				FROM (
					SELECT id_post, login_user, from_user, to_user, text, DATE_FORMAT(date, \'%d/%m/%Y %H:%i\') AS converted_date, date
					FROM messages, users
					WHERE messages.from_user = users.id_user AND (messages.from_user = '.intval($_GET['user']).' OR messages.to_user = '.intval($_GET['user']).') AND (messages.to_user = '.$_SESSION["ID_UTILISATEUR"].' OR messages.from_user = '.$_SESSION["ID_UTILISATEUR"].') 
					ORDER BY date DESC 
					LIMIT 0,5
				) AS bg 
				ORDER BY date
			');
		?>
		
		<div id="famos">
		
			<h3 style="width:300px; float:left;">Messages privés</h3>
			
			<a href="messages.php" id="message_back" class="right" style="margin:0;"><i class="icon-arrow-left icon-white right_margin"></i>Retour</a>
			
			<div class="load_messages clear"><i class="icon-refresh right_margin"></i><strong>Charger plus de message</strong></div>
		
			<div class="spacer"></div>
			
		<?php
			while ($message = $get_message->fetch()) {
			
				if ($message['from_user'] != $_SESSION["ID_UTILISATEUR"]) {
					$from_user = $message['from_user'];
					$to_user = $message['to_user'];
				} else { $from_user = 'self'; } 

				if($message['id_post'] > 0) {
					
					require_once __DIR__ . '/connect_admin.php';
					$reponse = $bdd_admin->query('
						SELECT rss_post.id AS id_post, id_theme, source, title, text, author, link, hash, alert, date, date_add_theme, DATE_FORMAT(date, \'%Y-%m-%d\') AS last_date, DATE_FORMAT(date, \'%w\') AS numero_jour, DATE_FORMAT(date, \'%c\') AS numero_mois, DATE_FORMAT(date, \'%d\') AS jour, DATE_FORMAT(date, \'%b\') AS mois, DATE_FORMAT(date, \'%Y\') AS annee, DATE_FORMAT(date, \'%H\') AS heure, DATE_FORMAT(date, \'%i\') AS minute, theme.id AS id_theme, theme.name
						FROM rss_post, theme
						WHERE rss_post.id = '.intval($message['id_post']).' AND rss_post.id_theme = theme.id
					');
					while ($donnees = $reponse->fetch()) { 
				?>
					<div class="post post_message <?php if ($from_user == 'self') { echo 'right';} else { echo 'left'; } ?>">
						<p class="date grey2"><span class="hour"><?php echo $donnees['heure']; ?>H<?php echo $donnees['minute']; ?></span><br/><span class="month"><?php echo $donnees['jour']; ?>/<?php echo strtoupper($donnees['mois']); ?></span></p>
						<p class="theme"><a href="index.php?theme_id=<?php echo intval($donnees['id_theme']);?>"><?php echo stripslashes($donnees['name']); ?></a></p>
						<p class="source grey2"><?php $sourceShort = couperChaineNombre($donnees['source'], 45); echo $sourceShort; ?></p>
						<p class="title"><?php $titleShort = couperChaineNombre($donnees['title'], 175); echo $titleShort; ?></p>
						<p class="text"><span class="read"><a href="<?php echo $donnees['link']; ?>" class="no-style" target="_blank"><?php $titleShort = couperChaineNombre2($donnees['text'], 999); echo $titleShort; ?></a></span><br/><span class="author"><i class="icon-eye-open right_margin"></i><a href="<?php echo $donnees['link']; ?>" target="_blank">Consulter l'article</a><i class="icon-edit left_margin right_margin"></i>Auteur : <strong><?php echo $donnees['author']; ?></strong> 
							<?php
							require_once __DIR__ . '/connect_admin.php';
							$stmtKeywords = $bdd_admin->prepare('SELECT * FROM post_keyword, keyword WHERE post_keyword.id_keyword = keyword.id_keyword AND hash_post = ? GROUP BY post_keyword.id_keyword');
							$stmtKeywords->execute([$donnees['hash']]);
							$keywords = $stmtKeywords->fetchAll(PDO::FETCH_ASSOC);
							if (count($keywords) > 0) {
								echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : ';
								$compteur = 0;
								foreach ($keywords as $keyword) {
									$compteur ++; ?><a href="index.php?keyword_id=<?php echo $keyword['id_keyword'];?>" class="grey2"><?php if($compteur > 1){echo ', ';} echo $keyword['name_keyword'];?></a><?php 
								}
							}
							else { echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : <strong>aucun</strong>'; } 
							?></span></a></p>
							<div class="archiver" style="padding-top:10px;">
								<?php 
									include ("connect.php");
									$archives = $bdd->query('SELECT id FROM archives WHERE hash = \''.$donnees['hash'].'\' AND login_user = '.$_SESSION["ID_UTILISATEUR"].'');
									$check = $archives->rowCount();
								?>
								<form action="archives.php" method="post" class="btn_action archiver" <?php if ($check != 0) { echo 'style="opacity:0.2"'; } ?>>
									<input type="hidden" name="id_post" value="<?php echo $donnees['id_post']; ?>"/>
									<?php
										if ($check == 0) {
											echo '<i class="icon-download-alt icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archiver"/>';
										}
										else {
											echo '<i class="icon-ok icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archivé"/>';
										}
									?>
								</form>
							</div>
					</div>
				<?php
					}
					include ("connect.php");			
				}
				?>
				
				<div class="show_message <?php if ($from_user == 'self') { echo 'right from_me';} else { echo 'left not_from_me'; } ?>">
					<p class="bot_margin"><strong><?php echo ucfirst($message['login_user']);?></strong><?php if($message['id_post'] > 0) { echo ' <small>(à propos de l\'article)</small>'; }?><br/><span class="grey2 small">[<?php echo $message['converted_date'];?>]</span></p>
					<p><?php echo make_clickable(stripslashes($message['text']));?></p>
				</div>
		<?php 
			}
		?>	
			
			<div class="spacer"></div>
			
			<?php if (isset($alert)) { echo '<p class="message" style="clear:both; color: #468847; background-color: #DFF0D8; border: 1px dashed #D6E9C6;">'.$alert.'</p>'; } ?>
		
			<h4 style="width:646px; margin:0 auto;">Envoyer un autre message</h4>
			<div class="sendbox rivolet" style="width:640px; margin:0 auto; border:1px solid #CCCCCC;">
				<form action="messages.php?user=<?php echo intval($_GET['user']);?>" method="post" class="message_form">
					<?php if (isset($_GET['id_post'])) { echo '<input type="hidden" name="sent_id_post" value="'.intval($_GET['id_post']).'"/>'; } ?>
					<input type="hidden" name="to_user" value="<?php echo intval($_GET['user']);?>"/>
					<textarea name="message" onclick="if (this.value=='Tapez ici votre message') this.value=''" style="margin-top:10px; width:625px; height:100%;">Tapez ici votre message</textarea><br/>
					<input type="submit" name="send_message" class="send_user" style="float:right;" value="Envoyer"/>
				</form>
			</div>

		</div>
			
		<?php	
		}
		
		// Si le message à envoyer concerne un article
		if(isset($_GET['id_post']) && !isset($_GET['user'])) { ?>
		
			<h3 style="width:300px; float:left;">Messages privés</h3>
			
			<a href="messages.php" id="message_back" class="right"><i class="icon-arrow-left icon-white right_margin"></i>Retour</a>
			
			<?php if (isset($alert)) { echo '<p class="message" style="color: #468847; background-color: #DFF0D8; border: 1px dashed #D6E9C6;">'.$alert.'</p>'; } ?>
			
			<?php		
				require_once __DIR__ . '/connect_admin.php';
				$reponse = $bdd_admin->query('
					SELECT rss_post.id AS id_post, id_theme, source, title, text, author, link, hash, alert, date, date_add_theme, DATE_FORMAT(date, \'%Y-%m-%d\') AS last_date, DATE_FORMAT(date, \'%w\') AS numero_jour, DATE_FORMAT(date, \'%c\') AS numero_mois, DATE_FORMAT(date, \'%d\') AS jour, DATE_FORMAT(date, \'%b\') AS mois, DATE_FORMAT(date, \'%Y\') AS annee, DATE_FORMAT(date, \'%H\') AS heure, DATE_FORMAT(date, \'%i\') AS minute, theme.id AS id_theme, theme.name
					FROM rss_post, theme
					WHERE rss_post.id = '.intval($_GET['id_post']).' AND rss_post.id_theme = theme.id
				');
				while ($donnees = $reponse->fetch()) { 
			?>
				<div class="post post_message" style="margin:0 0 40px 0;">
					<p class="date grey2"><span class="hour"><?php echo $donnees['heure']; ?>H<?php echo $donnees['minute']; ?></span><br/><span class="month"><?php echo $donnees['jour']; ?>/<?php echo strtoupper($donnees['mois']); ?></span></p>
					<p class="theme"><a href="index.php?theme_id=<?php echo intval($donnees['id_theme']);?>"><?php echo stripslashes($donnees['name']); ?></a></p>
					<p class="source grey2"><?php $sourceShort = couperChaineNombre($donnees['source'], 45); echo $sourceShort; ?></p>
					<p class="title"><?php $titleShort = couperChaineNombre($donnees['title'], 175); echo $titleShort; ?></p>
					<p class="text"><span class="read"><a href="<?php echo $donnees['link']; ?>" class="no-style" target="_blank"><?php $titleShort = couperChaineNombre2($donnees['text'], 999); echo $titleShort; ?></a></span><br/><span class="author"><i class="icon-eye-open right_margin"></i><a href="<?php echo $donnees['link']; ?>" target="_blank">Consulter l'article</a><i class="icon-edit left_margin right_margin"></i>Auteur : <strong><?php echo $donnees['author']; ?></strong> 
						<?php
						require_once __DIR__ . '/connect_admin.php';
						$stmtKeywords = $bdd_admin->prepare('SELECT * FROM post_keyword, keyword WHERE post_keyword.id_keyword = keyword.id_keyword AND hash_post = ? GROUP BY post_keyword.id_keyword');
						$stmtKeywords->execute([$donnees['hash']]);
						$keywords = $stmtKeywords->fetchAll(PDO::FETCH_ASSOC);
						if (count($keywords) > 0) {
							echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : ';
							$compteur = 0;
							foreach ($keywords as $keyword) {
								$compteur ++; ?><a href="index.php?keyword_id=<?php echo $keyword['id_keyword'];?>" class="grey2"><?php if($compteur > 1){echo ', ';} echo $keyword['name_keyword'];?></a><?php 
							}
						}
						else { echo '<i class="icon-tags right_margin left_margin"></i>Mot(s)-clé(s) : <strong>aucun</strong>'; } 
						?></span></a></p>
						<div class="archiver" style="padding-top:10px;">
							<?php 
								include ("connect.php");
								$archives = $bdd->query('SELECT id FROM archives WHERE hash = \''.$donnees['hash'].'\' AND login_user = '.$_SESSION["ID_UTILISATEUR"].'');
								$check = $archives->rowCount();
							?>
							<form action="archives.php" method="post" class="btn_action archiver" <?php if ($check != 0) { echo 'style="opacity:0.2"'; } ?>>
								<input type="hidden" name="id_post" value="<?php echo $donnees['id_post']; ?>"/>
								<?php
									if ($check == 0) {
										echo '<i class="icon-download-alt icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archiver"/>';
									}
									else {
										echo '<i class="icon-ok icon-white left right_margin"></i><input type="submit" class="btn_archiver left" value="Archivé"/>';
									}
								?>
							</form>
						</div>
				</div>
			<?php
				}
				include ("connect.php");
			?>
			
			<h4 style="width:380px;">Ecrire un nouveau message privé à propos de cet article</h4>
			<div class="sendbox rivolet">
				<form action="messages.php" method="post" class="message_form">
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
					<textarea name="message" onclick="if (this.value=='Tapez ici votre message') this.value=''">Tapez ici votre message</textarea>
					<input type="submit" name="send_message" class="send_user" style="float:right;" value="Envoyer"/>
				</form>
			</div>
			<?php
		} 
		
		// Si on ne consulte pas de message (par default)
		else if (!isset($_GET['user'])) { ?>
		
			<h3 style="width:300px; float:left;">Messages privés</h3>
		
			<?php if (isset($alert)) { echo '<p class="message" style="color: #468847; background-color: #DFF0D8; border: 1px dashed #D6E9C6;">'.$alert.'</p>'; } ?>
		
			<h4>Conversations</h4>
			<div class="mailbox">
				<table>
					<tr><th class="mail_user"><span class="cell">Utilisateur</span></th><th class="mail_text"><span class="cell">Dernier message</span></th><th class="mail_date"><span class="cell">Date</span></th></tr>

				<?php 
					$get_users = $bdd->query('
					SELECT a.from_user, b.MaxDate 
					FROM (
						SELECT from_user, MAX( DATE ) AS MaxDate
						FROM messages
						WHERE from_user != '.$_SESSION["ID_UTILISATEUR"].'
						AND to_user = '.$_SESSION["ID_UTILISATEUR"].'
						GROUP BY from_user
					)b
					INNER JOIN messages a ON b.from_user = b.from_user
					AND a.date = b.MaxDate
					ORDER BY b.MaxDate DESC
					');
					
					$count = $get_users->rowCount();
					if ($count == 0) {
						echo '<tr><td colspan="3" style="font-size:12px; text-align:center;">Aucun message</td></tr>';
					}
					
					while ($users = $get_users->fetch()) {
				
						$get_messages = $bdd->query('
							SELECT *, DATE_FORMAT(date, \'%d/%m/%Y à %H:%i\') AS converted_date
							FROM messages, users
							WHERE messages.from_user = users.id_user AND from_user = '.$users['from_user'].' AND to_user = '.$_SESSION["ID_UTILISATEUR"].'
							ORDER BY date DESC
							LIMIT 0, 1
						');
						
						while ($messages = $get_messages->fetch()) { ?>
							<tr <?php if ($messages['has_been_read'] == 0) { echo 'class="new_message"'; } ?>>
								<td class="mail_user"><a href="messages.php?id_message=<?php echo intval($messages['id']);?>&user=<?php echo intval($messages['from_user']);?>"><span class="cell"><?php echo ucfirst($messages['login_user']);?></span></a></td>
								<td class="mail_text"><a href="messages.php?id_message=<?php echo intval($messages['id']);?>&user=<?php echo intval($messages['from_user']);?>"><span class="cell"><?php echo couperChaineNombre2(stripslashes($messages['text']), 100);?></span></a></td>
								<td class="mail_date"><a href="messages.php?id_message=<?php echo intval($messages['id']);?>&user=<?php echo intval($messages['from_user']);?>"><span class="cell"><?php echo $messages['converted_date'];?></span></a></td>
							</tr>
						<?php
						}
					}
				?>
				</table>		
			</div>

			<h4>Ecrire un nouveau message privé</h4>
			<div class="sendbox rivolet">
				<form action="messages.php" method="post" class="message_form">
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
					<textarea name="message" onclick="if (this.value=='Tapez ici votre message') this.value=''">Tapez ici votre message</textarea>
					<input type="submit" name="send_message" class="send_user" style="float:right;" value="Envoyer"/>
				</form>
			</div>
		
		<?php } ?>	
		
	</div>
</div>
<?php 
	include('footer.php');
	if (isset($_SESSION["ID_UTILISATEUR"])) {
		include("connect.php");
		// Sauvegarde la date de la dernière connexion de l'utilisateur
		$req = $bdd->exec('UPDATE users SET last_messages_consultation = \''.date("Y-m-d H:i:s").'\' WHERE id_user = \''.$_SESSION["ID_UTILISATEUR"].'\'');
	}
?>