/**
 * Parity with admin/inc/rss-filter.php classifiers used at RSS ingest.
 */

const PROMO_WORDS = [
  'promo',
  'promotion',
  'publicité',
  'black friday',
  'bon plan',
  'bons plans',
  'soldes',
  'partenaire',
  'sponsorisé',
  'sponsorisée',
  'cashback',
  'affiliation',
  'gratuit pendant',
  'offre exclusive',
  'réduction exclusive',
  "jusqu'à -",
  'jusqu’à –',
  'prix barré',
  'discount',
  'coupon',
  'sale',
  'advertisement',
  'sponsored',
  'special offer',
  'limited offer',
  'deal ends',
  'free trial',
  'buy one get',
];

const NOISE_PHRASES = [
  'communiqué de presse',
  'press release',
  'media advisory',
  'sponsored by',
  'paid partnership',
  'contenu partenaire',
  'contenu sponsorisé',
  'brand voice',
  'brandvoice',
  'native advertising',
  'shop now',
  'buy now',
  'order now',
  'limited time offer',
  'flash sale',
  'deal of the day',
  'prime day',
  '% off',
  'percent off',
  'gratuit pour',
  'code promo exclusif',
  'lien affilié',
  "lien d'affiliation",
  "you won't believe",
  'doctors hate',
  'simple trick',
  'one weird trick',
  'click here to',
  'subscribe to win',
];

export function estArticlePublicitaire(titre, texte) {
  const contenu = `${titre || ''} ${texte || ''}`.toLowerCase();
  return PROMO_WORDS.some((mot) => contenu.includes(mot.toLowerCase()));
}

export function estArticleFluxBruit(titre, texte) {
  const bloc = `${String(titre || '').toLowerCase()}\n${String(texte || '').toLowerCase()}`;
  return NOISE_PHRASES.some((p) => bloc.includes(p));
}

/** Word-boundary keyword match (Unicode letters/digits), PHP dash_admin_keyword_match_in_text. */
export function keywordMatchInText(haystack, needle) {
  const n = String(needle || '').trim();
  if (!n || [...n].length < 2) return false;
  const h = String(haystack || '').toLowerCase();
  const needleLower = n.toLowerCase();
  const escaped = needleLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}\\p{N}_])${escaped}(?:$|[^\\p{L}\\p{N}_])`, 'u').test(h);
}

export const VIGIE_THEMES = [
  'politique',
  'international',
  'economie',
  'hightech',
  'societe',
];

export const VIGIE_THEME_LABELS = {
  politique: 'Politique',
  international: 'International',
  economie: 'Économie',
  hightech: 'High-tech',
  societe: 'Société',
};

export function vigieThemeLabel(themeKey) {
  const key = String(themeKey || '')
    .toLowerCase()
    .trim();
  if (!key) return '';
  return VIGIE_THEME_LABELS[key] ?? themeKey;
}

/** « High-tech · Ars Technica » → journal seul. */
export function journalFromSource(feedName) {
  const name = String(feedName || '').trim();
  if (!name) return '';
  const sep = ' · ';
  const pos = name.indexOf(sep);
  if (pos !== -1) return name.slice(pos + sep.length).trim();
  return name;
}
