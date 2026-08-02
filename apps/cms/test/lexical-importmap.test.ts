import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildLexicalImportMap, LEXICAL_VERSION, shouldHoist } from '../src/lexical-importmap.ts';

const require = createRequire(import.meta.url);

/** Every bare specifier core's Lexical loader imports. */
const LOADER_SPECIFIERS = [
  'lexical',
  '@lexical/rich-text',
  '@lexical/history',
  '@lexical/list',
  '@lexical/link',
  '@lexical/html',
  '@lexical/selection',
];

function coreDistFiles(): string[] {
  const dist = dirname(require.resolve('@sonicjs-cms/core'));
  return readdirSync(dist)
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(dist, f));
}

describe('lexical import map hoist', () => {
  it('pins the same Lexical version @sonicjs-cms/core resolves against', () => {
    const versions = new Set<string>();
    for (const file of coreDistFiles()) {
      for (const m of readFileSync(file, 'utf8').matchAll(/LEXICAL_VERSION = "([^"]+)"/g)) {
        versions.add(m[1]);
      }
    }
    expect(versions.size, 'core no longer declares LEXICAL_VERSION — recheck the workaround').toBe(
      1,
    );
    expect([...versions][0]).toBe(LEXICAL_VERSION);
  });

  it('remaps every specifier core imports', () => {
    const json = buildLexicalImportMap();
    const { imports } = JSON.parse(
      json.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''),
    ) as {
      imports: Record<string, string>;
    };
    expect(Object.keys(imports).sort()).toEqual([...LOADER_SPECIFIERS].sort());
    for (const [specifier, url] of Object.entries(imports)) {
      expect(url, specifier).toMatch(/^https:\/\/esm\.sh\//);
      expect(url, specifier).toContain(`@${LEXICAL_VERSION}`);
    }
  });

  it('rewrites only successful admin HTML responses', () => {
    const html = { 'content-type': 'text/html; charset=utf-8' };
    const admin = (init?: ResponseInit) => new Response('', { headers: html, ...init });

    expect(shouldHoist(new Request('https://cms.example/admin/content/new'), admin())).toBe(true);
    expect(shouldHoist(new Request('https://cms.example/api/collections'), admin())).toBe(false);
    expect(
      shouldHoist(
        new Request('https://cms.example/admin/content/new'),
        new Response('{}', { headers: { 'content-type': 'application/json' } }),
      ),
    ).toBe(false);
    expect(
      shouldHoist(
        new Request('https://cms.example/admin/nope'),
        admin({ status: 404, headers: html }),
      ),
    ).toBe(false);
  });
});
