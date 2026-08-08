// Lexical has no code node (SonicJS's editor loads rich-text/list/link only),
// so code is an authoring convention: markdown fences and backticks typed as
// plain text. This lifts them back out of the rendered HTML.
//
// Fenced lines arrive either as <br>-separated lines inside one paragraph
// (shift-enter) or as consecutive paragraphs (enter), so the scan carries its
// open-fence state across paragraph boundaries.

const PARAGRAPH = /(<p\b[^>]*>)([\s\S]*?)<\/p>/g;
const LINE_BREAK = /<br\s*\/?>/;
const TAG = /(<[^>]+>)/;
const FENCE = /^```([A-Za-z0-9+#._-]*)\s*$/;
const INLINE_CODE = /`([^`\n]+)`/g;

interface Paragraph {
  kind: 'paragraph';
  open: string;
  lines: string[];
}

interface Raw {
  kind: 'raw';
  html: string;
}

type Chunk = Paragraph | Raw;

function splitChunks(html: string): Chunk[] {
  const chunks: Chunk[] = [];
  let cursor = 0;
  PARAGRAPH.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PARAGRAPH.exec(html)) !== null) {
    if (match.index > cursor) chunks.push({ kind: 'raw', html: html.slice(cursor, match.index) });
    // Both PARAGRAPH capture groups are non-optional in the pattern, but
    // indexed access is typed as possibly undefined regardless.
    chunks.push({
      kind: 'paragraph',
      open: match[1] ?? '',
      lines: (match[2] ?? '').split(LINE_BREAK),
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < html.length) chunks.push({ kind: 'raw', html: html.slice(cursor) });
  return chunks;
}

function textOf(lineHtml: string): string {
  return lineHtml.replace(/<[^>]+>/g, '');
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Only text between tags is rewritten, so a backtick inside an attribute
// value can never be mistaken for a delimiter.
function applyInlineCode(lineHtml: string): string {
  return lineHtml
    .split(TAG)
    .map((part) => (part.startsWith('<') ? part : part.replace(INLINE_CODE, '<code>$1</code>')))
    .join('');
}

// Blank lines that used to sit against a fence would otherwise survive as
// stray <br>s once the fence itself becomes its own block.
function trimBlankEdges(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && textOf(lines[start] ?? '').trim() === '') start++;
  while (end > start && textOf(lines[end - 1] ?? '').trim() === '') end--;
  return lines.slice(start, end);
}

function renderParagraph(open: string, lines: string[]): string {
  const inner = trimBlankEdges(lines).map(applyInlineCode).join('<br>');
  if (textOf(inner).trim() === '' && !inner.includes('<img')) return '';
  return `${open}${inner}</p>`;
}

function renderCodeBlock(lang: string, lines: string[]): string {
  const code = escapeHtml(unescapeHtml(lines.join('\n')));
  const attr = lang ? ` class="language-${lang}"` : '';
  return `<pre><code${attr}>${code}</code></pre>`;
}

export function applyCodeBlocks(html: string): string {
  if (!html.includes('`')) return html;

  const out: string[] = [];
  let pending: string[] = [];
  let pendingOpen = '<p>';
  let fenceLang: string | null = null;
  let fenceLines: string[] = [];

  const flushParagraph = () => {
    if (pending.length > 0) out.push(renderParagraph(pendingOpen, pending));
    pending = [];
  };

  for (const chunk of splitChunks(html)) {
    if (chunk.kind === 'raw') {
      // A block element (heading, list, image) interrupting an open fence
      // means the fence was never closed — fall back to literal text.
      if (fenceLang !== null && chunk.html.trim() !== '') {
        pending.push(`\`\`\`${fenceLang}`, ...fenceLines);
        fenceLang = null;
        fenceLines = [];
      }
      flushParagraph();
      out.push(chunk.html);
      continue;
    }

    pendingOpen = chunk.open;
    for (const line of chunk.lines) {
      const fence = FENCE.exec(textOf(line).trim());
      if (fenceLang === null) {
        if (fence) {
          flushParagraph();
          // FENCE's capture group is `*` (may be empty) but always present
          // once the pattern matches at all.
          fenceLang = fence[1] ?? '';
          fenceLines = [];
        } else {
          pending.push(line);
        }
      } else if (fence) {
        out.push(renderCodeBlock(fenceLang, fenceLines));
        fenceLang = null;
        fenceLines = [];
      } else {
        fenceLines.push(textOf(line));
      }
    }
    flushParagraph();
  }

  // Unclosed fence at end of document: emit the collected lines as text
  // rather than swallowing the rest of the post into a code block.
  if (fenceLang !== null)
    out.push(renderParagraph(pendingOpen, [`\`\`\`${fenceLang}`, ...fenceLines]));
  flushParagraph();

  return out.join('');
}
