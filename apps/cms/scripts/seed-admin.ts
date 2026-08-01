import { bootstrapDocumentTypes, RbacService } from '@sonicjs-cms/core';
import { getPlatformProxy } from 'wrangler';

/**
 * Seed script to create the initial admin user.
 *
 * Email:    ADMIN_EMAIL, default admin@connorfinnell.com
 * Password: ADMIN_PASSWORD (required)
 * Env:      SEED_ENV, default "dev" — which wrangler.toml [env.*] block to
 *           read bindings from (there are no top-level bindings, only named
 *           envs, so getPlatformProxy needs to be told which one).
 *
 * Targets the local D1 database by default. Set SEED_REMOTE=1 to seed the
 * deployed database instead, e.g. SEED_REMOTE=1 SEED_ENV=cms_terminal.
 */

async function hashPassword(password: string) {
  const iterations = 100000;
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
}

async function seed() {
  const remote = process.env.SEED_REMOTE === '1';
  const email = process.env.ADMIN_EMAIL || 'admin@connorfinnell.com';
  const environment = process.env.SEED_ENV || 'dev';
  const { env, dispose } = await getPlatformProxy(
    remote ? { environment, remoteBindings: true } : { environment }
  );
  console.log(`Seeding ${remote ? 'REMOTE (deployed)' : 'LOCAL'} database`);

  const db = (env as { DB?: D1Database }).DB;
  if (!db) {
    console.error('Error: DB binding not found. Run migrations first: npm run db:migrate:local');
    process.exit(1);
  }

  try {
    const existing = await db.prepare('SELECT id FROM auth_user WHERE email = ?').bind(email).first();
    if (existing) {
      console.log('Admin user already exists');
      await dispose();
      return;
    }

    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
      console.error('Error: set ADMIN_PASSWORD before running. Example:');
      console.error('   ADMIN_PASSWORD=... npm run seed');
      await dispose();
      process.exit(1);
    }
    const passwordHash = await hashPassword(password);
    const nowMs = Date.now();
    const odid = `admin-${nowMs}-${Math.random().toString(36).slice(2, 11)}`;

    await db.batch([
      db
        .prepare(
          'INSERT INTO auth_user (id, email, first_name, last_name, role, is_active, created_at, updated_at, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(odid, email, 'Admin', 'User', 'admin', 1, nowMs, nowMs, 'Admin User'),
      db
        .prepare(
          'INSERT INTO auth_account (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(crypto.randomUUID(), odid, odid, 'credential', passwordHash, nowMs, nowMs),
    ]);

    await bootstrapDocumentTypes(db);
    const rbac = new RbacService(db);
    await rbac.ensureSystemRbacSeed();
    await rbac.addUserRoleByName(odid, 'admin');

    console.log('Admin user created successfully');
    console.log(`  Email: ${email}`);
    console.log('  Role: admin');
  } catch (error) {
    console.error('Error creating admin user:', error);
    await dispose();
    process.exit(1);
  }

  await dispose();
}

seed()
  .then(() => {
    console.log('Seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
