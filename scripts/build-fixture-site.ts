// CI build smoke test: builds a site against the fixture CMS server,
// hermetically, with no live CMS. A blog-client regression fails here before
// any real deploy is attempted.
//
//   tsx scripts/build-fixture-site.ts                  # apps/web-dev
//   tsx scripts/build-fixture-site.ts apps/web-olive
//
// web-dev is the baseline: it exercises the post-reading client. web-olive is
// the only site that reads site copy, so it is the only one that would catch a
// regression in the site_copy reader before a deploy does.

import { spawn } from 'node:child_process';
import { startFixtureServer } from './fixtures/serve-fixture-cms.ts';

const workspace = process.argv[2] ?? 'apps/web-dev';
const PORT = 8788;

const server = await startFixtureServer(PORT);
console.log(`fixture CMS listening on :${String(PORT)} for ${workspace}`);

const child = spawn('npm', ['run', 'build', '--workspace', workspace], {
  stdio: 'inherit',
  env: {
    ...process.env,
    CMS_URL: `http://localhost:${String(PORT)}`,
    SITE_URL: 'http://localhost:4321',
    // The fixture CMS serves the placeholder copy, which a production build
    // refuses to render. This is the one build allowed to: its whole job is to
    // prove the client and the templates still compile without a live CMS.
    // Nothing here is deployed.
    ALLOW_PLACEHOLDER_COPY: '1',
  },
});

child.on('exit', (code) => {
  server.close();
  process.exit(code ?? 1);
});
