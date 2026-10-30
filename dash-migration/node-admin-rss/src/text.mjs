/** Minimal parity helpers used by send_to_desk (nettoyerTexteAvance / IA error). */

export function nettoyerTexteAvance(texte) {
  let t = String(texte ?? '');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t.replace(/&nbsp;/gi, ' ');
  t = t.replace(/&amp;/gi, '&');
  t = t.replace(/&quot;/gi, '"');
  t = t.replace(/&#39;/gi, "'");
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

export function isIaErrorText(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  return (
    /^\[?\s*Erreur\b/iu.test(t) ||
    /clé\s+OpenAI\s+manquante/iu.test(t) ||
    /^\[?\s*Résumé\s+indisponible/iu.test(t)
  );
}

export function stripMdNoise(text) {
  return String(text || '').replace(/[*_`#>~\-]+/g, '');
}
