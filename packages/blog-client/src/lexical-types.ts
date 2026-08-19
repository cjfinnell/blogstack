// The lexical tree as it is actually stored by SonicJS and consumed here.
//
// These live in their own module because three sides now depend on the same
// shape: the renderer reads it, the markdown converter writes it, and the shape
// assertion checks it. A second hand-written copy of this interface would drift,
// and the drift would surface as a post that renders blank.

export interface LexicalNode {
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

export interface LexicalDoc {
  root: LexicalNode;
}

// Lexical stores inline styling as a bitfield on the text node. Only these five
// bits exist in the editor SonicJS loads; the renderer honours all of them.
export const FORMAT_BOLD = 1;
export const FORMAT_ITALIC = 2;
export const FORMAT_STRIKETHROUGH = 4;
export const FORMAT_UNDERLINE = 8;
export const FORMAT_CODE = 16;

// Every node type the renderer in lexical.ts handles by name. Anything outside
// this set falls through to its default branch, which renders the node's
// children and silently drops the node itself.
export const RENDERABLE_TYPES = [
  'root',
  'paragraph',
  'heading',
  'quote',
  'list',
  'listitem',
  'link',
  'image',
  'text',
  'linebreak',
] as const;

export type RenderableType = (typeof RENDERABLE_TYPES)[number];
