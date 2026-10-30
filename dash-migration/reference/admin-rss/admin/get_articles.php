<?php
declare(strict_types=1);

require_once __DIR__ . '/connect.php';

header('Content-Type: text/html; charset=utf-8');

$keywordId = (int) ($_POST['keyword_id'] ?? 0);
$date2 = trim((string) ($_POST['date2'] ?? ''));

if ($keywordId < 1 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date2)) {
    echo '<p class="graph-day-empty">Paramètres invalides.</p>';
    exit;
}

$stmt = $bdd->prepare('
    SELECT title, link, source, DATE_FORMAT(date, \'%H:%i\') AS cdate
    FROM rss_post
    INNER JOIN post_keyword ON post_keyword.hash_post = rss_post.hash
    INNER JOIN keyword ON post_keyword.id_keyword = keyword.id_keyword
    WHERE post_keyword.id_keyword = :keyword_id
      AND rss_post.deleted = 0
      AND rss_post.bin = 0
      AND rss_post.date LIKE :date2
    ORDER BY rss_post.date DESC
');
$stmt->execute(['keyword_id' => $keywordId, 'date2' => $date2 . '%']);

$dateLabel = trim((string) ($_POST['date'] ?? $date2));
$posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
$count = count($posts);

echo '<div class="graph-day-panel">';
echo '<div class="date_separator graph-day-panel__separator">';
echo htmlspecialchars($dateLabel, ENT_QUOTES, 'UTF-8');
echo $count > 0
    ? ' · ' . $count . ' article' . ($count > 1 ? 's' : '')
    : '';
echo '</div>';

if ($count > 0) {
    echo '<ul class="graph-day-panel__list">';
    foreach ($posts as $post) {
        echo '<li class="graph-day-panel__item">';
        echo '<time class="graph-day-panel__time">' . htmlspecialchars((string) $post['cdate'], ENT_QUOTES, 'UTF-8') . '</time>';
        if (!empty($post['source'])) {
            echo '<span class="graph-day-panel__source grey2">' . htmlspecialchars((string) $post['source'], ENT_QUOTES, 'UTF-8') . '</span>';
        }
        echo '<a class="graph-day-panel__link" href="' . htmlspecialchars((string) $post['link'], ENT_QUOTES, 'UTF-8') . '" target="_blank" rel="noopener noreferrer">';
        echo htmlspecialchars((string) $post['title'], ENT_QUOTES, 'UTF-8');
        echo '</a>';
        echo '</li>';
    }
    echo '</ul>';
} else {
    echo '<p class="graph-day-empty">Aucun article pour cette journée.</p>';
}

echo '</div>';
