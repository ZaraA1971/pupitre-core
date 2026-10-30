import { postIdsFromRequest } from './filters.mjs';

/**
 * Parity with admin/index_actions.php.
 * Intentionally does NOT load or call sendPush (PHP require is unused).
 */
export async function handleIndexActions(body, { db, externals, config }) {
  const posts = postIdsFromRequest(body);
  const result = {
    ok: true,
    actions: [],
    mailAttempts: 0,
    firebaseAttempts: 0,
    sendPushUsed: false,
  };

  if (posts.length && body.send !== undefined) {
    for (const postId of posts) {
      const themeKey = `theme_${postId}`;
      if (body[themeKey] !== undefined && body[themeKey] !== 'empty') {
        const idTheme = Number(body[themeKey]);
        await db.markSent(postId, {
          idTheme,
          dateAddTheme: sqlNow(),
        });
      } else {
        await db.markSent(postId);
      }
    }
    result.actions.push('send');
  }

  if (posts.length && body.alert !== undefined) {
    const isAlert = body.alert === 'oui';
    const dateAddTheme = isAlert ? sqlNow() : '0000-00-00 00:00:00';
    for (const postId of posts) {
      await db.markAlert(postId, { isAlert, dateAddTheme });
      if (!isAlert) continue;

      const post = await db.getPost(postId);
      if (!post) continue;
      await db.linkAuthorIfKnown(post);

      const users = await db.listAlertUsers();
      for (const user of users) {
        const details = await db.userMatchesTheme(user, postId);
        if (!details) continue;
        const content =
          `Alerte : ${details.title}<br/><a href="http://${config.serverName}/dash_${details.dash}/post.php?show_post=${postId}">Cliquez ici pour consulter l'alerte</a>`;
        await externals.sendMail({
          to: String(details.mail),
          subject: `Le Dash [Alerte] : ${details.title}`,
          content,
          headers: { From: config.mailFrom },
        });
        result.mailAttempts += 1;
      }

      if (!(Number(post.id_theme) > 0)) continue;
      const themeId = Number(post.id_theme);
      const title = String(post.title || '');
      const deviceTokens = [];
      for (const dashId of await db.listActiveDashIds()) {
        if (!(await db.sectionFollowsTheme(dashId, themeId))) continue;
        deviceTokens.push(...(await db.sectionAlertTokens(dashId)));
      }
      // PHP: curl only when tokens exist AND FIREBASE_PUSH_AUTH is set.
      if (deviceTokens.length && config.firebaseAuth) {
        await externals.pushFirebase({
          msg: title,
          devices: deviceTokens,
          postId,
          status: 'should_send',
        });
        result.firebaseAttempts += 1;
      }
    }
    result.actions.push('alert');
  }

  if (posts.length && body.delete !== undefined) {
    for (const postId of posts) {
      await db.markDeleted(postId);
    }
    result.actions.push('delete');
  }

  if (body.delete_all !== undefined) {
    await db.deleteAllNew();
    result.actions.push('delete_all');
  }

  return result;
}

function sqlNow() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
