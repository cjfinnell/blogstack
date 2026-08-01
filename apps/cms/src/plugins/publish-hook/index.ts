/**
 * Fires a GitHub `repository_dispatch` when a blog post is published, so
 * deploy.yml can rebuild just this site. See PLAN.md#publish-webhook and the
 * spike findings recorded there.
 *
 * Confirmed against @sonicjs-cms/core@3.0.0-beta.26: `content:after:publish`
 * only dispatches on a draft->published transition (core resolves that
 * itself), and the core dispatcher always wraps the handler chain in
 * `c.executionCtx.waitUntil(...)`, fire-and-forget, swallowing errors itself.
 * So this plugin's `hooks` handler never needs to manage waitUntil.
 *
 * Declarative `hooks` handlers get no env/context of their own
 * (dispatchHookEvent() calls `hooks.dispatch(event, payload)` with no
 * TypedHookContext) — so credentials are threaded through the same shared
 * mutable-object pattern the core example plugin uses for its settings,
 * populated once in onBoot.
 */
import { definePlugin } from '@sonicjs-cms/core';

interface GithubDispatchConfig {
  repo?: string;
  token?: string;
  siteId?: string;
}

const github: GithubDispatchConfig = {};

export const publishHookPlugin = definePlugin({
  id: 'publish-hook',
  name: 'Publish Hook',
  version: '1.0.0',
  description: 'Dispatches a GitHub Actions rebuild when a blog post is published.',
  sonicjsVersionRange: '^3.0.0',

  async onBoot(ctx) {
    const env = ctx.env as { SITE_ID?: string; GITHUB_REPO?: string; GITHUB_DISPATCH_TOKEN?: string } | undefined;
    github.repo = env?.GITHUB_REPO;
    github.token = env?.GITHUB_DISPATCH_TOKEN;
    github.siteId = env?.SITE_ID;
  },

  hooks: {
    'content:after:publish': (payload) => {
      if (payload.collection !== 'blog_post') return;
      if (!github.repo || !github.token || !github.siteId) {
        // Local dev (env.dev) sets none of these on purpose — no deploy to trigger.
        return;
      }

      fetch(`https://api.github.com/repos/${github.repo}/dispatches`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${github.token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'blogstack-publish-hook',
        },
        body: JSON.stringify({
          event_type: 'cms-publish',
          client_payload: { site: github.siteId },
        }),
      }).catch((error) => {
        // Non-fatal: a missed rebuild trigger is recoverable with a manual
        // `npm run release`. It must never surface as a save error.
        console.warn('[publish-hook] GitHub dispatch failed:', error);
      });
    },
  },
});

export default publishHookPlugin;
