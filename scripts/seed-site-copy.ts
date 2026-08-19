// Creates the chrome's copy as `site_copy` documents.
//
// Every value it writes is a brace-wrapped placeholder — it never invents copy.
// The point is that the ~60 documents exist to be edited, rather than having to
// be typed out by hand one at a time.
//
// There is no migration path from the old `global_variables` store: those tables
// were dropped from every database, so nothing is left to carry over. The dev
// CMS's copy was moved into its `site_copy` documents before that; every other
// environment starts on placeholders and gets its words written in the admin.
//
// Opt-in. Nothing in CI runs this.
//
//   npm run seed:site-copy                                  # local D1
//   SEED_REMOTE=1 SEED_ENV=cms_olive npm run seed:site-copy  # a deployed site
//   npm run seed:site-copy -- --dry-run
//
// Idempotent: a key that already has a document is left alone, whatever is in
// it. Re-running after adding a key to SETTING_KEYS creates just that one.
//
// Documents are created published, because the build reads anonymously and core
// serves anonymous callers published documents only. An unpublished string is
// invisible to a production build.
//
// It writes to D1 directly, the way apps/cms/scripts/seed-admin.ts does. The
// version of this script that seeded global variables POSTed to
// `/api/global-variables` with no credentials — a route that has answered 401
// since core's `/api/:collection` wildcard started shadowing it, and that has no
// authentication of its own behind that. Seeding is a deploy-time job with
// database access; it does not need an unauthenticated write route to exist.

import { DocumentsService } from '@sonicjs-cms/core';
import { getPlatformProxy } from 'wrangler';

import { SETTING_KEYS } from '../packages/blog-client/src/placeholders.ts';

// Must match apps/cms/src/collections/site-copy.collection.ts, and the
// collection blog-client reads. apps/cms/test/site-copy-collection.test.ts
// holds the three together.
const TYPE_ID = 'site_copy';

const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  for (const setting of SETTING_KEYS) {
    console.log(`would create ${setting.key} [${setting.category}] — ${setting.description}`);
  }
  console.log(`${String(SETTING_KEYS.length)} documents would be created if missing.`);
  process.exit(0);
}

// Only the calls made below, because the root tsconfig this script builds under
// has no @cloudflare/workers-types.
interface SeedDb {
  prepare: (query: string) => {
    bind: (...values: (string | number)[]) => { all: () => Promise<{ results?: unknown[] }> };
    all: () => Promise<{ results?: unknown[] }>;
  };
}

type ServiceDb = ConstructorParameters<typeof DocumentsService>[0];

const remote = process.env.SEED_REMOTE === '1';
const environment = process.env.SEED_ENV ?? 'dev';
const { env, dispose } = await getPlatformProxy(
  remote ? { environment, remoteBindings: true } : { environment },
);
console.log(`Seeding ${remote ? 'REMOTE (deployed)' : 'LOCAL'} database`);

const binding = (env as { DB?: SeedDb }).DB;
if (!binding) {
  console.error('Error: DB binding not found. Run migrations first: npm run db:migrate:local');
  await dispose();
  process.exit(1);
}
const db: SeedDb = binding;

/** The keys that already have a document, so re-running skips them. */
async function existingKeys(): Promise<Set<string>> {
  const { results } = await db
    .prepare('SELECT data FROM documents WHERE type_id = ? AND deleted_at IS NULL')
    .bind(TYPE_ID)
    .all();
  const keys = new Set<string>();
  for (const row of (results ?? []) as { data?: string }[]) {
    try {
      const parsed = JSON.parse(row.data ?? '{}') as { key?: string };
      if (parsed.key) keys.add(parsed.key);
    } catch {
      // A document whose data will not parse is not one we can key off. Leave
      // it: seeding around it is better than failing the whole run over one row.
    }
  }
  return keys;
}

const documents = new DocumentsService(db as unknown as ServiceDb, { tenantId: 'default' });

let created = 0;
let existing = 0;

try {
  const have = await existingKeys();

  for (const setting of SETTING_KEYS) {
    if (have.has(setting.key)) {
      existing++;
      continue;
    }

    await documents.create({
      typeId: TYPE_ID,
      // The key doubles as the document title: it is what the admin list shows,
      // and what anyone looking for a string will search for.
      title: setting.key,
      slug: setting.key.replace(/_/g, '-'),
      data: {
        key: setting.key,
        value: setting.placeholder,
        description: setting.description,
        category: setting.category,
      },
      publishOnCreate: true,
      tenantId: 'default',
      locale: 'default',
      parentRootId: '',
      sortOrder: 0,
      visible: true,
      metadata: {},
    });

    created++;
  }
} catch (error) {
  console.error('Seeding failed:', error);
  await dispose();
  process.exit(1);
}

await dispose();

console.log(`${String(created)} created, ${String(existing)} already present.`);
console.log(
  'Edit them in the admin under Site Copy. A production build refuses to ship while any ' +
    'value is still a {{ placeholder }}, and only published documents are visible to it.',
);
