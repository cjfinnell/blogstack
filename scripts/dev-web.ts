// npm run dev:web -- <site>   e.g. npm run dev:web -- terminal
// Runs `astro dev` for the given site's app, on its pinned port from
// config/sites.ts, pointed at the local dev CMS.

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { sites, siteIds, type SiteId } from '../config/sites.ts';

const siteArg = process.argv[2];

function isSiteId(value: string | undefined): value is SiteId {
  return !!value && (siteIds as string[]).includes(value);
}

if (!isSiteId(siteArg)) {
  console.error(`Usage: npm run dev:web -- <site>\nSites: ${siteIds.join(', ')}`);
  process.exit(1);
}

const site = sites[siteArg];
const root = resolve(import.meta.dirname, '..');

const child = spawn('npm', ['run', 'dev', '--', '--port', String(site.devPort)], {
  cwd: resolve(root, site.app),
  stdio: 'inherit',
  env: {
    ...process.env,
    CMS_URL: process.env.CMS_URL ?? 'http://localhost:8787',
  },
});

child.on('exit', (code) => process.exit(code ?? 0));
