import { createSonicJSApp, mcpPlugin, registerCollections } from '@sonicjs-cms/core';
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
    register: [
      publishHookPlugin,
      // MCP Server. Marking the plugin active in /admin/plugins does nothing on
      // its own — the plugin is opt-in from code, and `register()` is what mounts
      // POST /mcp and the /admin/mcp dashboard. Without this entry the endpoint
      // 404s no matter what the admin UI reports.
      //
      // Auth is delegated: callers present an API key minted at
      // /admin/plugins/api-keys, the core middleware resolves it to a user, and
      // every tool call then runs under that user's document ACL. MCP grants no
      // privilege of its own, so the key's owning user is the whole blast radius.
      mcpPlugin({
        // blog_post is the only registered collection. Global variables live in
        // the global-variables plugin, not the collection registry, so they are
        // not reachable over MCP and cannot be listed here.
        expose: ['blog_post'],
        // Read-only on purpose. The core build ships the write tools enabled
        // (create/update/publish/delete), which puts publishing one tool call
        // away from an agent that was asked to read. Nothing we run needs MCP
        // writes — seeding goes through scripts/seed-global-variables.ts — so
        // this stays false until something does.
        types: { blog_post: { read: true, write: false } },
        listLimit: 50,
      }),
    ] as NonNullable<NonNullable<SonicJSConfig['plugins']>['register']>,
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
