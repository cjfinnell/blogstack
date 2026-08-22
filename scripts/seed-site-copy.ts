// Creates the chrome's copy as `site_copy` documents.
//
// Every value it writes is the key itself, upper-cased — it never invents copy.
// The point is that the ~60 documents exist to be edited, rather than having to
// be typed out by hand one at a time. An upper-cased default does not block the
// build: it ships and shows on the live site, so an editor can see exactly
// what to fill in instead of guessing at copy before ever seeing the page.
//
// There is no migration path from the old `global_variables` store: those tables
// were dropped from every database, so nothing is left to carry over. The dev
// CMS's copy was moved into its `site_copy` documents before that; every other
// environment starts on placeholders and gets its words written in the admin.
//
// Opt-in for local use. deploy.yml also runs this for olive, on every deploy
// where the CMS changed — see the "Seed site copy" step there.
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

import siteCopyCollection from '../apps/cms/src/collections/site-copy.collection.ts';
import { PLACEHOLDER_MARKER, SETTING_KEYS } from '../packages/blog-client/src/placeholders.ts';

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
    bind: (...values: (string | number)[]) => {
      all: () => Promise<{ results?: unknown[] }>;
      run: () => Promise<unknown>;
    };
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

// documents.type_id is a FK into document_types. Core normally fills that row
// itself — autoRegisterCollectionDocumentTypes(), run from bootstrapMiddleware
// on the deployed Worker's first HTTP request. This script never sends the
// Worker a request; it writes to D1 directly, the same as core's own
// SettingsService.saveSettingsDocument() does for `site_settings` (see
// @sonicjs-cms/core src/services/settings.ts). On a freshly migrated
// database the FK insert below fails until that row exists, so seed it here
// too, the same way.
await db
  .prepare(
    `INSERT OR IGNORE INTO document_types (id, name, display_name, description, schema, source, is_system, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  .bind(
    TYPE_ID,
    TYPE_ID,
    siteCopyCollection.displayName,
    siteCopyCollection.description,
    '{}',
    'system',
    0,
    1,
    Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000),
  )
  .run();

interface ExistingDocument {
  id: string;
  value: string;
}

/**
 * The documents that already exist, by key, so re-running skips them — except
 * a document whose value still carries `PLACEHOLDER_MARKER`, which means
 * nobody has ever edited it. That case is repaired below rather than left
 * alone, because a document created before the seed defaults changed from
 * `{{ braced }}` text to an upper-cased key would otherwise ship the old
 * brace-wrapped default forever: it reads as unfilled either way, but only
 * the old format still trips `assertNoPlaceholders` and blocks the build.
 */
async function existingDocuments(): Promise<Map<string, ExistingDocument>> {
  const { results } = await db
    .prepare('SELECT id, data FROM documents WHERE type_id = ? AND deleted_at IS NULL')
    .bind(TYPE_ID)
    .all();
  const map = new Map<string, ExistingDocument>();
  for (const row of (results ?? []) as { id?: string; data?: string }[]) {
    try {
      const parsed = JSON.parse(row.data ?? '{}') as { key?: string; value?: string };
      if (parsed.key && row.id) map.set(parsed.key, { id: row.id, value: parsed.value ?? '' });
    } catch {
      // A document whose data will not parse is not one we can key off. Leave
      // it: seeding around it is better than failing the whole run over one row.
    }
  }
  return map;
}

const documents = new DocumentsService(db as unknown as ServiceDb, { tenantId: 'default' });

let created = 0;
let existing = 0;
let repaired = 0;

try {
  const have = await existingDocuments();

  for (const setting of SETTING_KEYS) {
    const existingDoc = have.get(setting.key);
    if (existingDoc) {
      if (existingDoc.value.includes(PLACEHOLDER_MARKER)) {
        await db
          .prepare('UPDATE documents SET data = ?, updated_at = ? WHERE id = ?')
          .bind(
            JSON.stringify({
              key: setting.key,
              value: setting.placeholder,
              description: setting.description,
              category: setting.category,
            }),
            Math.floor(Date.now() / 1000),
            existingDoc.id,
          )
          .run();
        repaired++;
      } else {
        existing++;
      }
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

console.log(
  `${String(created)} created, ${String(existing)} already present, ${String(repaired)} repaired.`,
);
console.log(
  'Edit them in the admin under Site Copy. Unfilled ones ship as their upper-cased key ' +
    '(e.g. SITE_NAME) — visible on the live site, and only published documents are visible to it.',
);
