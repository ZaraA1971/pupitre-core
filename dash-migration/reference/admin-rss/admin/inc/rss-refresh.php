<?php
declare(strict_types=1);

/**
 * Verrou refresh_rss (cron + refresh manuel).
 *
 * @return array{idle: int|string, busy: int|string}
 */
function dash_admin_refresh_rss_status_pair(): array
{
    static $pair = null;
    if ($pair !== null) {
        return $pair;
    }

    $local = __DIR__ . '/../refresh_rss_status.local.php';
    if (is_readable($local)) {
        $data = include $local;
        if (is_array($data) && array_key_exists('idle', $data) && array_key_exists('busy', $data)) {
            return $pair = ['idle' => $data['idle'], 'busy' => $data['busy']];
        }
    }

    if (defined('DASH_REFRESH_STATUS_IDLE') && defined('DASH_REFRESH_STATUS_BUSY')) {
        return $pair = [
            'idle' => DASH_REFRESH_STATUS_IDLE,
            'busy' => DASH_REFRESH_STATUS_BUSY,
        ];
    }

    return $pair = ['idle' => '0', 'busy' => '1'];
}

function dash_admin_refresh_rss_set_status(PDO $bdd, bool $busy): void
{
    $p = dash_admin_refresh_rss_status_pair();
    $val = $busy ? $p['busy'] : $p['idle'];
    $stmt = $bdd->prepare('UPDATE `refresh_rss` SET `status` = ? WHERE id = 1');
    $stmt->bindValue(1, (string) $val, PDO::PARAM_STR);
    $stmt->execute();
    if ($busy) {
        dash_admin_refresh_rss_touch_activity($bdd);
    }
}

/**
 * @return array{max_age_seconds: int, phantom_min_idle_seconds: int, phantom_ts_tolerance_seconds: int}
 */
function dash_admin_refresh_rss_lock_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $defaults = [
        'max_age_seconds' => 600,
        'phantom_min_idle_seconds' => 90,
        'phantom_ts_tolerance_seconds' => 600,
    ];

    if (defined('DASH_REFRESH_LOCK_MAX_AGE')) {
        $defaults['max_age_seconds'] = max(300, (int) DASH_REFRESH_LOCK_MAX_AGE);
    }

    $local = __DIR__ . '/../refresh_rss_lock.local.php';
    if (is_readable($local)) {
        $data = include $local;
        if (is_array($data)) {
            foreach (['max_age_seconds', 'phantom_min_idle_seconds', 'phantom_ts_tolerance_seconds'] as $key) {
                if (isset($data[$key])) {
                    $defaults[$key] = max(1, (int) $data[$key]);
                }
            }
        }
    }

    return $config = $defaults;
}

function dash_admin_refresh_rss_lock_max_age_seconds(): int
{
    return dash_admin_refresh_rss_lock_config()['max_age_seconds'];
}

/**
 * @return array{last_update: bool, current: bool}
 */
function dash_admin_refresh_rss_column_flags(PDO $bdd): array
{
    static $flags = [];

    $key = spl_object_hash($bdd);
    if (isset($flags[$key])) {
        return $flags[$key];
    }

    $flags[$key] = ['last_update' => false, 'current' => false];
    foreach (array_keys($flags[$key]) as $column) {
        try {
            $bdd->query('SELECT `' . $column . '` FROM refresh_rss WHERE id = 1 LIMIT 1');
            $flags[$key][$column] = true;
        } catch (Throwable $e) {
            // Colonne absente : ignorer.
        }
    }

    return $flags[$key];
}

function dash_admin_refresh_rss_activity_supported(PDO $bdd): bool
{
    return dash_admin_refresh_rss_column_flags($bdd)['last_update'];
}

function dash_admin_refresh_rss_touch_activity(PDO $bdd): void
{
    if (!dash_admin_refresh_rss_activity_supported($bdd)) {
        return;
    }
    $ts = date('Y-m-d H:i:s');
    try {
        $bdd->prepare('UPDATE refresh_rss SET last_update = ? WHERE id = 1')->execute([$ts]);
    } catch (Throwable $e) {
        error_log('[dash_admin] refresh_rss last_update : ' . $e->getMessage());
    }
}

/**
 * @return array<string, mixed>
 */
function dash_admin_refresh_rss_fetch_row(PDO $bdd): array
{
    $cols = ['status', 'last_refresh'];
    $columnFlags = dash_admin_refresh_rss_column_flags($bdd);
    if ($columnFlags['last_update']) {
        $cols[] = 'last_update';
    }
    if ($columnFlags['current']) {
        $cols[] = 'current';
    }

    try {
        $sql = 'SELECT ' . implode(', ', $cols) . ' FROM refresh_rss WHERE id = 1';
        $row = $bdd->query($sql)->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : [];
    } catch (Throwable $e) {
        error_log('[dash_admin] refresh_rss fetch_row : ' . $e->getMessage());

        return [];
    }
}

