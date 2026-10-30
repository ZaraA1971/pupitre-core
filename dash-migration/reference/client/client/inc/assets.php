<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/shared/dash/Assets.php';
require_once dirname(__DIR__, 2) . '/shared/dash/Lightbox.php';

require_once dirname(__DIR__, 2) . '/shared/dash/Site.php';

function dash_electron_base_path(): string
{
    return DashSite::clientBase();
}

function dash_electron_render_stylesheets(): void
{
    DashAssets::renderStylesheets('electron');
}

function dash_electron_render_lightbox_css(): void
{
    DashLightbox::renderCss();
}

function dash_electron_render_lightbox_js(): void
{
    DashLightbox::renderJs();
}

function dash_electron_render_client_guard(): void
{
    DashAssets::renderClientGuard();
}

function dash_electron_asset(string $relativePath): string
{
    return DashAssets::app('electron', $relativePath);
}

function dash_electron_shared_asset(string $relativePath): string
{
    return DashAssets::shared($relativePath);
}
