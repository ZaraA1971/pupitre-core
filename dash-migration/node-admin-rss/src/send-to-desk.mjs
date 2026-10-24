import { postIdsFromRequest } from './filters.mjs';
import { isIaErrorText, nettoyerTexteAvance, stripMdNoise } from './text.mjs';

/**
 * Parity with admin/send_to_desk.php + inc/desk.php create_draft.
 * fetchArticle / llm are injectable; with DASH_DISABLE_EXTERNAL the desk client does not HTTP.
 */
export async function handleSendToDesk(
  body,
  { db, externals, fetchArticle, llm }
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
          'Tâche : produire UN titre journalistique EN FRANÇAIS uniquement.\n\n' +
          rawText;
        let titreIa = await llm(promptTitre);
        titreIa = stripMdNoise(titreIa);
        title = nettoyerTexteAvance(titreIa);
        if (!title || isIaErrorText(title)) {
          throw new Error('Titre FR vide ou invalide');
        }

        const promptResume =
          'SOURCE (langue quelconque — anglais fréquent).\n' +
          'Tâche : rédiger un résumé journalistique ENTIÈREMENT EN FRANÇAIS.\n\n' +
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
        slug: nettoyerTexteAvance(title),
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
    },
  };
}
