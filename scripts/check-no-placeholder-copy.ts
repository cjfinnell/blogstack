// Second net under the placeholder guard.
//
// `assertNoPlaceholders` already fails a production build whose site settings
// are unfilled, but it only sees the settings object. This walks the built
// output instead, so a placeholder that reached the page by any other route —
// a hardcoded string, a seeded fixture row, a component written before the
// convention existed — fails the deploy rather than going live.
//
// Usage: tsx scripts/check-no-placeholder-copy.ts <dist-dir>

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PLACEHOLDER_MARKER } from '../packages/blog-client/src/placeholders.ts';

const TEXT_EXTENSIONS = ['.html', '.xml', '.json', '.txt', '.js', '.css'];

const dir = process.argv[2];
if (!dir) {
  console.error('usage: check-no-placeholder-copy.ts <dist-dir>');
  process.exit(2);
}

const root = resolve(dir);

function* walk(current: string): Generator<string> {
  for (const entry of readdirSync(current)) {
    const path = join(current, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
      continue;
    }
    if (TEXT_EXTENSIONS.some((ext) => path.endsWith(ext))) yield path;
  }
}

const offenders: string[] = [];
for (const file of walk(root)) {
  const contents = readFileSync(file, 'utf8');
  if (contents.includes(PLACEHOLDER_MARKER)) offenders.push(file.slice(root.length + 1));
}

if (offenders.length > 0) {
  console.error(
    `Placeholder copy reached the build output in ${String(offenders.length)} file(s):\n` +
      offenders.map((f) => `  ${f}`).join('\n') +
      `\n\nEvery readable string comes from the CMS \`site_settings\` collection. A "${PLACEHOLDER_MARKER}"` +
      ' marker means a setting was never filled in, and none of that text was written by the' +
      ' site owner — so it must not ship. Fill the setting in the CMS and rebuild.',
  );
  process.exit(1);
}

console.log(`No placeholder copy in ${root}.`);
