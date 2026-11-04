import { postIdsFromRequest } from './filters.mjs';
import { isIaErrorText, nettoyerTexteAvance, stripMdNoise } from './text.mjs';
import { slugifyDeskTitle } from './desk-client.mjs';

/**
 * Parity with admin/send_to_desk.php + inc/desk.php create_draft.
 * fetchArticle / llm are injectable; Desk HTTP stays stubbed when disableExternal.
 *
 * @param {Record<string, unknown>} body
 * @param {{
 *   db: object,
 *   externals: object,
 *   fetchArticle: (url: string, rssHint: string) => Promise<string|null>,
 *   llm: (prompt: string) => Promise<string>,
 *   resolveRssHint?: (post: object) => Promise<string>,
 * }} deps
 */
export async function handleSendToDesk(
  body,
  { db, externals, fetchArticle, llm, resolveRssHint }
) {
  if (body.to_desk === undefined) {
    return { status: 400, json: { success: false, error: 'Action manquante.' } };
  }
  const postIds = postIdsFromRequest(body);
  if (!postIds.length) {
    return {
      status: 400,
      json: { success: false, error: 'Aucun article sélectionné.' },
    };
  }
  if (typeof fetchArticle !== 'function' || typeof llm !== 'function') {
    return {
      status: 503,
      json: {
        success: false,
        disabled: true,
        error:
          'Envoyer au Pupitre indisponible : injectables locaux fetchArticle/llm manquants.',
        missing: ['fetchArticle', 'llm'],
      },
    };
  }

  const processed = [];
  const errors = [];
  const created = [];

  for (const postId of postIds) {
    try {
      const post = await db.getPost(postId);
      if (!post) {
        errors.push({ id: postId, error: 'Article introuvable.' });
        continue;
      }

      let rssHint = String(post.text || '');
      if (!rssHint.trim() && typeof resolveRssHint === 'function') {
        const fromFeed = await resolveRssHint(post);
        if (typeof fromFeed === 'string' && fromFeed.trim()) {
          rssHint = fromFeed;
        }
      }

      const rawText = await fetchArticle(String(post.link || ''), rssHint);
      if (rawText == null || !String(rawText).trim()) {
        errors.push({ id: postId, error: 'Impossible de récupérer le texte source.' });
        continue;
      }

      const bodyPlain = nettoyerTexteAvance(rawText);
      if (!bodyPlain) {
        errors.push({ id: postId, error: 'Texte source vide.' });
        continue;
      }

      let title;
      let contentHtml;
      try {
        const promptTitre =
          'SOURCE (langue quelconque — anglais fréquent).\n' +
          'Tâche : produire UN titre journalistique EN FRANÇAIS uniquement.\n' +
          'Règles : clair, informatif, concis ; pas de sensationnalisme ; ' +
          "traduire le sens si la source n'est pas en français.\n" +
          'Réponds uniquement par le titre français, sans guillemets ni préfixe.\n\n' +
          rawText;
        let titreIa = await llm(promptTitre);
        titreIa = stripMdNoise(titreIa);
        title = nettoyerTexteAvance(titreIa);
        if (!title || isIaErrorText(title)) {
          throw new Error('Titre FR vide ou invalide');
        }

        const promptResume =
          'SOURCE (langue quelconque — anglais fréquent).\n' +
          'Tâche : rédiger un résumé journalistique ENTIÈREMENT EN FRANÇAIS ' +
          '(1 ou 2 paragraphes).\n' +
          'Règles : clair, objectif, sobre ; conserver faits et chiffres clés ; ' +
          "traduire si la source n'est pas en français ; aucune phrase en anglais.\n" +
          'Réponds uniquement par le résumé français.\n\n' +
          rawText;
        let resume = await llm(promptResume);
        resume = stripMdNoise(resume).trim();
        if (!resume || isIaErrorText(resume)) {
          throw new Error('Résumé FR vide ou invalide');
        }
        contentHtml = resume.replace(/\n/g, '<br/>');
      } catch {
        errors.push({
          id: postId,
          error: 'Génération FR impossible (LLM). Réessayez.',
        });
        continue;
      }

      const createdArticle = await externals.createDeskDraft({
        title,
        body: contentHtml,
        slug: slugifyDeskTitle(title),
        author: 'Emmanuel Torregano',
        author_slug: 'admin',
        author_user_id: 1,
        source_url: String(post.link || ''),
        lang: 'fr',
        access: 'subscribers',
        draft: true,
      });

      await db.markDesk(postId);
      await db.linkAuthorIfKnown(post);

      processed.push(postId);
      created.push({
        rss_id: postId,
        article_id: createdArticle.article_id,
        slug: createdArticle.slug,
      });
    } catch {
      errors.push({ id: postId, error: 'Échec traitement.' });
    }
  }

  const status = processed.length === 0 && errors.length ? 500 : 200;
  return {
    status,
    json: {
      success: processed.length > 0,
      processed,
      created,
      errors,
      local: true,
    },
  };
}
