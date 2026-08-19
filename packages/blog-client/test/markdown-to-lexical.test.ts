import { describe, expect, it } from 'vitest';

import { assertLexicalShape } from '../src/lexical-shape';
import { renderLexicalToHtml } from '../src/lexical';
import { markdownToLexical, markdownToLexicalJson } from '../src/markdown-to-lexical';

/**
 * Most of these assert on rendered HTML rather than tree internals. The tree is
 * an intermediate nobody reads; what matters is that the markdown a human wrote
 * survives the round trip to the page, so the round trip is what is pinned.
 */
function render(markdown: string): string {
  const doc = markdownToLexical(markdown);
  assertLexicalShape(doc);
  return renderLexicalToHtml(doc);
}

describe('markdownToLexical', () => {
  it('renders paragraphs', () => {
    expect(render('The tasting menu leaned hard on acid.')).toBe(
      '<p>The tasting menu leaned hard on acid.</p>',
    );
  });

  it('separates paragraphs on blank lines and joins soft-wrapped lines with a break', () => {
    expect(render('one\ntwo\n\nthree')).toBe('<p>one<br />two</p><p>three</p>');
  });

  it('renders headings at every level', () => {
    expect(render('# One')).toBe('<h1>One</h1>');
    expect(render('###### Six')).toBe('<h6>Six</h6>');
  });

  it('renders bold, italic and strikethrough', () => {
    expect(render('**bold** and *italic* and _also italic_ and ~~gone~~')).toBe(
      '<p><strong>bold</strong> and <em>italic</em> and <em>also italic</em> and <s>gone</s></p>',
    );
  });

  it('composes nested emphasis into one format bitfield', () => {
    // Both bits land on the one text node; the renderer's own wrapping order
    // decides that <em> ends up outside <strong>.
    expect(render('**bold and *both***')).toBe(
      '<p><strong>bold and </strong><em><strong>both</strong></em></p>',
    );
  });

  it('renders links, escaping the href', () => {
    expect(render('see [the menu](https://example.test/menu?a=1&b=2)')).toBe(
      '<p>see <a href="https://example.test/menu?a=1&amp;b=2">the menu</a></p>',
    );
  });

  it('renders a standalone image as a figure, with an optional caption', () => {
    expect(render('![The focaccia](/media/focaccia.jpg)')).toBe(
      '<figure><img src="/media/focaccia.jpg" alt="The focaccia" loading="lazy" /></figure>',
    );
    expect(render('![Alt](/m/a.jpg "House focaccia")')).toBe(
      '<figure><img src="/m/a.jpg" alt="Alt" loading="lazy" /><figcaption>House focaccia</figcaption></figure>',
    );
  });

  it('leaves an inline image literal rather than putting a figure inside a paragraph', () => {
    // <figure> inside <p> is invalid markup the author cannot see; visible
    // markdown is a defect they can.
    expect(render('a photo ![Alt](/m/a.jpg) mid-sentence')).toBe(
      '<p>a photo ![Alt](/m/a.jpg) mid-sentence</p>',
    );
  });

  it('renders blockquotes, merging consecutive quoted lines', () => {
    expect(render('> Good, and it could be great.\n> Skip the tasting menu.')).toBe(
      '<blockquote>Good, and it could be great.<br />Skip the tasting menu.</blockquote>',
    );
  });

  it('renders bullet and numbered lists', () => {
    expect(render('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
    expect(render('1. one\n2. two')).toBe('<ol><li>one</li><li>two</li></ol>');
  });

  it('starts a list without needing a blank line after a paragraph', () => {
    expect(render('We ordered:\n- focaccia')).toBe('<p>We ordered:</p><ul><li>focaccia</li></ul>');
  });

  it('honours backslash escapes', () => {
    expect(render('a literal \\*asterisk\\* here')).toBe('<p>a literal *asterisk* here</p>');
  });

  it('escapes HTML in text', () => {
    expect(render('1 < 2 & "quoted"')).toBe('<p>1 &lt; 2 &amp; &quot;quoted&quot;</p>');
  });

  describe('code, which is an authoring convention rather than a node type', () => {
    it('keeps a fenced block as literal lines so applyCodeBlocks can lift it', () => {
      const html = render('```ts\nconst a = 1;\n```');
      expect(html).toContain('<pre');
      expect(html).toContain('const a = 1;');
    });

    it('keeps an unterminated fence rather than swallowing the rest of the post', () => {
      const doc = markdownToLexical('```\nconst a = 1;');
      const paragraph = doc.root.children?.[0];
      expect(paragraph?.type).toBe('paragraph');
      expect(paragraph?.children?.filter((n) => n.type === 'text').map((n) => n.text)).toEqual([
        '```',
        'const a = 1;',
      ]);
    });

    it('leaves inline backticks alone', () => {
      expect(render('call `render()` first')).toBe('<p>call <code>render()</code> first</p>');
    });
  });

  it('passes footnote markers and the Notes section through for applyFootnotes', () => {
    const html = render(
      'The tasting menu leaned hard on acid[^1].\n\n## Notes\n\n1. Every course but dessert.',
    );
    expect(html).toContain('<sup');
    expect(html).not.toContain('[^1]');
  });

  it('produces an empty document for empty input', () => {
    expect(markdownToLexical('')).toEqual({ root: { type: 'root', children: [] } });
    expect(render('')).toBe('');
  });

  it('normalises CRLF', () => {
    expect(render('one\r\n\r\ntwo')).toBe('<p>one</p><p>two</p>');
  });
});

describe('markdownToLexicalJson', () => {
  it('encodes the tree as the string the CMS column holds', () => {
    const json = markdownToLexicalJson('# Title');
    expect(typeof json).toBe('string');
    expect(JSON.parse(json)).toEqual(markdownToLexical('# Title'));
    // The renderer accepts the encoded form, which is how it arrives from the API.
    expect(renderLexicalToHtml(json)).toBe('<h1>Title</h1>');
  });
});
