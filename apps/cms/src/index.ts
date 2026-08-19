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
        // Writes are on: MCP is the intended path for getting posts in — a human
        // writes the prose, an agent transports it. The body must be a lexical
        // tree, so build it with markdownToLexicalJson() from
        // @blogstack/blog-client and check it with assertLexicalShape(); nothing
        // on the server side validates that field, and a malformed one renders
        // as raw markup rather than failing.
        //
        // The write set includes publish and delete. Publishing over MCP does not
        // rebuild the site — core dispatches content:after:publish only from its
        // REST content routes, and MCP calls DocumentsService directly — so a post
        // published this way sits in the database until something else triggers a
        // deploy. Publish from the admin instead, which also keeps the decision to
        // go live with a person. Mint the key under a limited user: its owner's
        // document ACL is the entire blast radius.
        types: { blog_post: { read: true, write: true } },
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
