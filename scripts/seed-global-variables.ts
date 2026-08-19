// Creates the chrome's global variables, empty, with the description of each.
//
// Every value it writes is a brace-wrapped placeholder — it never writes copy.
// The point is only that the ~60 rows exist to be edited at
// /admin/global-variables, rather than having to be typed out by hand one at a
// time. Rows that already exist are left alone: the API answers 409 and this
// treats that as success, so re-running never overwrites anything real.
//
// Opt-in. Nothing in CI runs this.
//
//   CMS_URL=https://cms.example.com tsx scripts/seed-global-variables.ts
//   CMS_URL=... tsx scripts/seed-global-variables.ts --dry-run
//
// SECURITY NOTE: as of @sonicjs-cms/core 3.0.0-beta.26 the plugin's write
// routes carry no authentication — only a check that the plugin is active. That
// is why this script needs no credentials, and it is also a problem worth
// reviewing before relying on the plugin for anything public-facing.

import { SETTING_KEYS } from '../packages/blog-client/src/placeholders.ts';

const base = (process.env.CMS_URL ?? '').replace(/\/$/, '');
if (!base) {
  console.error('CMS_URL is required, e.g. CMS_URL=https://cms.example.com');
  process.exit(2);
}

const dryRun = process.argv.includes('--dry-run');

let created = 0;
let existing = 0;
let failed = 0;

for (const setting of SETTING_KEYS) {
  if (dryRun) {
    console.log(`would create ${setting.key} [${setting.category}] — ${setting.description}`);
    created++;
    continue;
  }

  const res = await fetch(`${base}/api/global-variables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: setting.key,
      value: setting.placeholder,
      description: setting.description,
      category: setting.category,
    }),
  });

  if (res.status === 409) {
    existing++;
    continue;
  }
  if (!res.ok) {
    failed++;
    console.error(`  ${setting.key}: ${String(res.status)} ${await res.text()}`);
    continue;
  }
  created++;
}

console.log(
  `${String(created)} created, ${String(existing)} already present, ${String(failed)} failed.`,
);
if (failed > 0) process.exit(1);

if (!dryRun) {
  console.log(
    'Now fill them in at /admin/global-variables. A production build refuses to ship ' +
      'while any value is still a {{ placeholder }}.',
  );
}
