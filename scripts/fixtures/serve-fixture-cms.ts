// A canned stand-in for the CMS's public read endpoints, used only for the CI
// build-smoke step (build a themed app against fixtures, no live CMS). See
// PLAN.md#testing.

import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { PLACEHOLDER_VARIABLES } from '../../packages/blog-client/src/placeholders.ts';

const posts = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'blog-posts.json'), 'utf8'),
) as unknown[];

// A CMS-hosted backdrop for the fixture review's city, so the build exercises
// copying a site-copy image onto the blog's own domain. Generated rather than
// committed: images are site copy, not code.
const backdropImage = await sharp({
  create: { width: 64, height: 32, channels: 3, background: '#d8cfb8' },
})
  .webp()
  .toBuffer();

export function startFixtureServer(port: number): Promise<Server> {
  const backdropUrl = `http://localhost:${String(port)}/files/backdrops/map.webp`;
  const copy: Record<string, string> = {
    ...PLACEHOLDER_VARIABLES,
    review_backdrop_denver_co_light: backdropUrl,
    review_backdrop_denver_co_dark: backdropUrl,
  };

  const server = createServer((req, res) => {
    if (req.url === '/files/backdrops/map.webp') {
      res.writeHead(200, { 'content-type': 'image/webp' });
      res.end(backdropImage);
      return;
    }
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
      const documents = Object.entries(copy).map(([key, value]) => ({
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
