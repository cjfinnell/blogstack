// Runs at build time only (SSG), so Shiki's cost never reaches the reader and
// no highlighter script ships to the browser.

import { bundledLanguages, codeToHtml, type BundledLanguage, type BundledTheme } from 'shiki';

const CODE_BLOCK = /<pre><code(?: class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g;

export interface HighlightOptions {
  light: BundledTheme;
  dark: BundledTheme;
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function resolveLang(lang: string | undefined): BundledLanguage | 'text' {
  if (!lang) return 'text';
  const key = lang.toLowerCase();
  return key in bundledLanguages ? (key as BundledLanguage) : 'text';
}

export async function highlightCodeBlocks(
  html: string,
  { light, dark }: HighlightOptions,
): Promise<string> {
  const blocks = [...html.matchAll(CODE_BLOCK)];
  if (blocks.length === 0) return html;

  const rendered = await Promise.all(
    blocks.map((block) =>
      codeToHtml(decode(block[2]), {
        lang: resolveLang(block[1]),
        themes: { light, dark },
        defaultColor: false,
      }),
    ),
  );

  let cursor = 0;
  let out = '';
  blocks.forEach((block, i) => {
    out += html.slice(cursor, block.index) + rendered[i];
    cursor = block.index + block[0].length;
  });
  return out + html.slice(cursor);
}
