// CI build smoke test: builds apps/web-dev against the fixture CMS server,
// hermetically, with no live CMS. A blog-client regression fails here before
// any themed app is touched. See PLAN.md#testing.

import { spawn } from 'node:child_process';
import { startFixtureServer } from './fixtures/serve-fixture-cms.ts';

const PORT = 8788;

const server = await startFixtureServer(PORT);
console.log(`fixture CMS listening on :${String(PORT)}`);

const child = spawn('npm', ['run', 'build', '--workspace', 'apps/web-dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    CMS_URL: `http://localhost:${String(PORT)}`,
    SITE_URL: 'http://localhost:4321',
    // The fixture CMS serves the placeholder settings row, which a production
    // build refuses to render. This is the one build allowed to: its whole job
    // is to prove the client and the templates still compile without a live
    // CMS. Nothing here is deployed.
    ALLOW_PLACEHOLDER_COPY: '1',
  },
});

child.on('exit', (code) => {
  server.close();
  process.exit(code ?? 1);
});
