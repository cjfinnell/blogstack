// Creates the chrome's global variables, empty, with the description of each.
//
// Every value it writes is a brace-wrapped placeholder — it never writes copy.
// The point is only that the ~60 rows exist to be edited at
// /admin/global-variables, rather than having to be typed out by hand one at a
// time. Rows that already exist are left alone, so re-running never overwrites
// anything real.
//
// Opt-in. Nothing in CI runs this.
//
//   npm run seed:variables                              # local D1
//   SEED_REMOTE=1 SEED_ENV=cms_olive npm run seed:variables
//   npm run seed:variables -- --dry-run
//
// Writes to D1 directly, the same way apps/cms/scripts/seed-admin.ts does,
// rather than over HTTP. It used to POST to `/api/global-variables`
// unauthenticated, which worked in neither direction: that route is shadowed by
// core's `/api/:collection` wildcard and answers 401, and the plugin route
// behind it has no auth at all — apps/cms/src/global-variables-guard.ts now
// refuses writes to it outright, because a variable's value is substituted into
// published post bodies and rendered as markup. Seeding is a deploy-time job
// with database access, so it does not need an unauthenticated write route to
// exist and should not be the reason one does.
//
// The table is created by the plugin's install hook, so the plugin has to be
// installed and active before this runs.

import { getPlatformProxy } from 'wrangler';

import { SETTING_KEYS } from '../packages/blog-client/src/placeholders.ts';

const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  for (const setting of SETTING_KEYS) {
    console.log(`would create ${setting.key} [${setting.category}] — ${setting.description}`);
  }
  console.log(`${String(SETTING_KEYS.length)} rows would be created if missing.`);
  process.exit(0);
}

// Structural, because the root tsconfig this script builds under has no
// @cloudflare/workers-types — only the two calls made below are needed.
interface SeedDb {
  prepare: (query: string) => {
    bind: (...values: (string | number)[]) => {
      run: () => Promise<{ meta: { changes: number } }>;
    };
  };
}

const remote = process.env.SEED_REMOTE === '1';
const environment = process.env.SEED_ENV ?? 'dev';
const { env, dispose } = await getPlatformProxy(
  remote ? { environment, remoteBindings: true } : { environment },
);
console.log(`Seeding ${remote ? 'REMOTE (deployed)' : 'LOCAL'} database`);

const db = (env as { DB?: SeedDb }).DB;
if (!db) {
  console.error('Error: DB binding not found. Run migrations first: npm run db:migrate:local');
  await dispose();
  process.exit(1);
}

let created = 0;
let existing = 0;

try {
  for (const setting of SETTING_KEYS) {
    // INSERT OR IGNORE against the table's UNIQUE key: an existing row keeps
    // whatever the editor has written into it, and `changes` says which
    // happened without a second round trip.
    const result = await db
      .prepare(
        'INSERT OR IGNORE INTO global_variables (key, value, description, category, is_active) VALUES (?, ?, ?, ?, 1)',
      )
      .bind(setting.key, setting.placeholder, setting.description, setting.category)
      .run();

    if (result.meta.changes > 0) created++;
    else existing++;
  }
} catch (error) {
  console.error('Seeding failed:', error);
  console.error(
    'If the global_variables table does not exist, install and activate the ' +
      'global-variables plugin in /admin/plugins first — its install hook creates it.',
  );
  await dispose();
  process.exit(1);
}

await dispose();

console.log(`${String(created)} created, ${String(existing)} already present.`);
console.log(
  'Now fill them in at /admin/global-variables. A production build refuses to ship ' +
    'while any value is still a {{ placeholder }}.',
);
