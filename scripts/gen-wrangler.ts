// Renders wrangler.template.toml -> wrangler.toml, substituting ${VAR}
// placeholders from process.env. Wrangler has no config-level variable
// interpolation, so this is the injection mechanism (see PLAN.md#anonymity).
//
// Local dev sources process.env from `.env.local` via mise's `_.file`. CI
// sources the same vars from GitHub Environment secrets. Same code path
// either way.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const templatePath = resolve(root, 'wrangler.template.toml');
const outPath = resolve(root, 'wrangler.toml');

const template = readFileSync(templatePath, 'utf8');
const missing = new Set<string>();

const rendered = template.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (match, name: string) => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    missing.add(name);
    return match;
  }
  return value;
});

if (missing.size > 0) {
  throw new Error(
    `gen-wrangler: missing env vars: ${[...missing].join(', ')}. ` +
      `Set them in .env.local (local dev) or the GitHub Environment secrets (CI).`
  );
}

if (rendered.includes('${')) {
  throw new Error('gen-wrangler: unrendered ${...} placeholder survived substitution.');
}

writeFileSync(outPath, rendered);
console.log(`wrote ${outPath}`);
