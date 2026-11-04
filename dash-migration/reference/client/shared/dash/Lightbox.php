<?php
declare(strict_types=1);

require_once __DIR__ . '/Assets.php';

/** Lightbox iframe — Fancybox 5 (@fancyapps/ui), admin + client. */
final class DashLightbox
{
    private const FANCYBOX_VERSION = '5.0.36';
    private const FANCYBOX_CSS = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@%s/dist/fancybox/fancybox.css';
    private const FANCYBOX_JS = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@%s/dist/fancybox/fancybox.umd.js';

    private static bool $cssPrinted = false;
    private static bool $jsPrinted = false;

    public static function renderCss(): void
    {
        if (self::$cssPrinted) {
            return;
        }
        self::$cssPrinted = true;
        $href = sprintf(self::FANCYBOX_CSS, self::FANCYBOX_VERSION);
        echo '    <link rel="stylesheet" href="' . htmlspecialchars($href, ENT_QUOTES, 'UTF-8') . '"/>' . "\n";
    }

    public static function renderJs(): void
    {
        if (self::$jsPrinted) {
            return;
        }
        self::$jsPrinted = true;
        $jsUrl = sprintf(self::FANCYBOX_JS, self::FANCYBOX_VERSION);
        $initUrl = htmlspecialchars(DashAssets::shared('js/dash-lightbox.js'), ENT_QUOTES, 'UTF-8');
        echo '<script src="' . htmlspecialchars($jsUrl, ENT_QUOTES, 'UTF-8') . '"></script>' . "\n";
        echo '<script src="' . $initUrl . '"></script>' . "\n";
    }

    /** Script inline pour fermer la lightbox parente (popups iframe). */
    public static function renderParentCloseScript(int $delayMs = 2000): void
    {
        $delay = max(0, $delayMs);
        ?>
<script>
setTimeout(function () {
    if (window.parent && window.parent !== window && window.parent.Fancybox) {
        window.parent.Fancybox.close();
    }
}, <?= (int) $delay ?>);
</script>
        <?php
    }
}
