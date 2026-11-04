<?php
declare(strict_types=1);

$dashNotifShowCenter = $dashNotifShowCenter ?? true;
?>
<div class="dash-nav-brand">
    <span class="dash-nav-brand__title">Electron Libre</span>
    <?php if ($dashNotifShowCenter) { ?>
    <button type="button"
            class="dash-notif-trigger"
            id="toggle_notification_center"
            aria-expanded="false"
            aria-controls="display_notification_center">
        <span class="dash-notif-trigger__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </span>
        <span class="chevron dash-notif-trigger__chevron" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
        <span class="dash-notif-trigger__sr">Ouvrir les notifications</span>
    </button>
    <?php } ?>
</div>
<div id="mentions" class="dash-notif-chips" role="status" aria-live="polite" aria-atomic="true"></div>
<?php if ($dashNotifShowCenter) { ?>
<div id="display_notification_center" class="dash-notif-panel" hidden role="region" aria-label="Centre de notifications"></div>
<?php } ?>
<div id="display_new_comments" class="dash-notif-panel dash-notif-panel--wide" hidden role="region" aria-label="Nouveaux commentaires"></div>
