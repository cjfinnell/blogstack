import { describe, expect, it } from 'vitest';

import { assertContentShape } from '../src/content-shape';
import { renderLexicalToHtml } from '../src/lexical';
import { markdownToEditorHtml } from '../src/markdown-to-html';

/**
 * The converter's output is what lands in the database, so most of these assert
 * on it directly. `render` additionally pushes it back through the read path the
 * site uses, since markup that never survives renderLexicalToHtml's HTML branch
 * would be a post that stores fine and displays wrong.
 */
function convert(markdown: string): string {
  const html = markdownToEditorHtml(markdown);
  assertContentShape(html);
  return html;
}

function render(markdown: string): string {
  return renderLexicalToHtml(convert(markdown));
}

describe('markdownToEditorHtml', () => {
  it('wraps a paragraph', () => {
    expect(convert('The tasting menu leaned hard on acid.')).toBe(
      '<p>The tasting menu leaned hard on acid.</p>',
    );
  });

  it('separates paragraphs on blank lines and joins soft-wrapped lines with a break', () => {
    expect(convert('one\ntwo\n\nthree')).toBe('<p>one<br>two</p><p>three</p>');
  });

  it('renders headings at every level', () => {
    expect(convert('# One')).toBe('<h1>One</h1>');
    expect(convert('###### Six')).toBe('<h6>Six</h6>');
  });

  it('renders bold, italic and strikethrough', () => {
    expect(convert('**bold** and *italic* and _also italic_ and ~~gone~~')).toBe(
      '<p><strong>bold</strong> and <em>italic</em> and <em>also italic</em> and <s>gone</s></p>',
    );
  });

  it('nests emphasis as markup', () => {
    expect(convert('**bold and *both***')).toBe('<p><strong>bold and <em>both</em></strong></p>');
  });

  it('renders links, escaping the href', () => {
    expect(convert('see [the menu](https://example.test/menu?a=1&b=2)')).toBe(
      '<p>see <a href="https://example.test/menu?a=1&amp;b=2">the menu</a></p>',
    );
  });

  it('renders a standalone image as a figure, with an optional caption', () => {
    expect(convert('![The focaccia](/media/focaccia.jpg)')).toBe(
      '<figure><img src="/media/focaccia.jpg" alt="The focaccia" loading="lazy" /></figure>',
    );
    expect(convert('![Alt](/m/a.jpg "House focaccia")')).toBe(
      '<figure><img src="/m/a.jpg" alt="Alt" loading="lazy" /><figcaption>House focaccia</figcaption></figure>',
    );
  });

  it('leaves an inline image literal rather than putting a figure inside a paragraph', () => {
    expect(convert('a photo ![Alt](/m/a.jpg) mid-sentence')).toBe(
      '<p>a photo ![Alt](/m/a.jpg) mid-sentence</p>',
    );
  });

  it('renders blockquotes, merging consecutive quoted lines', () => {
    expect(convert('> Good, and it could be great.\n> Skip the tasting menu.')).toBe(
      '<blockquote>Good, and it could be great.<br>Skip the tasting menu.</blockquote>',
    );
  });

  it('renders bullet and numbered lists', () => {
    expect(convert('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
    expect(convert('1. one\n2. two')).toBe('<ol><li>one</li><li>two</li></ol>');
  });

  it('starts a list without needing a blank line after a paragraph', () => {
    expect(convert('We ordered:\n- focaccia')).toBe('<p>We ordered:</p><ul><li>focaccia</li></ul>');
  });

  it('honours backslash escapes', () => {
    expect(convert('a literal \\*asterisk\\* here')).toBe('<p>a literal *asterisk* here</p>');
  });

  it('escapes HTML in text', () => {
    expect(convert('1 < 2 & "quoted"')).toBe('<p>1 &lt; 2 &amp; &quot;quoted&quot;</p>');
  });

  it('leaves no unescaped angle bracket for an author to inject markup through', () => {
    expect(convert('<script>alert(1)</script>')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    );
  });

  describe('code, which is an authoring convention rather than a node type', () => {
    it('emits a fenced block as one paragraph of <br>-joined lines, as the editor does', () => {
      expect(convert('```yaml\nas: ["yaml", "content?"]\n```')).toBe(
        '<p>```yaml<br>as: [&quot;yaml&quot;, &quot;content?&quot;]<br>```</p>',
      );
    });

    it('is lifted back out by applyCodeBlocks on the way to the page', () => {
      const html = render('```ts\nconst a = 1;\n```');
      expect(html).toContain('<pre');
      expect(html).toContain('const a = 1;');
    });

    it('keeps an unterminated fence rather than swallowing the rest of the post', () => {
      expect(convert('```\nconst a = 1;')).toBe('<p>```<br>const a = 1;</p>');
    });

    it('leaves inline backticks alone', () => {
      expect(render('call `render()` first')).toBe('<p>call <code>render()</code> first</p>');
    });
  });

  it('passes footnote markers and the Notes section through for applyFootnotes', () => {
    // applyFootnotes matches bare <h[1-6]> and <ol>, which is why no tag the
    // converter emits carries attributes.
    const html = render(
      'The tasting menu leaned hard on acid[^1].\n\n## Notes\n\n1. Every course but dessert.',
    );
    expect(html).toContain('<sup');
    expect(html).not.toContain('[^1]');
  });

  it('normalises CRLF', () => {
    expect(convert('one\r\n\r\ntwo')).toBe('<p>one</p><p>two</p>');
  });

  it('produces nothing for empty input', () => {
    expect(markdownToEditorHtml('')).toBe('');
  });
});
