<?php
/**
 * Pousse les articles Vigie vers le sas (localhost). Pas de lecture côté hub.
 */

declare(strict_types=1);

function vigie_ingress_token(): string
{
    $fromEnv = getenv('INCIDENT_HUB_TOKEN') ?: getenv('VIGIE_INGRESS_TOKEN');
    if (is_string($fromEnv) && trim($fromEnv) !== '') {
        return trim($fromEnv);
    }
    $path = '/srv/ops/incident-hub/.env';
    if (!is_readable($path)) {
        return '';
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        if (str_starts_with($line, 'INCIDENT_HUB_TOKEN= {
            return trim(substr($line, strlen('INCIDENT_HUB_TOKEN= " \t\"'");
        }
    }
    return '';
}

function vigie_ingress_push(array $event): bool
{
    $url = 'http://127.0.0.1:8790/ingress';
    $payload = json_encode($event, JSON_UNESCAPED_UNICODE);
    if ($payload === false) {
        return false;
    }
    $headers = "Content-Type: application/json\r\n";
    $token = vigie_ingress_token();
    if ($token !== '') {
        $headers .= 'X-Incident-Token: ' . $token . "\r\n";
    }
    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => $headers,
            'content' => $payload,
            'timeout' => 4,
            'ignore_errors' => true,
        ],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    return $raw !== false;
}

/** @param list<array<string,mixed>> $events */
function vigie_ingress_push_infos(array $events): void
{
    $n = count($events);
    foreach ($events as $i => $event) {
        $event['source'] = $event['source'] ?? 'dash';
        $event['kind'] = 'info';
        $event['drain'] = ($i === $n - 1);
        vigie_ingress_push($event);
    }
}
