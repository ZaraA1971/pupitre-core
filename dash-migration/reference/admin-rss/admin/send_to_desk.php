<?php
/**
 * Endpoint AJAX : brouillon Desk (el_articles) + marquage breve_spip.
 * Titre / texte : générés par LLM **en français** (traduction si source EN).
 * Sans IA utilisable, l’article n’est pas envoyé (pas de fallback anglais brut).
 */
require_once __DIR__ . '/connect.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/functions-ia.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($bdd)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Connexion base admin indisponible.']);
    exit;
}

if (!isset($_POST['to_desk'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Action manquante.']);
    exit;
}

$postIds = dash_admin_post_ids_from_request($_POST);
if ($postIds === []) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Aucun article sélectionné.']);
    exit;
}

try {
    dash_admin_desk_credentials();
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[send_to_desk.php] Desk ingest : ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Configuration Desk introuvable.']);
    exit;
}

$getPost = $bdd->prepare('SELECT * FROM rss_post WHERE id = ? LIMIT 1');
// Colonne historique : « déjà poussé vers le CMS » (Desk aujourd’hui).
$markDesk = $bdd->prepare('UPDATE rss_post SET sent = 1, new = 0, deleted = 0, breve_spip = 1 WHERE id = ?');

$processed = [];
$errors = [];
$created = [];

foreach ($postIds as $postId) {
    try {
        $getPost->execute([$postId]);
        $post = $getPost->fetch(PDO::FETCH_ASSOC);
        if (!$post) {
            $errors[] = ['id' => $postId, 'error' => 'Article introuvable.'];
            continue;
        }

        $rssHint = stripslashes((string) ($post['text'] ?? ''));
        if (trim($rssHint) === '') {
            $fromFeed = dash_admin_rss_text_for_post(
                $bdd,
                (string) ($post['link'] ?? ''),
                (string) ($post['source'] ?? '')
            );
            if (is_string($fromFeed) && trim($fromFeed) !== '') {
                $rssHint = $fromFeed;
            }
        }

        $rawText = dash_admin_fetch_full_article(
            (string) $post['link'],
            $rssHint
        );
        if ($rawText === null || trim($rawText) === '') {
            $errors[] = ['id' => $postId, 'error' => 'Impossible de récupérer le texte source.'];
            continue;
        }

        $bodyPlain = nettoyerTexteAvance($rawText);
        if ($bodyPlain === '') {
            $errors[] = ['id' => $postId, 'error' => 'Texte source vide.'];
            continue;
        }

        // Titre + résumé FR obligatoires via LLM (pas de fallback source EN).
        try {
            $promptTitre = "SOURCE (langue quelconque — anglais fréquent).\n"
                . "Tâche : produire UN titre journalistique EN FRANÇAIS uniquement.\n"
                . "Règles : clair, informatif, concis ; pas de sensationnalisme ; "
                . "traduire le sens si la source n'est pas en français.\n"
                . "Réponds uniquement par le titre français, sans guillemets ni préfixe.\n\n"
                . $rawText;
            $titreIa = dash_admin_llm_request($promptTitre);
            $titreIa = preg_replace('/[*_`#>~\-]+/', '', (string) $titreIa);
            $titreIa = mb_convert_encoding($titreIa, 'UTF-8', 'UTF-8');
            $title = nettoyerTexteAvance($titreIa);
            if ($title === '' || dash_admin_is_ia_error_text($title)) {
                throw new RuntimeException('Titre FR vide ou invalide');
            }

            $promptResume = "SOURCE (langue quelconque — anglais fréquent).\n"
                . "Tâche : rédiger un résumé journalistique ENTIÈREMENT EN FRANÇAIS "
                . "(1 ou 2 paragraphes).\n"
                . "Règles : clair, objectif, sobre ; conserver faits et chiffres clés ; "
                . "traduire si la source n'est pas en français ; aucune phrase en anglais.\n"
                . "Réponds uniquement par le résumé français.\n\n"
                . $rawText;
            $resume = dash_admin_llm_request($promptResume);
            $resume = preg_replace('/[*_`#>~\-]+/', '', (string) $resume);
            $resume = trim((string) $resume);
            if ($resume === '' || dash_admin_is_ia_error_text($resume)) {
                throw new RuntimeException('Résumé FR vide ou invalide');
            }
            $contentHtml = nl2br($resume);
        } catch (Throwable $iaErr) {
            error_log(
                '[send_to_desk.php] IA FR refusée post ' . $postId . ' : ' . $iaErr->getMessage()
            );
            $errors[] = [
                'id' => $postId,
                'error' => 'Génération FR impossible (LLM). Réessayez.',
            ];
            continue;
        }

        $createdArticle = dash_admin_desk_create_draft([
            'title' => $title,
            'body' => $contentHtml,
            'slug' => nettoyerTexteAvance($title),
            'author' => 'Emmanuel Torregano',
            'author_slug' => 'admin',
            'author_user_id' => 1,
            'source_url' => (string) ($post['link'] ?? ''),
            'lang' => 'fr',
            'access' => 'subscribers',
        ]);

        $markDesk->execute([$postId]);
        dash_admin_link_author_post_if_known($bdd, $post);

        $processed[] = $postId;
        $created[] = [
            'rss_id' => $postId,
            'article_id' => $createdArticle['article_id'],
            'slug' => $createdArticle['slug'],
        ];
    } catch (Throwable $e) {
        error_log('[send_to_desk.php] post ' . $postId . ' : ' . $e->getMessage());
        $errors[] = ['id' => $postId, 'error' => 'Échec traitement.'];
    }
}

if ($processed === [] && $errors !== []) {
    http_response_code(500);
}

echo json_encode([
    'success' => $processed !== [],
    'processed' => $processed,
    'created' => $created,
    'errors' => $errors,
]);
