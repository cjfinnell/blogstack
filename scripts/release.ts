// npm run release -- --site terminal
//
// Runs the exact gen -> migrate -> deploy CMS -> build -> deploy web sequence
// deploy.yml runs in CI. Deliberate: the manual escape hatch and the
// automated path share this script, so they can't drift. Also the fallback
// path if a CMS publish hook stops firing. See PLAN.md#local-development.

import { spawnSync } from 'node:child_process';
import { sites, siteIds, type SiteId } from '../config/sites.ts';

function run(cmd: string, args: string[], extraEnv: NodeJS.ProcessEnv = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...extraEnv } });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function isSiteId(value: string | undefined): value is SiteId {
  return !!value && (siteIds as string[]).includes(value);
}

const siteFlagIndex = process.argv.indexOf('--site');
const siteArg = siteFlagIndex !== -1 ? process.argv[siteFlagIndex + 1] : undefined;

if (!isSiteId(siteArg)) {
  console.error(`Usage: npm run release -- --site <site>\nSites: ${siteIds.join(', ')}`);
  process.exit(1);
}

const site = sites[siteArg];
if (!site.deployed) {
  console.error(
    `"${siteArg}" is not a deployed site (config/sites.ts has deployed: false). Nothing to release.`,
  );
  process.exit(1);
}

const prefix = siteArg.toUpperCase();
const cmsHost = process.env[`${prefix}_CMS_HOST`];
const webOrigin = process.env[`${prefix}_WEB_ORIGIN`];

if (!cmsHost || !webOrigin) {
  console.error(
    `Missing ${prefix}_CMS_HOST / ${prefix}_WEB_ORIGIN. Set them in .env.local (or the shell env in CI).`,
  );
  process.exit(1);
}

console.log(`Releasing "${siteArg}"...`);

// Migrations run before the code deploy — additive schema first, then the
// worker that uses it.
run('npm', ['run', 'gen-wrangler']);
run('npx', ['wrangler', 'd1', 'migrations', 'apply', 'DB', '--remote', '--env', `cms_${siteArg}`]);
run('npx', ['wrangler', 'deploy', '--env', `cms_${siteArg}`]);
run('npm', ['run', 'build', '--workspace', site.app], {
  CMS_URL: `https://${cmsHost}`,
  SITE_URL: webOrigin,
});
run('npx', ['wrangler', 'deploy', '--env', `web_${siteArg}`]);

console.log(`Released "${siteArg}".`);
