// Renders SonicJS's lexical editor JSON tree to HTML.
// The public content API returns this tree as-is (no server-side HTML
// serializer is exported by @sonicjs-cms/core), so rendering happens here.

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

interface LexicalNode {
  type: string;
  children?: LexicalNode[];
  text?: string;
  format?: number;
  tag?: string;
  url?: string;
  listType?: string;
}

interface LexicalDoc {
  root: LexicalNode;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderText(node: LexicalNode): string {
  let text = escapeHtml(node.text ?? '');
  const format = node.format ?? 0;
  if (format & FORMAT_CODE) text = `<code>${text}</code>`;
  if (format & FORMAT_BOLD) text = `<strong>${text}</strong>`;
  if (format & FORMAT_ITALIC) text = `<em>${text}</em>`;
  if (format & FORMAT_UNDERLINE) text = `<u>${text}</u>`;
  if (format & FORMAT_STRIKETHROUGH) text = `<s>${text}</s>`;
  return text;
}

function renderChildren(node: LexicalNode): string {
  return (node.children ?? []).map(renderNode).join('');
}

function renderNode(node: LexicalNode): string {
  switch (node.type) {
    case 'root':
      return renderChildren(node);
    case 'paragraph':
      return `<p>${renderChildren(node)}</p>`;
    case 'heading': {
      const tag = node.tag ?? 'h2';
      return `<${tag}>${renderChildren(node)}</${tag}>`;
    }
    case 'quote':
      return `<blockquote>${renderChildren(node)}</blockquote>`;
    case 'list': {
      const tag = node.listType === 'number' ? 'ol' : 'ul';
      return `<${tag}>${renderChildren(node)}</${tag}>`;
    }
    case 'listitem':
      return `<li>${renderChildren(node)}</li>`;
    case 'link':
      return `<a href="${escapeHtml(node.url ?? '#')}">${renderChildren(node)}</a>`;
    case 'linebreak':
      return '<br />';
    case 'text':
      return renderText(node);
    default:
      return renderChildren(node);
  }
}

export function renderLexicalToHtml(content: unknown): string {
  if (!content) return '';
  let doc: LexicalDoc | null;
  if (typeof content === 'string') {
    try {
      doc = JSON.parse(content) as LexicalDoc;
    } catch {
      // Some rows predate the Lexical editor and hold raw HTML instead of a
      // Lexical JSON tree (e.g. seeded/legacy posts) — pass it through as-is
      // rather than failing the whole build over one bad row.
      return content;
    }
  } else {
    doc = content as LexicalDoc;
  }
  if (!doc?.root) return '';
  return renderNode(doc.root);
}
