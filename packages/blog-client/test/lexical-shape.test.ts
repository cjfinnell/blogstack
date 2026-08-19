import { describe, expect, it } from 'vitest';

import { assertLexicalShape, isLexicalShape, LexicalShapeError } from '../src/lexical-shape';

const paragraph = (text: string) => ({
  type: 'root',
  children: [{ type: 'paragraph', children: [{ type: 'text', text }] }],
});

describe('assertLexicalShape', () => {
  it('accepts a well-formed tree', () => {
    expect(() => {
      assertLexicalShape({ root: paragraph('Good, and it could be great.') });
    }).not.toThrow();
  });

  it('accepts the JSON-encoded form the CMS column holds', () => {
    expect(() => {
      assertLexicalShape(JSON.stringify({ root: paragraph('hello') }));
    }).not.toThrow();
  });

  it('rejects prose written straight into the field', () => {
    // The exact failure this module exists for: the renderer would pass this
    // through as raw markup and the post would look fine.
    expect(() => {
      assertLexicalShape('Good, and it could be great.');
    }).toThrow(LexicalShapeError);
  });

  it('rejects JSON that parses but has no root', () => {
    expect(() => {
      assertLexicalShape('{"children":[]}');
    }).toThrow(/needs a "root" node/);
  });

  it('rejects a root node of the wrong type', () => {
    expect(() => {
      assertLexicalShape({ root: { type: 'paragraph', children: [] } });
    }).toThrow(/must have type "root"/);
  });

  it('rejects node types the renderer would drop', () => {
    expect(() => {
      assertLexicalShape({ root: { type: 'root', children: [{ type: 'table', children: [] }] } });
    }).toThrow(/unsupported node type "table"/);
  });

  it('names the path of the offending node', () => {
    try {
      assertLexicalShape({
        root: {
          type: 'root',
          children: [
            { type: 'paragraph', children: [{ type: 'text', text: 'ok' }, { type: 'text' }] },
          ],
        },
      });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LexicalShapeError);
      expect((error as LexicalShapeError).path).toBe('root.children[0].children[1]');
    }
  });

  it('requires a heading tag of h1–h6', () => {
    expect(() => {
      assertLexicalShape({
        root: { type: 'root', children: [{ type: 'heading', tag: 'h7', children: [] }] },
      });
    }).toThrow(/tag" of h1–h6/);
  });

  it('requires a valid listType', () => {
    expect(() => {
      assertLexicalShape({
        root: { type: 'root', children: [{ type: 'list', listType: 'roman', children: [] }] },
      });
    }).toThrow(/listType/);
  });

  it('requires a link url and an image src', () => {
    expect(() => {
      assertLexicalShape({ root: { type: 'root', children: [{ type: 'link', children: [] }] } });
    }).toThrow(/non-empty "url"/);
    // A src-less image renders as nothing, so the post silently loses the photo.
    expect(() => {
      assertLexicalShape({ root: { type: 'root', children: [{ type: 'image', altText: 'x' }] } });
    }).toThrow(/non-empty "src"/);
  });

  it('rejects children on leaf nodes', () => {
    expect(() => {
      assertLexicalShape({
        root: {
          type: 'root',
          children: [{ type: 'text', text: 'a', children: [{ type: 'text', text: 'b' }] }],
        },
      });
    }).toThrow(/cannot have children/);
  });

  it('rejects a non-integer format bitfield', () => {
    expect(() => {
      assertLexicalShape({
        root: { type: 'root', children: [{ type: 'text', text: 'a', format: 'bold' }] },
      });
    }).toThrow(/bitfield/);
  });
});

describe('isLexicalShape', () => {
  it('branches instead of throwing', () => {
    expect(isLexicalShape({ root: paragraph('hi') })).toBe(true);
    expect(isLexicalShape('just prose')).toBe(false);
  });
});
