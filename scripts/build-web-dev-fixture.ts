// CI build smoke test: builds apps/web-dev against the fixture CMS server,
// hermetically, with no live CMS. A blog-client regression fails here before
// any themed app is touched. See PLAN.md#testing.

import { spawn } from 'node:child_process';
import { startFixtureServer } from './fixtures/serve-fixture-cms.ts';

const PORT = 8788;

const server = await startFixtureServer(PORT);
console.log(`fixture CMS listening on :${PORT}`);

const child = spawn('npm', ['run', 'build', '--workspace', 'apps/web-dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    CMS_URL: `http://localhost:${PORT}`,
    SITE_URL: 'http://localhost:4321',
  },
});

child.on('exit', (code) => {
  server.close();
  process.exit(code ?? 1);
});
