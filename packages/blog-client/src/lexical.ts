// Renders SonicJS's lexical editor JSON tree to HTML.
// The public content API returns this tree as-is (no server-side HTML
// serializer is exported by @sonicjs-cms/core), so rendering happens here.

import { applyCodeBlocks } from './codeblocks';
import { applyFootnotes } from './footnotes';

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
  src?: string;
  altText?: string;
  caption?: string;
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
    case 'image': {
      // No src means nothing renderable — emit nothing rather than a broken
      // <img> that shows as a torn-page icon on the reader's page.
      if (!node.src) return '';
      const alt = escapeHtml(node.altText ?? '');
      const caption = node.caption ? `<figcaption>${escapeHtml(node.caption)}</figcaption>` : '';
      return `<figure><img src="${escapeHtml(node.src)}" alt="${alt}" loading="lazy" />${caption}</figure>`;
    }
    case 'text':
      return renderText(node);
    default:
      return renderChildren(node);
  }
}

function postProcess(html: string): string {
  return applyFootnotes(applyCodeBlocks(html));
}

export function renderLexicalToHtml(content: unknown): string {
  if (!content) return '';
  let parsed: unknown;
  if (typeof content === 'string') {
    try {
      parsed = JSON.parse(content);
    } catch {
      // The editor saves serialized HTML, not a Lexical JSON tree, and some
      // rows predate the editor entirely — take the markup as the rendered
      // output rather than failing the whole build over one unparseable row.
      return postProcess(content);
    }
  } else {
    parsed = content;
  }
  // `content` (and JSON.parse's result) come from outside this module with
  // no schema guarantee, so root's presence has to be checked at runtime
  // rather than assumed via a type cast.
  if (typeof parsed !== 'object' || parsed === null || !('root' in parsed) || !parsed.root) {
    return '';
  }
  const doc = parsed as LexicalDoc;
  return postProcess(renderNode(doc.root));
}
