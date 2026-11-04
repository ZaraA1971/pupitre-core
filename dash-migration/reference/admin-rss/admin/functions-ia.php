<?php
declare(strict_types=1);

/**
 * Appels LLM OpenAI pour Qualif Admin (titre / résumé → brouillon Desk).
 * Clé : OPENAI_API_KEY dans /etc/electronlibre/qualif.env
 * Modèle : OPENAI_MODEL ou llm-router chatgpt/standard.
 *
 * Ne renvoie jamais un message d’erreur comme « contenu » éditorial :
 * en cas d’échec, exception — le transfert utilise alors la source nettoyée.
 */

/** Texte renvoyé autrefois comme faux contenu (à rejeter si legacy). */
function dash_admin_is_ia_error_text(string $text): bool
{
    $t = trim($text);
    if ($t === '') {
        return false;
    }
    return (bool) preg_match(
        '/^\[?\s*Erreur\b/iu',
        $t
    ) || (bool) preg_match(
        '/clé\s+OpenAI\s+manquante/iu',
        $t
    ) || (bool) preg_match(
        '/^\[?\s*Résumé\s+indisponible/iu',
        $t
    );
}

/** Modèle Chat Completions (env OPENAI_MODEL ou llm-router). */
function dash_admin_llm_model(): string
{
    if (!function_exists('qualif_env')) {
        require_once dirname(__DIR__) . '/shared/bootstrap.php';
    }
    $fromEnv = qualif_env('OPENAI_MODEL');
    if (is_string($fromEnv) && trim($fromEnv) !== '') {
        return trim($fromEnv);
    }
    $cache = '/tmp/dash-llm-pick-chatgpt-standard';
    $catalog = '/srv/ops/llm-router/llm_router/catalog.json';
    if (is_file($cache) && is_file($catalog) && @filemtime($cache) >= @filemtime($catalog)) {
        $cached = trim((string) @file_get_contents($cache));
        if ($cached !== '') {
            return $cached;
        }
    }
    $cmd = 'PYTHONPATH=/srv/ops/llm-router /usr/bin/python3 /srv/ops/llm-router/scripts/pick_model.py chatgpt standard 2>/dev/null';
    $out = trim((string) shell_exec($cmd));
    if ($out !== '') {
        @file_put_contents($cache, $out);
        return $out;
    }
    return 'gpt-5.4-mini';
}

/**
 * Complétion chat OpenAI (titre / résumé Qualif).
 *
 * @throws RuntimeException
 */
function dash_admin_llm_request(string $prompt): string
{
    if (!function_exists('qualif_env')) {
        require_once dirname(__DIR__) . '/shared/bootstrap.php';
    }

    $apiKey = qualif_env('OPENAI_API_KEY');
    if ($apiKey === null || $apiKey === '') {
        throw new RuntimeException('OPENAI_API_KEY manquante (qualif.env)');
    }

    $data = [
        'model' => dash_admin_llm_model(),
        'messages' => [
            [
                'role' => 'system',
                'content' =>
                    'Tu es un assistant rédactionnel pour un site d’actualité francophone. '
                    . 'Quelle que soit la langue de la source (anglais, etc.), tu réponds '
                    . 'toujours intégralement en français : titres, résumés et tout autre texte. '
                    . 'Ne laisse aucun passage en langue étrangère, sauf noms propres, marques '
                    . 'ou acronymes usuels.',
            ],
            ['role' => 'user', 'content' => $prompt],
        ],
    ];

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    if ($ch === false) {
        throw new RuntimeException('curl_init OpenAI impossible');
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($data, JSON_UNESCAPED_UNICODE),
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 60,
    ]);

    $response = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno !== 0 || !is_string($response) || $response === '') {
        throw new RuntimeException(
            'OpenAI HTTP : ' . ($error !== '' ? $error : 'réponse vide')
        );
    }

    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('OpenAI refus HTTP ' . $status);
    }

    $decoded = json_decode($response, true);
    $content = $decoded['choices'][0]['message']['content'] ?? null;
    if (!is_string($content) || trim($content) === '') {
        throw new RuntimeException('OpenAI : contenu vide');
    }
    if (dash_admin_is_ia_error_text($content)) {
        throw new RuntimeException('OpenAI : réponse d’erreur rejetée');
    }

    return $content;
}
