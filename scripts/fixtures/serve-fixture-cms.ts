// A canned stand-in for the CMS's /api/blog_post endpoint, used only for the
// CI build-smoke step (build web-dev against fixtures, no live CMS). See
// PLAN.md#testing.

import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const posts = JSON.parse(readFileSync(resolve(import.meta.dirname, 'blog-posts.json'), 'utf8'));

export function startFixtureServer(port: number): Promise<Server> {
  const server = createServer((req, res) => {
    if (req.url?.startsWith('/api/blog_post')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: posts, meta: { count: posts.length } }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  return new Promise((resolveServer) => {
    server.listen(port, () => resolveServer(server));
  });
}