function dash_admin_refresh_rss_reset_lock(PDO $bdd, string $reason): void
{
    dash_admin_refresh_rss_set_status($bdd, false);
    try {
        $bdd->prepare('UPDATE refresh_rss SET current = 0 WHERE id = 1')->execute();
    } catch (Throwable $e) {
        // Colonne current absente : ignorer.
    }
    $alert = preg_match('/expir|fantôme|orphan|sans colonne|vide/i', $reason) === 1;
    $prefix = $alert ? '[ALERT][qualif-dash-cron]' : '[dash_admin]';
    error_log($prefix . ' Verrou refresh_rss libéré : ' . $reason);
}

function dash_admin_refresh_rss_release_if_stale(PDO $bdd): bool
{
    $row = dash_admin_refresh_rss_fetch_row($bdd);
    if ($row === [] || !dash_admin_refresh_rss_status_is_busy($row['status'] ?? '')) {
        return false;
    }

    if (!dash_admin_refresh_rss_activity_supported($bdd)) {
        return false;
    }

    $maxAge = dash_admin_refresh_rss_lock_max_age_seconds();
    $now = time();
    $lastTouch = null;
    $rawUpdate = $row['last_update'] ?? null;
    if ($rawUpdate !== null && $rawUpdate !== '' && $rawUpdate !== '0000-00-00 00:00:00') {
        $ts = strtotime((string) $rawUpdate);
        if ($ts !== false) {
            $lastTouch = $ts;
        }
    }

    $lastRefreshTs = null;
    $rawRefresh = $row['last_refresh'] ?? null;
    if ($rawRefresh !== null && $rawRefresh !== '' && $rawRefresh !== '0000-00-00 00:00:00') {
        $ts = strtotime((string) $rawRefresh);
        if ($ts !== false) {
            $lastRefreshTs = $ts;
        }
    }

    $stale = false;
    $reason = '';

    if ($lastTouch === null) {
        $stale = true;
        $reason = 'status occupé, last_update vide';
    } elseif ($now - $lastTouch > $maxAge) {
        $stale = true;
        $reason = 'heartbeat expiré (' . $rawUpdate . ')';
    } elseif ($lastRefreshTs !== null && $lastTouch <= $lastRefreshTs) {
        $stale = true;
        $reason = 'occupé mais last_update <= last_refresh';
    }

    if (!$stale) {
        return false;
    }

    dash_admin_refresh_rss_reset_lock($bdd, $reason);

    return true;
}

function dash_admin_refresh_rss_release_phantom_busy(PDO $bdd): bool
{
    $row = dash_admin_refresh_rss_fetch_row($bdd);
    if ($row === [] || !dash_admin_refresh_rss_status_is_busy($row['status'] ?? '')) {
        return false;
    }

    $rawUpdate = $row['last_update'] ?? null;
    $rawRefresh = $row['last_refresh'] ?? null;
    if ($rawUpdate === null || $rawRefresh === null) {
        return false;
    }

    $touch = strtotime((string) $rawUpdate);
    $refresh = strtotime((string) $rawRefresh);
    if ($touch === false || $refresh === false) {
        return false;
    }

    $cfg = dash_admin_refresh_rss_lock_config();
    $endedAt = max($touch, $refresh);
    if (time() - $endedAt < $cfg['phantom_min_idle_seconds']) {
        return false;
    }
    if (abs($touch - $refresh) > $cfg['phantom_ts_tolerance_seconds']) {
        return false;
    }

    dash_admin_refresh_rss_reset_lock($bdd, 'verrou fantôme (refresh terminé, status bloqué)');

    return true;
}

function dash_admin_refresh_rss_try_unlock(PDO $bdd): bool
{
    if (dash_admin_refresh_rss_release_if_stale($bdd)) {
        return true;
    }

    return dash_admin_refresh_rss_release_phantom_busy($bdd);
}

function dash_admin_refresh_rss_is_locked(PDO $bdd): bool
{
    $row = dash_admin_refresh_rss_fetch_row($bdd);

    return $row !== [] && dash_admin_refresh_rss_status_is_busy($row['status'] ?? '');
}

function dash_admin_refresh_rss_force_unlock(PDO $bdd, string $reason): void
{
    dash_admin_refresh_rss_reset_lock($bdd, $reason);
}

function dash_admin_refresh_rss_status_is_busy($raw): bool
{
    $p = dash_admin_refresh_rss_status_pair();
    $busy = trim((string) $p['busy']);
    $idle = trim((string) $p['idle']);
    $t = trim((string) $raw);

    if ($t === '' || $t === $idle || $t === '0') {
        return false;
    }
    if ($t === $busy || $t === '1') {
        return true;
    }
    if (strcasecmp($t, 'busy') === 0 || strcasecmp($t, 'processing') === 0) {
        return true;
    }

    return false;
}
