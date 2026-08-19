// Validates a lexical tree before it is written to the CMS.
//
// Nothing on the write path checks this. A blog post's `content` field is typed
// `lexical` in the collection, which SonicJS stores as a JSON-encoded string and
// validates nowhere: @sonicjs-cms/core's createDocumentSchema checks the document
// envelope and treats `data` as opaque, and DocumentsService writes it through
// untouched. The MCP tool schema is no help either — its converter has no case
// for `lexical`, so the field is advertised as a plain string.
//
// The failure is silent in both directions. renderLexicalToHtml treats an
// unparseable string as legacy serialized HTML and passes it through, so prose
// written straight into the field renders as prose and looks correct; a tree that
// parses but has no `root` renders as nothing at all. Neither raises. So this is
// the only place a malformed body can be caught, and it has to be called by
// whoever is doing the writing.

import { RENDERABLE_TYPES, type LexicalDoc, type LexicalNode } from './lexical-types';

const RENDERABLE = new Set<string>(RENDERABLE_TYPES);
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const LIST_TYPES = new Set(['bullet', 'number']);

// Leaves: a `children` array on these is a sign the writer built the wrong shape,
// since the renderer would ignore it.
const LEAF_TYPES = new Set(['text', 'linebreak']);

export class LexicalShapeError extends Error {
  readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'LexicalShapeError';
    this.path = path;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNode(value: unknown, path: string): void {
  if (!isRecord(value)) throw new LexicalShapeError(path, 'node must be an object');

  const type = value.type;
  if (typeof type !== 'string' || type === '') {
    throw new LexicalShapeError(path, 'node needs a non-empty string "type"');
  }
  if (!RENDERABLE.has(type)) {
    throw new LexicalShapeError(
      path,
      `unsupported node type "${type}" — the renderer handles ${RENDERABLE_TYPES.join(', ')} and drops everything else`,
    );
  }

  switch (type) {
    case 'text': {
      if (typeof value.text !== 'string') {
        throw new LexicalShapeError(path, 'text node needs a string "text"');
      }
      const format = value.format;
      if (
        format !== undefined &&
        (typeof format !== 'number' || !Number.isInteger(format) || format < 0)
      ) {
        throw new LexicalShapeError(path, '"format" must be a non-negative integer bitfield');
      }
      break;
    }

    case 'heading':
      if (typeof value.tag !== 'string' || !HEADING_TAGS.has(value.tag)) {
        throw new LexicalShapeError(path, 'heading needs a "tag" of h1–h6');
      }
      break;

    case 'list':
      if (typeof value.listType !== 'string' || !LIST_TYPES.has(value.listType)) {
        throw new LexicalShapeError(path, 'list needs a "listType" of "bullet" or "number"');
      }
      break;

    case 'link':
      if (typeof value.url !== 'string' || value.url === '') {
        throw new LexicalShapeError(path, 'link needs a non-empty "url"');
      }
      break;

    // A src-less image renders as nothing at all rather than a broken <img>, so
    // an omitted src is a post that silently loses a photo.
    case 'image':
      if (typeof value.src !== 'string' || value.src === '') {
        throw new LexicalShapeError(path, 'image needs a non-empty "src"');
      }
      break;

    default:
      break;
  }

  const children = value.children;
  if (children === undefined) {
    if (type === 'root') throw new LexicalShapeError(path, 'root needs a "children" array');
    return;
  }
  if (!Array.isArray(children)) throw new LexicalShapeError(path, '"children" must be an array');
  if (LEAF_TYPES.has(type) && children.length > 0) {
    throw new LexicalShapeError(
      path,
      `${type} nodes cannot have children — the renderer ignores them`,
    );
  }
  children.forEach((child, i) => {
    assertNode(child, `${path}.children[${String(i)}]`);
  });
}

/**
 * Throw unless `value` is a lexical document this codebase can render.
 *
 * Accepts either the parsed tree or the JSON-encoded string the CMS field holds,
 * since callers have one or the other depending on whether they are about to
 * write or have just read.
 */
export function assertLexicalShape(value: unknown): asserts value is LexicalDoc {
  let parsed = value;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new LexicalShapeError(
        'root',
        'content is a string but not JSON — prose written straight into the field renders as raw markup, not text',
      );
    }
  }

  if (!isRecord(parsed)) throw new LexicalShapeError('root', 'document must be an object');
  if (!isRecord(parsed.root)) throw new LexicalShapeError('root', 'document needs a "root" node');
  if (parsed.root.type !== 'root')
    throw new LexicalShapeError('root', 'the "root" node must have type "root"');

  assertNode(parsed.root, 'root');
}

/** Non-throwing form, for callers that want to branch rather than fail. */
export function isLexicalShape(value: unknown): value is LexicalDoc {
  try {
    assertLexicalShape(value);
    return true;
  } catch {
    return false;
  }
}

export type { LexicalDoc, LexicalNode };
