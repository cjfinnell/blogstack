// A deploy.yml job is scoped to one GitHub Environment (CURRENT_SITE), so it
// only has that site's real CMS_HOST/WEB_HOST/WEB_ORIGIN secrets. But
// wrangler.template.toml has one ${<SITE>_...} placeholder per *deployed*
// site in a single shared file. This maps the current job's unprefixed
// secrets onto its site's prefixed var name, and fills every other deployed
// site's placeholder with an inert dummy — this job only ever runs
// `wrangler ... --env {cms,web}_<CURRENT_SITE>`, so those other blocks are
// rendered but never read.

import { deployedSiteIds } from '../config/sites.ts';

const currentSite = process.env.CURRENT_SITE;
if (!currentSite) throw new Error('ci-gen-wrangler: CURRENT_SITE is required');

const currentPrefix = currentSite.toUpperCase();
if (process.env.CMS_HOST) process.env[`${currentPrefix}_CMS_HOST`] = process.env.CMS_HOST;
if (process.env.WEB_HOST) process.env[`${currentPrefix}_WEB_HOST`] = process.env.WEB_HOST;
if (process.env.WEB_ORIGIN) process.env[`${currentPrefix}_WEB_ORIGIN`] = process.env.WEB_ORIGIN;

for (const site of deployedSiteIds) {
  if (site === currentSite) continue;
  const prefix = site.toUpperCase();
  process.env[`${prefix}_CMS_HOST`] ??= 'unused.invalid';
  process.env[`${prefix}_WEB_HOST`] ??= 'unused.invalid';
  process.env[`${prefix}_WEB_ORIGIN`] ??= 'https://unused.invalid';
}

await import('./gen-wrangler.ts');
