/**
 * Runnable demo — pupitre-core slice (no MySQL / no host product).
 *
 *   npm run demo
 */
import {
  createPluginRegistry,
  emitDeskLifecycle,
  createArticleHelpers,
  getContentGen,
} from '../../src/index.mjs';

const plugins = createPluginRegistry([
  {
    id: 'demo-note',
    caps() {
      return { demoNote: true };
    },
    async onPublish(payload) {
      console.log('[demo-note] onPublish', payload.articleId);
    },
  },
]);

const caps = plugins.mergeCaps(
  {
    editAll: true,
    create: true,
    publish: true,
    manageUsers: true,
    media: true,
  },
  {},
  { role: 'editor' }
);

if (!caps.demoNote || !caps.publish) {
  console.error('FAIL: caps merge');
  process.exit(1);
}

const bumped = await emitDeskLifecycle(
  plugins,
  'onPublish',
  { articleId: 42 },
  {}
);
if (typeof bumped !== 'number' || bumped !== getContentGen()) {
  console.error('FAIL: contentGen / emitDeskLifecycle');
  process.exit(1);
}

const helpers = createArticleHelpers({
  tableName: 'articles',
  canAccessDesk: (r) => r === 'editor',
  canEditAll: () => false,
});

if (!helpers.canEditArticle({ role: 'editor', uid: 7 }, { author_user_id: 7 })) {
  console.error('FAIL: canEditArticle own article');
  process.exit(1);
}
if (helpers.canEditArticle({ role: 'editor', uid: 7 }, { author_user_id: 99 })) {
  console.error('FAIL: canEditArticle other author');
  process.exit(1);
}
if (helpers.slugify('Hello World') !== 'hello-world') {
  console.error('FAIL: slugify');
  process.exit(1);
}

console.log('OK pupitre-minimal', {
  plugins: plugins.ids(),
  caps: Object.keys(caps).sort(),
  contentGen: bumped,
  tableName: helpers.tableName,
});
