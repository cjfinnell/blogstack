// Converts markdown to the HTML the SonicJS editor stores, so that a human can
// hand an agent prose and the agent never has to hand-build editor internals.
//
// The target is HTML because that is what the editor actually writes. Every row
// in the CMS holds serialized markup — `<p dir="ltr"><span style="white-space:
// pre-wrap;">…</span></p>` — not a lexical JSON tree. renderLexicalToHtml calls
// that the fallback path, but it is the only path any real post takes; the
// trees in the test fixtures are hand-written and have no counterpart in the
// database. Emitting a tree instead would render fine on the site and then
// diverge from the editor the moment an author opened the post to amend it.
//
// What we do not reproduce is the editor's export noise: the `dir="ltr"`
// attributes and `white-space: pre-wrap` spans are artifacts of how lexical
// serializes, not something its importer needs. Bare tags matter for a second
// reason — applyFootnotes matches `<h[1-6]>Notes</h[1-6]>` and `<ol>` with no
// attributes at all, so decorating those tags would silently switch footnotes
// off.
//
// Two constructs stay literal text, because both are authoring conventions this
// codebase applies after rendering rather than node types:
//
//   Code. The editor has no code node, so fences and backticks are typed as
//   plain text and applyCodeBlocks lifts them back out of the rendered HTML.
//   Fenced blocks therefore become one paragraph of literal lines joined by
//   <br>, which is both what the editor produces for shift-enter and what
//   applyCodeBlocks is written to scan.
//
//   Footnotes. `[^1]` markers and a trailing `Notes` heading plus ordered list
//   are rewritten into linked superscripts by applyFootnotes, again after
//   rendering. They pass through here as ordinary text, heading and list markup.

const HEADING = /^(#{1,6})\s+(.*)$/;
const BLOCKQUOTE = /^>\s?(.*)$/;
const BULLET_ITEM = /^[-*+]\s+(.*)$/;
const NUMBER_ITEM = /^\d+[.)]\s+(.*)$/;
const IMAGE_LINE = /^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)\s*$/;

