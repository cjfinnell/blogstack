import { createSonicJSApp, registerCollections } from '@sonicjs-cms/core';
import type { Bindings, SonicJSConfig } from '@sonicjs-cms/core';

import blogPostsCollection from './collections/blog-posts.collection';
import { hoistLexicalImportMap } from './lexical-importmap';
import { publishHookPlugin } from './plugins/publish-hook';

// Trigger preview-cms: exercises the new PR-preview dev CMS deploy/migrate/seed path.
registerCollections([blogPostsCollection]);

const config: SonicJSConfig = {
  plugins: {
    // @sonicjs-cms/core@3.0.0-beta.26: DefinedPlugin's `routes[].handler`
    // type (unknown) doesn't structurally satisfy Plugin's (Hono) under this
    // package's own declarations — a pre-existing gap in the beta's types,
    // not a runtime issue (the core example plugin hits the identical
    // error). Confirmed by typechecking sonicjs-blog-base unmodified.
    register: [publishHookPlugin] as NonNullable<SonicJSConfig['plugins']>['register'],
  },
};

const app = createSonicJSApp(config);

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    // See lexical-importmap.ts — without this the rich text editor never boots
    // in Firefox/Safari and every save fails with "Content is required".
    return hoistLexicalImportMap(request, await app.fetch(request, env, ctx));
  },
};
