// Converts markdown to the lexical tree SonicJS stores, so that a human can hand
// an agent prose and the agent never has to hand-build editor JSON.
//
// The target is deliberately narrow: the subset of node types renderLexicalToHtml
// actually handles. Anything richer would round-trip through the CMS and then
// vanish at render time, which is the exact silent failure this module exists to
// prevent.
//
// Two constructs are left as literal text on purpose, because this codebase
// already treats them as authoring conventions applied after rendering:
//
//   Code. The editor SonicJS loads has no code node, so fences and backticks are
//   typed as plain text and applyCodeBlocks lifts them back out of the rendered
//   HTML. Emitting a code node here would produce markup applyCodeBlocks never
//   sees. Fenced blocks therefore become one paragraph of literal lines, fences
//   included, joined by linebreaks — the shape the editor produces for
//   shift-enter, which is what applyCodeBlocks is written against.
//
//   Footnotes. `[^1]` markers and the trailing `Notes` heading plus ordered list
//   are rewritten into linked superscripts by applyFootnotes, again after
//   rendering. They pass through here as ordinary text, heading and list nodes.

import {
  FORMAT_BOLD,
  FORMAT_ITALIC,
  FORMAT_STRIKETHROUGH,
  type LexicalDoc,
  type LexicalNode,
} from './lexical-types';

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

function text(value: string, format: number): LexicalNode {
  return format === 0 ? { type: 'text', text: value } : { type: 'text', text: value, format };
}

/**
 * Parse one line's inline markup into text and link nodes.
 *
 * `format` is the bitfield inherited from any enclosing emphasis, so nesting
 * composes: `**bold and *also italic***` yields a text node with both bits set.
 */
function parseInline(source: string, format = 0): LexicalNode[] {
  const out: LexicalNode[] = [];
  let buffer = '';
  let i = 0;

  const flush = (): void => {
    if (buffer !== '') {
      out.push(text(buffer, format));
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

    // An image that is not alone on its line stays literal: the renderer wraps
    // images in <figure>, which cannot legally sit inside the <p> a paragraph
    // becomes. Keeping the markdown visible is a defect the author can see and
    // move to its own line, rather than invalid markup they cannot.
    const inlineImage = INLINE_IMAGE.exec(rest);
    if (inlineImage) {
      buffer += inlineImage[0];
      i += inlineImage[0].length;
      continue;
    }

    const bold = BOLD.exec(rest);
    if (bold?.[1] !== undefined) {
      flush();
      out.push(...parseInline(bold[1], format | FORMAT_BOLD));
      i += bold[0].length;
      continue;
    }

    const strike = STRIKETHROUGH.exec(rest);
    if (strike?.[1] !== undefined) {
      flush();
      out.push(...parseInline(strike[1], format | FORMAT_STRIKETHROUGH));
      i += strike[0].length;
      continue;
    }

    const italic = ITALIC_STAR.exec(rest) ?? ITALIC_UNDERSCORE.exec(rest);
    if (italic?.[1] !== undefined) {
      flush();
      out.push(...parseInline(italic[1], format | FORMAT_ITALIC));
      i += italic[0].length;
      continue;
    }

    const link = LINK.exec(rest);
    if (link?.[1] !== undefined && link[2] !== undefined) {
      flush();
      out.push({ type: 'link', url: link[2], children: parseInline(link[1], format) });
      i += link[0].length;
      continue;
    }

    buffer += source[i] ?? '';
    i += 1;
  }

  flush();
  return out;
}

/** Inline-parse several lines into one node list, separated by linebreaks. */
function parseInlineLines(lines: string[], format = 0): LexicalNode[] {
  const out: LexicalNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push({ type: 'linebreak' });
    out.push(...parseInline(line, format));
  });
  return out;
}

function isBlank(line: string): boolean {
  return line.trim() === '';
}

/**
 * Convert markdown to a lexical document.
 *
 * Supported: ATX headings, paragraphs, blockquotes, bullet and numbered lists,
 * standalone images, bold, italic, strikethrough, links, backslash escapes, and
 * fenced code blocks (as literal text — see the module comment).
 *
 * Not supported, by design: nested lists, tables, inline HTML, horizontal rules,
 * and setext headings. These have no node type the renderer can turn into markup,
 * so they arrive as ordinary paragraph text rather than disappearing.
 */
export function markdownToLexical(markdown: string): LexicalDoc {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const children: LexicalNode[] = [];
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
      children.push({
        type: 'paragraph',
        children: block.flatMap((codeLine, n) =>
          n === 0 ? [text(codeLine, 0)] : [{ type: 'linebreak' }, text(codeLine, 0)],
        ),
      });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading?.[1] !== undefined && heading[2] !== undefined) {
      children.push({
        type: 'heading',
        tag: `h${String(heading[1].length)}`,
        children: parseInline(heading[2]),
      });
      i += 1;
      continue;
    }

    const image = IMAGE_LINE.exec(line);
    if (image?.[2] !== undefined) {
      const node: LexicalNode = { type: 'image', src: image[2], altText: image[1] ?? '' };
      if (image[3]) node.caption = image[3];
      children.push(node);
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
      children.push({ type: 'quote', children: parseInlineLines(quoted) });
      continue;
    }

    const bullet = BULLET_ITEM.exec(line);
    const numbered = NUMBER_ITEM.exec(line);
    if (bullet ?? numbered) {
      const listType = bullet ? 'bullet' : 'number';
      const pattern = bullet ? BULLET_ITEM : NUMBER_ITEM;
      const items: LexicalNode[] = [];
      while (i < lines.length) {
        const match = pattern.exec(lines[i] ?? '');
        if (!match) break;
        items.push({ type: 'listitem', children: parseInline(match[1] ?? '') });
        i += 1;
      }
      children.push({ type: 'list', listType, children: items });
      continue;
    }

    // Paragraph: everything up to the next blank line or block-level construct.
    // A hard line break inside one becomes a linebreak node, matching what the
    // editor produces for shift-enter.
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
    children.push({ type: 'paragraph', children: parseInlineLines(paragraph) });
  }

  return { root: { type: 'root', children } };
}

/**
 * The value to write into a post's `content` field: the tree, JSON-encoded.
 *
 * The CMS column holds a string, not an object, so writing the tree itself
 * produces a row the renderer reads as `[object Object]`.
 */
export function markdownToLexicalJson(markdown: string): string {
  return JSON.stringify(markdownToLexical(markdown));
}
