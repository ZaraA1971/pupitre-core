<?php
declare(strict_types=1);

/** Puce de mention (articles, alertes, commentaires). */
function dash_electron_notif_chip(string $type, string $label, string $href = '#', bool $asButton = false): void
{
    $type = preg_replace('/[^a-z]/', '', $type) ?: 'default';
    $class = 'dash-notif-chip dash-notif-chip--' . $type;
    $id = 'new_' . $type;
    $icon = match ($type) {
        'comment' => '💬',
        'alert' => '⚠',
        'articles' => '✎',
        default => '•',
    };
    $content = '<span class="dash-notif-chip__icon" aria-hidden="true">' . $icon . '</span>'
        . '<span class="dash-notif-chip__label">' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</span>';

    if ($asButton) {
        echo '<button type="button" class="' . $class . '" id="' . htmlspecialchars($id, ENT_QUOTES, 'UTF-8') . '" onclick="showComments();return false;">' . $content . '</button>';
        return;
    }

    echo '<a href="' . htmlspecialchars($href, ENT_QUOTES, 'UTF-8') . '" class="' . $class . '" id="' . htmlspecialchars($id, ENT_QUOTES, 'UTF-8') . '">' . $content . '</a>';
}

/** Badge numérique (messages non lus). */
function dash_electron_notif_badge(int $count): void
{
    if ($count <= 0) {
        return;
    }
    $label = $count === 1 ? '1 message non lu' : $count . ' messages non lus';
    echo '<span class="dash-notif-badge" aria-label="' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '">'
        . (int) $count . '</span>';
}

function dash_electron_notif_panel_open(string $title): void
{
    echo '<div class="dash-notif-panel__inner">';
    echo '<header class="dash-notif-panel__head">';
    echo '<h3 class="dash-notif-panel__title">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</h3>';
    echo '</header>';
}

function dash_electron_notif_panel_close(): void
{
    echo '</div>';
}

function dash_electron_notif_section_open(string $title): void
{
    echo '<section class="dash-notif-section">';
    echo '<h4 class="dash-notif-section__title">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</h4>';
    echo '<ul class="dash-notif-list">';
}

function dash_electron_notif_section_close(): void
{
    echo '</ul></section>';
}

function dash_electron_notif_item(string $href, string $meta, string $body): void
{
    echo '<li class="dash-notif-item">';
    echo '<a href="' . htmlspecialchars($href, ENT_QUOTES, 'UTF-8') . '" class="dash-notif-item__link">';
    if ($meta !== '') {
        echo '<span class="dash-notif-item__meta">' . $meta . '</span>';
    }
    echo '<span class="dash-notif-item__body">' . $body . '</span>';
    echo '</a></li>';
}

function dash_electron_notif_panel_footer(string $href, string $label): void
{
    echo '<footer class="dash-notif-panel__foot">';
    echo '<a href="' . htmlspecialchars($href, ENT_QUOTES, 'UTF-8') . '" class="dash-notif-panel__foot-link">' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</a>';
    echo '</footer>';
}
