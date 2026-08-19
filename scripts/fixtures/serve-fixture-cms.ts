// A canned stand-in for the CMS's public read endpoints, used only for the CI
// build-smoke step (build a themed app against fixtures, no live CMS). See
// PLAN.md#testing.

import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PLACEHOLDER_VARIABLES } from '../../packages/blog-client/src/placeholders.ts';

const posts = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'blog-posts.json'), 'utf8'),
) as unknown[];

export function startFixtureServer(port: number): Promise<Server> {
  const server = createServer((req, res) => {
    if (req.url?.startsWith('/api/blog_post')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: posts, meta: { count: posts.length } }));
      return;
    }
    // The chrome's copy, as site_copy documents. The fixture serves the
    // placeholder map itself, imported rather than copied: test values and
    // default values are deliberately the same object, because a second
    // hand-written set would drift and the drift would surface as copy on a
    // real page. Every value is brace-wrapped, so a build that renders these is
    // obvious on sight and `assertNoPlaceholders` refuses to ship it.
    if (req.url?.startsWith('/api/site_copy')) {
      const documents = Object.entries(PLACEHOLDER_VARIABLES).map(([key, value]) => ({
        data: { key, value },
      }));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: documents, meta: { count: documents.length } }));
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