// Inline patterns, tried in this order. Bold before italic, so `**x**` is not
// read as an empty emphasis; the image guard before the link pattern, so the
// `[alt](src)` tail of an inline image is not lifted out as a link.
const ESCAPED = /^\\([\\`*_~[\]()!#>-])/;
const INLINE_IMAGE = /^!\[[^\]]*\]\([^)]*\)/;
// The lookahead makes the lazy close skip past a longer delimiter run, so
// `**bold and *both***` closes on the last two asterisks and leaves the inner
// `*both*` for the italic pass. Without it the close lands mid-run and the
// emphasis leaks into the text as a stray asterisk.
const BOLD = /^\*\*([\s\S]+?)\*\*(?!\*)/;
const STRIKETHROUGH = /^~~([\s\S]+?)~~(?!~)/;
const ITALIC_STAR = /^\*([^*\n]+)\*/;
const ITALIC_UNDERSCORE = /^_([^_\n]+)_/;
const LINK = /^\[([^\]]*)\]\(([^)\s]+)\)/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Render one line's inline markup. Emphasis nests as markup rather than bitfields. */
function inlineToHtml(source: string): string {
  let out = '';
  let buffer = '';
  let i = 0;

  const flush = (): void => {
    if (buffer !== '') {
      out += escapeHtml(buffer);
      buffer = '';
    }
  };

  while (i < source.length) {
    const rest = source.slice(i);

    const escaped = ESCAPED.exec(rest);
    if (escaped) {
      buffer += escaped[1] ?? '';
      i += escaped[0].length;
      continue;
    }

    // An image that is not alone on its line stays literal: images render as a
    // <figure>, which cannot legally sit inside the <p> a paragraph becomes.
    // Visible markdown is a defect the author can see and move to its own line;
    // invalid markup is not.
    const inlineImage = INLINE_IMAGE.exec(rest);
    if (inlineImage) {
      buffer += inlineImage[0];
      i += inlineImage[0].length;
      continue;
    }

    const bold = BOLD.exec(rest);
    if (bold?.[1] !== undefined) {
      flush();
      out += `<strong>${inlineToHtml(bold[1])}</strong>`;
      i += bold[0].length;
      continue;
    }

    const strike = STRIKETHROUGH.exec(rest);
    if (strike?.[1] !== undefined) {
      flush();
      out += `<s>${inlineToHtml(strike[1])}</s>`;
      i += strike[0].length;
      continue;
    }

    const italic = ITALIC_STAR.exec(rest) ?? ITALIC_UNDERSCORE.exec(rest);
    if (italic?.[1] !== undefined) {
      flush();
      out += `<em>${inlineToHtml(italic[1])}</em>`;
      i += italic[0].length;
      continue;
    }

    const link = LINK.exec(rest);
    if (link?.[1] !== undefined && link[2] !== undefined) {
      flush();
      out += `<a href="${escapeHtml(link[2])}">${inlineToHtml(link[1])}</a>`;
      i += link[0].length;
      continue;
    }

    buffer += source[i] ?? '';
    i += 1;
  }

  flush();
  return out;
}

function inlineLinesToHtml(lines: string[]): string {
  return lines.map((line) => inlineToHtml(line)).join('<br>');
}

function isBlank(line: string): boolean {
  return line.trim() === '';
}

/**
 * Convert markdown to the editor's HTML.
 *
 * Supported: ATX headings, paragraphs, blockquotes, bullet and numbered lists,
 * standalone images, bold, italic, strikethrough, links, backslash escapes, and
 * fenced code blocks (as literal text — see the module comment).
 *
 * Not supported, by design: nested lists, tables, inline HTML, horizontal rules,
 * and setext headings. These arrive as ordinary paragraph text rather than
 * disappearing, so an author can see what was not understood.
 */
export function markdownToEditorHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (isBlank(line)) {
      i += 1;
      continue;
    }

    // Fenced code: consume to the closing fence, or to the end of input if the
    // author never closed it, and keep every line verbatim.
    if (line.startsWith('```')) {
      const block: string[] = [line];
      i += 1;
      while (i < lines.length) {
        const next = lines[i] ?? '';
        block.push(next);
        i += 1;
        if (next.startsWith('```')) break;
      }
      blocks.push(`<p>${block.map((codeLine) => escapeHtml(codeLine)).join('<br>')}</p>`);
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading?.[1] !== undefined && heading[2] !== undefined) {
      const level = heading[1].length;
      blocks.push(`<h${String(level)}>${inlineToHtml(heading[2])}</h${String(level)}>`);
      i += 1;
      continue;
    }

    const image = IMAGE_LINE.exec(line);
    if (image?.[2] !== undefined) {
      const caption = image[3] ? `<figcaption>${escapeHtml(image[3])}</figcaption>` : '';
      blocks.push(
        `<figure><img src="${escapeHtml(image[2])}" alt="${escapeHtml(image[1] ?? '')}" loading="lazy" />${caption}</figure>`,
      );
      i += 1;
      continue;
    }

    if (BLOCKQUOTE.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length) {
        const match = BLOCKQUOTE.exec(lines[i] ?? '');
        if (!match) break;
        quoted.push(match[1] ?? '');
        i += 1;
      }
      blocks.push(`<blockquote>${inlineLinesToHtml(quoted)}</blockquote>`);
      continue;
    }

    const bullet = BULLET_ITEM.exec(line);
    const numbered = NUMBER_ITEM.exec(line);
    if (bullet ?? numbered) {
      const tag = bullet ? 'ul' : 'ol';
      const pattern = bullet ? BULLET_ITEM : NUMBER_ITEM;
      const items: string[] = [];
      while (i < lines.length) {
        const match = pattern.exec(lines[i] ?? '');
        if (!match) break;
        items.push(`<li>${inlineToHtml(match[1] ?? '')}</li>`);
        i += 1;
      }
      blocks.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    // Paragraph: everything up to the next blank line or block-level construct.
    // A soft line break inside one becomes <br>, matching what the editor writes
    // for shift-enter.
    const paragraph: string[] = [];
    while (i < lines.length) {
      const next = lines[i] ?? '';
      if (
        isBlank(next) ||
        next.startsWith('```') ||
        HEADING.test(next) ||
        BLOCKQUOTE.test(next) ||
        BULLET_ITEM.test(next) ||
        NUMBER_ITEM.test(next) ||
        IMAGE_LINE.test(next)
      ) {
        break;
      }
      paragraph.push(next);
      i += 1;
    }
    blocks.push(`<p>${inlineLinesToHtml(paragraph)}</p>`);
  }

  return blocks.join('');
}
