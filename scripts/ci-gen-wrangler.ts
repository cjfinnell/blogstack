// A deploy.yml job is scoped to one GitHub Environment (CURRENT_SITE), so it
// only has that site's real CMS_HOST/WEB_HOST/WEB_ORIGIN secrets. But
// wrangler.template.toml has one ${<SITE>_...} placeholder per *deployed*
// site in a single shared file. This maps the current job's unprefixed
// secrets onto its site's prefixed var name, and fills every other deployed
// site's placeholder with an inert dummy — this job only ever runs
// `wrangler ... --env {cms,web}_<CURRENT_SITE>`, so those other blocks are
// rendered but never read.
//
// PREVIEW=1 is the preview.yml path. Previews deploy `--env preview_<site>`,
// which is assets-only and contains no ${...} placeholders at all, and they
// build against the dev CMS — so a preview job holds no production hostnames
// and every site (including CURRENT_SITE) gets the dummy. Requiring the flag
// explicitly means a *deploy* job that is missing a real secret fails loudly
// instead of silently rendering "unused.invalid" into a production route.

import { deployedSiteIds } from '../config/sites.ts';

const currentSite = process.env.CURRENT_SITE;
if (!currentSite) throw new Error('ci-gen-wrangler: CURRENT_SITE is required');

const preview = process.env.PREVIEW === '1';
const currentPrefix = currentSite.toUpperCase();

if (preview) {
  if (process.env.CMS_HOST || process.env.WEB_HOST || process.env.WEB_ORIGIN || process.env.D1_ID) {
    throw new Error(
      'ci-gen-wrangler: PREVIEW=1 but production host secrets are present. ' +
        'Preview jobs must not be scoped to a production GitHub Environment.',
    );
  }
} else {
  const missing = (['CMS_HOST', 'WEB_HOST', 'WEB_ORIGIN', 'D1_ID'] as const).filter(
    (k) => !process.env[k],
  );
  if (missing.length > 0) {
    throw new Error(
      `ci-gen-wrangler: missing ${missing.join(', ')} for site "${currentSite}". ` +
        "Deploy jobs need the real values from that site's GitHub Environment; " +
        'set PREVIEW=1 if this is a preview build.',
    );
  }
  process.env[`${currentPrefix}_CMS_HOST`] = process.env.CMS_HOST;
  process.env[`${currentPrefix}_WEB_HOST`] = process.env.WEB_HOST;
  process.env[`${currentPrefix}_WEB_ORIGIN`] = process.env.WEB_ORIGIN;
  process.env[`${currentPrefix}_D1_ID`] = process.env.D1_ID;
}

for (const site of deployedSiteIds) {
  const prefix = site.toUpperCase();
  process.env[`${prefix}_CMS_HOST`] ??= 'unused.invalid';
  process.env[`${prefix}_WEB_HOST`] ??= 'unused.invalid';
  process.env[`${prefix}_WEB_ORIGIN`] ??= 'https://unused.invalid';
  // Never read by this job — other sites' cms_* blocks are rendered but not
  // deployed here — but gen-wrangler still needs every placeholder filled.
  process.env[`${prefix}_D1_ID`] ??= 'unused-invalid-d1-id';
}

await import('./gen-wrangler.ts');
