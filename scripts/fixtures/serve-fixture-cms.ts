// A canned stand-in for the CMS's public read endpoints, used only for the CI
// build-smoke step (build a themed app against fixtures, no live CMS). See
// PLAN.md#testing.

import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PLACEHOLDER_SITE_SETTINGS } from '../../packages/blog-client/src/placeholders.ts';

const posts = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'blog-posts.json'), 'utf8'),
) as unknown[];

// The fixture settings row is the placeholder set itself, imported rather than
// copied. Test values and default values are the same object on purpose: a
// second hand-written copy would drift, and the drift would show up as copy on
// a real page. Every string in it is brace-wrapped, so a build that renders
// these is obvious on sight and `assertNoPlaceholders` refuses to ship it.
const siteSettings = [
  {
    id: 'fixture-settings',
    slug: 'fixture-settings',
    status: 'published',
    updated_at: 0,
    data: PLACEHOLDER_SITE_SETTINGS,
  },
];

export function startFixtureServer(port: number): Promise<Server> {
  const server = createServer((req, res) => {
    if (req.url?.startsWith('/api/blog_post')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: posts, meta: { count: posts.length } }));
      return;
    }
    if (req.url?.startsWith('/api/site_settings')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: siteSettings, meta: { count: siteSettings.length } }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  return new Promise((resolveServer) => {
    server.listen(port, () => {
      resolveServer(server);
    });
  });
}
