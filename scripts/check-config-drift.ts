// Parses the rendered wrangler.toml (against .env.example dummy values, so
// this needs no secrets and runs on fork PRs) and asserts the 7 hand-authored
// env blocks stay consistent with config/sites.ts and mise.toml. This is the
// highest-value test in the repo: duplicated env blocks are this design's
// main failure mode. See PLAN.md#testing.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { sites, deployedSiteIds } from '../config/sites.ts';

const root = resolve(import.meta.dirname, '..');

function loadEnvExample(): Record<string, string> {
  const raw = readFileSync(resolve(root, '.env.example'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const raw_value = trimmed.slice(eq + 1);
    env[key] = raw_value || `dummy-${key.toLowerCase()}`;
  }
  return env;
}

function renderTemplate(env: Record<string, string>): string {
  const template = readFileSync(resolve(root, 'wrangler.template.toml'), 'utf8');
  return template.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (match, name: string) => env[name] ?? match);
}

// Minimal ">=X.Y.Z" range check — the only shape used in this repo's engines fields.
function satisfiesMinNode(version: string, range: string): boolean {
  const m = range.match(/^>=\s*(\d+)\.(\d+)\.(\d+)/);
  if (!m) return true; // unrecognized range shape — don't fail the check on it
  const [, rMaj, rMin, rPatch] = m.map(Number.parseFloat.bind(Number)) as unknown as [
    number,
    number,
    number,
    number,
  ];
  const [vMaj, vMin, vPatch] = version.split('.').map(Number);
  if (vMaj !== rMaj) return vMaj > rMaj;
  if (vMin !== rMin) return vMin > rMin;
  return vPatch >= rPatch;
}

interface WranglerEnvBlock {
  assets?: { directory?: string };
  d1_databases?: Array<{ database_name?: string }>;
  r2_buckets?: Array<{ bucket_name?: string }>;
  vars?: Record<string, string>;
  routes?: Array<{ pattern?: string; custom_domain?: boolean }>;
  workers_dev?: boolean;
  preview_urls?: boolean;
}

interface WranglerDoc {
  env?: Record<string, WranglerEnvBlock>;
}

export function checkConfigDrift(): string[] {
  const errors: string[] = [];
  const env = loadEnvExample();
  const rendered = renderTemplate(env);

  if (rendered.includes('${')) {
    errors.push('unrendered ${...} placeholder survived substitution against .env.example');
  }

  const doc = parseToml(rendered) as unknown as WranglerDoc;

  const devBlock = doc.env?.dev;
  if (!devBlock) {
    errors.push('missing [env.dev] block');
  } else {
    const d1Name = devBlock.d1_databases?.[0]?.database_name;
    if (d1Name !== 'blogstack-dev-db') {
      errors.push(`[env.dev] d1 database_name is "${d1Name}", expected "blogstack-dev-db"`);
    }
    const bucketName = devBlock.r2_buckets?.[0]?.bucket_name;
    if (bucketName !== 'blogstack-dev-media') {
      errors.push(`[env.dev] r2 bucket_name is "${bucketName}", expected "blogstack-dev-media"`);
    }
    const corsOrigins = (devBlock.vars?.CORS_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const expectedPorts = Object.values(sites).map((s) => `http://localhost:${s.devPort}`);
    const sameSet =
      corsOrigins.length === expectedPorts.length &&
      expectedPorts.every((p) => corsOrigins.includes(p));
    if (!sameSet) {
      errors.push(
        `[env.dev] CORS_ORIGINS is "${corsOrigins.join(',')}", expected exactly "${expectedPorts.join(',')}"`,
      );
    }
  }

  for (const siteId of deployedSiteIds) {
    const cmsKey = `cms_${siteId}`;
    const webKey = `web_${siteId}`;
    const previewKey = `preview_${siteId}`;
    const cmsBlock = doc.env?.[cmsKey];
    const webBlock = doc.env?.[webKey];
    const previewBlock = doc.env?.[previewKey];

    if (!cmsBlock) errors.push(`missing [env.${cmsKey}] block for deployed site "${siteId}"`);
    if (!webBlock) errors.push(`missing [env.${webKey}] block for deployed site "${siteId}"`);
    if (!previewBlock)
      errors.push(`missing [env.${previewKey}] block for deployed site "${siteId}"`);

    const expectedDir = `${sites[siteId].app}/dist`;

    if (webBlock) {
      if (webBlock.assets?.directory !== expectedDir) {
        errors.push(
          `[env.${webKey}] assets.directory is "${webBlock.assets?.directory}", expected "${expectedDir}"`,
        );
      }
      // preview_urls must stay off on production Workers: previews are their own
      // per-PR Workers, so versioned <hash>-<worker>.workers.dev URLs on the
      // production Worker would only be an unmonitored way around the custom domain.
      if (webBlock.preview_urls !== false) {
        errors.push(`[env.${webKey}] preview_urls is ${webBlock.preview_urls}, expected false`);
      }
    }

    if (previewBlock) {
      // Previews serve the same bundle the production Worker would...
      if (previewBlock.assets?.directory !== expectedDir) {
        errors.push(
          `[env.${previewKey}] assets.directory is "${previewBlock.assets?.directory}", expected "${expectedDir}"`,
        );
      }
      // ...but must never be reachable on a production hostname. preview.yml
      // overrides the Worker name per PR; a stray route here would be shared by
      // every PR's Worker and would hijack the real site.
      if (previewBlock.routes !== undefined) {
        errors.push(`[env.${previewKey}] must not declare routes`);
      }
      if (previewBlock.workers_dev !== true) {
        errors.push(
          `[env.${previewKey}] workers_dev is ${previewBlock.workers_dev}, expected true`,
        );
      }
      // Preview Workers are assets-only clones. A binding here would be a real
      // per-PR resource that `wrangler delete` on PR close is not accounted for.
      if (previewBlock.d1_databases || previewBlock.r2_buckets) {
        errors.push(`[env.${previewKey}] must not declare d1_databases or r2_buckets`);
      }
    }

    if (cmsBlock) {
      const expectedDbName = `blogstack-${siteId}-db`;
      const d1Name = cmsBlock.d1_databases?.[0]?.database_name;
      if (d1Name !== expectedDbName) {
        errors.push(
          `[env.${cmsKey}] d1 database_name is "${d1Name}", expected "${expectedDbName}"`,
        );
      }
      const expectedBucket = `blogstack-${siteId}-media`;
      const bucketName = cmsBlock.r2_buckets?.[0]?.bucket_name;
      if (bucketName !== expectedBucket) {
        errors.push(
          `[env.${cmsKey}] r2 bucket_name is "${bucketName}", expected "${expectedBucket}"`,
        );
      }
    }
  }

  const mise = parseToml(readFileSync(resolve(root, 'mise.toml'), 'utf8')) as {
    tools?: { node?: string };
  };
  const nodeVersion = mise.tools?.node;
  if (!nodeVersion) {
    errors.push('mise.toml missing [tools] node version');
  } else {
    const workspaceDirs = [
      'apps/cms',
      'apps/web-dev',
      'apps/web-terminal',
      'apps/web-folio',
      'packages/blog-client',
    ];
    for (const dir of workspaceDirs) {
      const pkgPath = resolve(root, dir, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { engines?: { node?: string } };
      const range = pkg.engines?.node;
      if (range && !satisfiesMinNode(nodeVersion, range)) {
        errors.push(
          `mise.toml node ${nodeVersion} does not satisfy ${dir}/package.json engines.node "${range}"`,
        );
      }
    }
  }

  return errors;
}
