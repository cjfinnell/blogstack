import { describe, expect, it } from 'vitest';

import {
  assertContentShape,
  assertEditorHtml,
  assertLexicalShape,
  ContentShapeError,
  isContentShape,
} from '../src/content-shape';

const tree = (text: string) => ({
  root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] },
});

describe('assertContentShape', () => {
  it('accepts the editor HTML every row in the CMS actually holds', () => {
    expect(() => {
      assertContentShape('<p dir="ltr"><span style="white-space: pre-wrap;">stuff</span></p>');
    }).not.toThrow();
  });

  it('accepts a lexical tree, and its JSON encoding', () => {
    expect(() => {
      assertContentShape(tree('hello'));
    }).not.toThrow();
    expect(() => {
      assertContentShape(JSON.stringify(tree('hello')));
    }).not.toThrow();
  });

  it('rejects prose written straight into the field', () => {
    // The failure this module exists for: the renderer passes it through as
    // markup, so the post reads correctly and is wrong in the database.
    expect(() => {
      assertContentShape('Good, and it could be great.');
    }).toThrow(/no block-level markup/);
  });

  it('rejects markdown that never went through the converter', () => {
    expect(() => {
      assertContentShape('# Somebody People\n\nThe tasting menu leaned hard on acid.');
    }).toThrow(ContentShapeError);
  });

  it('rejects an empty body', () => {
    expect(() => {
      assertContentShape('   ');
    }).toThrow(/empty/);
  });

  it('rejects a value that is neither string nor tree', () => {
    expect(() => {
      assertContentShape(42);
    }).toThrow(/string or a lexical tree/);
  });

  it('rejects a JSON-looking string that does not parse', () => {
    expect(() => {
      assertContentShape('{"root": ');
    }).toThrow(/does not parse/);
  });
});

describe('assertEditorHtml', () => {
  it('rejects unbalanced markup', () => {
    expect(() => {
      assertEditorHtml('<p>one<p>');
    }).toThrow(/unclosed tag/);
    expect(() => {
      assertEditorHtml('<p>one</em></p>');
    }).toThrow(/closed by/);
    expect(() => {
      assertEditorHtml('one</p>');
    }).toThrow(/stray closing tag/);
  });

  it('rejects tags neither the editor nor the converter emits', () => {
    expect(() => {
      assertEditorHtml('<p>one</p><table><tr><td>two</td></tr></table>');
    }).toThrow(/unexpected tag <table>/);
  });

  it('allows void and self-closing tags', () => {
    expect(() => {
      assertEditorHtml('<p>one<br>two</p><figure><img src="/a.jpg" alt="" /></figure>');
    }).not.toThrow();
  });
});

describe('assertLexicalShape', () => {
  it('rejects a tree with no root', () => {
    expect(() => {
      assertLexicalShape({ children: [] });
    }).toThrow(/needs a "root" node/);
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
      expect(error).toBeInstanceOf(ContentShapeError);
      expect((error as ContentShapeError).path).toBe('root.children[0].children[1]');
    }
  });

  it('requires a heading tag, a listType, a link url and an image src', () => {
    const bad = (node: unknown) => () => {
      assertLexicalShape({ root: { type: 'root', children: [node] } });
    };
    expect(bad({ type: 'heading', tag: 'h7', children: [] })).toThrow(/tag" of h1–h6/);
    expect(bad({ type: 'list', listType: 'roman', children: [] })).toThrow(/listType/);
    expect(bad({ type: 'link', children: [] })).toThrow(/non-empty "url"/);
    // A src-less image renders as nothing, so the post silently loses the photo.
    expect(bad({ type: 'image', altText: 'x' })).toThrow(/non-empty "src"/);
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
});

describe('isContentShape', () => {
  it('branches instead of throwing', () => {
    expect(isContentShape('<p>hi</p>')).toBe(true);
    expect(isContentShape('just prose')).toBe(false);
  });
});
