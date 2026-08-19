// Validates a post body before it is written to the CMS.
//
// Nothing on the write path checks this. A blog post's `content` field is typed
// `lexical` in the collection, which SonicJS validates nowhere:
// @sonicjs-cms/core's createDocumentSchema checks the document envelope and
// treats `data` as opaque, and DocumentsService writes it through untouched. The
// MCP tool schema is no help either — its converter has no case for `lexical`,
// so the field is advertised to clients as a plain string.
//
// The stored value has two legal forms and the renderer accepts both. The editor
// writes serialized HTML, which is what every row in the CMS actually holds;
// renderLexicalToHtml also parses a lexical JSON tree, which is what the test
// fixtures use. Both render. What neither tolerates is prose: plain text falls
// through renderLexicalToHtml's HTML branch and is emitted as markup, so an
// unconverted body looks correct on the page and is wrong in the database.
// Catching that is this module's job, and it has to be called by whoever writes.

import { RENDERABLE_TYPES, type LexicalDoc, type LexicalNode } from './lexical-types';

const RENDERABLE = new Set<string>(RENDERABLE_TYPES);
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const LIST_TYPES = new Set(['bullet', 'number']);

// Leaves: a `children` array on these is a sign the writer built the wrong shape,
// since the renderer would ignore it.
const LEAF_TYPES = new Set(['text', 'linebreak']);

// Tags the editor emits or the converter produces. Anything outside this set is
// markup neither wrote, which means nobody has checked how it renders.
const ALLOWED_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'figure',
  'figcaption',
  'img',
  'br',
  'hr',
  'a',
  'strong',
  'b',
  'em',
  'i',
  's',
  'strike',
  'u',
  'code',
  'pre',
  'span',
  'sup',
  'sub',
]);

const VOID_TAGS = new Set(['br', 'img', 'hr']);

// At least one of these must be present, which is what separates real markup
// from prose that happens to contain an angle bracket.
const BLOCK_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'blockquote',
  'figure',
  'pre',
]);

const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;

