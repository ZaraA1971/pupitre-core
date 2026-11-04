<?php
declare(strict_types=1);

function couperChaineMot($chaine, $nbrMotMax)
{
    $chaineNouvelle = '';
    $t_chaineNouvelle = explode(' ', (string) $chaine);

    foreach ($t_chaineNouvelle as $cle => $mot) {
        if ($cle < $nbrMotMax) {
            $chaineNouvelle .= $mot . ' ';
        }
    }

    return $chaineNouvelle . '..';
}

function couperChaineNombre($chaine, $nbrCarMax)
{
    $chaineNouvelle = substr((string) $chaine, 0, (int) $nbrCarMax);

    if (strlen((string) $chaine) > $nbrCarMax) {
        $chaineNouvelle .= '..';
    }

    return $chaineNouvelle;
}

function couperChaineNombre2($chaine, $nbrCarMax)
{
    $chaineNouvelle = substr((string) $chaine, 0, (int) $nbrCarMax);

    if (strlen((string) $chaine) > $nbrCarMax) {
        $chaineNouvelle .= ' ...';
    }

    return $chaineNouvelle;
}

function getmicrotime(): float
{
    return microtime(true);
}

/**
 * Nombre d'articles encore en base pour chaque mot-clé.
 * Même résultat que l'ancienne jointure post_keyword × keyword × rss_post
 * (un hash présent deux fois dans rss_post compte deux fois).
 *
 * @param list<int|string>|string $keywordIds identifiants, ou liste « 12, 34, 9999999 »
 * @return list<array{id_keyword: string, name_keyword: string, trend: string}>
 */
function dash_keyword_trends(PDO $pdo, array|string $keywordIds): array
{
    if (is_string($keywordIds)) {
        $keywordIds = preg_split('/\s*,\s*/', $keywordIds, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }

    $ids = [];
    foreach ($keywordIds as $id) {
        $n = (int) $id;
        if ($n > 0 && $n !== 9999999) {
            $ids[$n] = $n;
        }
    }
    if ($ids === []) {
        return [];
    }

    $in = implode(',', $ids);

    $sql = '
        SELECT pk.id_keyword, k.name_keyword, COUNT(*) AS trend
        FROM post_keyword pk FORCE INDEX (id_keyword)
        INNER JOIN keyword k ON k.id_keyword = pk.id_keyword
        INNER JOIN rss_post r USE INDEX (hash) ON r.hash = pk.hash_post
        WHERE pk.id_keyword IN (' . $in . ')
        GROUP BY pk.id_keyword
        ORDER BY trend DESC
    ';

    return $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
}

/** @var array<int, string> */
$mois = [
    1 => 'Janvier',
    2 => 'Février',
    3 => 'Mars',
    4 => 'Avril',
    5 => 'Mai',
    6 => 'Juin',
    7 => 'Juillet',
    8 => 'Août',
    9 => 'Septembre',
    10 => 'Octobre',
    11 => 'Novembre',
    12 => 'Décembre',
];

function nettoyerTexteAvance($texte)
{
    $encodage = mb_detect_encoding($texte, mb_detect_order(), true);
    $texte = mb_convert_encoding($texte, 'UTF-8', $encodage);

    if (class_exists('Normalizer') && !Normalizer::isNormalized($texte, Normalizer::FORM_C)) {
        $texte = Normalizer::normalize($texte, Normalizer::FORM_C);
    }

    $texte = html_entity_decode($texte, ENT_QUOTES | ENT_HTML5 | ENT_DISALLOWED, 'UTF-8');
    $texte = strip_tags($texte);

    $corrections = [
        'â€™' => "'", 'â€“' => '-', 'â€”' => '-', 'â€œ' => '"', 'â€�' => '"',
        'â€˜' => "'", 'â€¢' => '•', 'â€¦' => '…', 'â€¡' => '‡', 'â‚¬' => '€',
        'Ã©' => 'é', 'Ã¨' => 'è', 'Ãª' => 'ê', 'Ã ' => 'à', 'Ã¢' => 'â',
        'Ã®' => 'î', 'Ã´' => 'ô', 'Ã»' => 'û', 'Ã¶' => 'ö', 'Ã¤' => 'ä',
        'Ã§' => 'ç', 'Ã¹' => 'ù', 'Ã¼' => 'ü', 'ÃŸ' => 'ß', 'Â' => '',
    ];
    $texte = strtr($texte, $corrections);

    $texte = preg_replace('/[\p{C}]/u', '', $texte);
    $texte = preg_replace('/\s+/', ' ', $texte);

    return trim($texte);
}