export class ContentShapeError extends Error {
  readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'ContentShapeError';
    this.path = path;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNode(value: unknown, path: string): void {
  if (!isRecord(value)) throw new ContentShapeError(path, 'node must be an object');

  const type = value.type;
  if (typeof type !== 'string' || type === '') {
    throw new ContentShapeError(path, 'node needs a non-empty string "type"');
  }
  if (!RENDERABLE.has(type)) {
    throw new ContentShapeError(
      path,
      `unsupported node type "${type}" — the renderer handles ${RENDERABLE_TYPES.join(', ')} and drops everything else`,
    );
  }

  switch (type) {
    case 'text': {
      if (typeof value.text !== 'string') {
        throw new ContentShapeError(path, 'text node needs a string "text"');
      }
      const format = value.format;
      if (
        format !== undefined &&
        (typeof format !== 'number' || !Number.isInteger(format) || format < 0)
      ) {
        throw new ContentShapeError(path, '"format" must be a non-negative integer bitfield');
      }
      break;
    }

    case 'heading':
      if (typeof value.tag !== 'string' || !HEADING_TAGS.has(value.tag)) {
        throw new ContentShapeError(path, 'heading needs a "tag" of h1–h6');
      }
      break;

    case 'list':
      if (typeof value.listType !== 'string' || !LIST_TYPES.has(value.listType)) {
        throw new ContentShapeError(path, 'list needs a "listType" of "bullet" or "number"');
      }
      break;

    case 'link':
      if (typeof value.url !== 'string' || value.url === '') {
        throw new ContentShapeError(path, 'link needs a non-empty "url"');
      }
      break;

    // A src-less image renders as nothing at all rather than a broken <img>, so
    // an omitted src is a post that silently loses a photo.
    case 'image':
      if (typeof value.src !== 'string' || value.src === '') {
        throw new ContentShapeError(path, 'image needs a non-empty "src"');
      }
      break;

    default:
      break;
  }

  const children = value.children;
  if (children === undefined) {
    if (type === 'root') throw new ContentShapeError(path, 'root needs a "children" array');
    return;
  }
  if (!Array.isArray(children)) throw new ContentShapeError(path, '"children" must be an array');
  if (LEAF_TYPES.has(type) && children.length > 0) {
    throw new ContentShapeError(
      path,
      `${type} nodes cannot have children — the renderer ignores them`,
    );
  }
  children.forEach((child, i) => {
    assertNode(child, `${path}.children[${String(i)}]`);
  });
}

/** Throw unless `value` is a lexical tree this codebase can render. */
export function assertLexicalShape(value: unknown): asserts value is LexicalDoc {
  if (!isRecord(value)) throw new ContentShapeError('root', 'document must be an object');
  if (!isRecord(value.root)) throw new ContentShapeError('root', 'document needs a "root" node');
  if (value.root.type !== 'root') {
    throw new ContentShapeError('root', 'the "root" node must have type "root"');
  }
  assertNode(value.root, 'root');
}

/**
 * Throw unless `html` is the kind of markup the editor stores.
 *
 * Deliberately structural rather than a parse: balanced tags drawn from the set
 * the editor and the converter emit, and at least one block-level element. That
 * is enough to reject the two failures that actually happen — prose written
 * straight into the field, and markdown that never went through the converter —
 * without pretending to be an HTML validator.
 */
export function assertEditorHtml(html: string): void {
  if (html.trim() === '') throw new ContentShapeError('content', 'content is empty');

  const stack: string[] = [];
  let sawBlock = false;
  let match: RegExpExecArray | null;

  TAG.lastIndex = 0;
  while ((match = TAG.exec(html)) !== null) {
    const raw = match[0];
    const name = (match[1] ?? '').toLowerCase();
    const selfClosing = match[2] === '/';
    const closing = raw.startsWith('</');

    if (!ALLOWED_TAGS.has(name)) {
      throw new ContentShapeError('content', `unexpected tag <${name}>`);
    }
    if (BLOCK_TAGS.has(name)) sawBlock = true;
    if (VOID_TAGS.has(name) || selfClosing) continue;

    if (closing) {
      const open = stack.pop();
      if (open !== name) {
        throw new ContentShapeError(
          'content',
          open === undefined
            ? `stray closing tag </${name}>`
            : `tag <${open}> closed by </${name}>`,
        );
      }
      continue;
    }
    stack.push(name);
  }

  if (stack.length > 0) {
    throw new ContentShapeError('content', `unclosed tag <${stack[stack.length - 1] ?? ''}>`);
  }
  if (!sawBlock) {
    throw new ContentShapeError(
      'content',
      'no block-level markup — prose written straight into the field is stored as-is and rendered as raw markup',
    );
  }
}

/**
 * Throw unless `value` is something the renderer can turn into a page: the
 * editor's HTML, or a lexical tree, or the JSON encoding of one.
 *
 * This is the check to call before writing a post body.
 */
export function assertContentShape(value: unknown): void {
  if (isRecord(value)) {
    assertLexicalShape(value);
    return;
  }

  if (typeof value !== 'string') {
    throw new ContentShapeError('content', 'content must be a string or a lexical tree');
  }

  // A JSON-looking string is a tree someone already encoded; anything else is
  // markup. Prose is neither, and fails whichever branch it lands in.
  const trimmed = value.trim();
  if (trimmed.startsWith('{')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new ContentShapeError('content', 'content starts like JSON but does not parse');
    }
    assertLexicalShape(parsed);
    return;
  }

  assertEditorHtml(value);
}

/** Non-throwing form, for callers that want to branch rather than fail. */
export function isContentShape(value: unknown): boolean {
  try {
    assertContentShape(value);
    return true;
  } catch {
    return false;
  }
}

export type { LexicalDoc, LexicalNode };
