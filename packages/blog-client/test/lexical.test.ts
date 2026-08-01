import { describe, expect, it } from 'vitest';
import { renderLexicalToHtml } from '../src/lexical';

// Captured shape of what @sonicjs-cms/core's lexical editor actually emits.
const fixture = {
  root: {
    type: 'root',
    children: [
      { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Title', format: 0 }] },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Hello ', format: 0 },
          { type: 'text', text: 'bold', format: 1 },
          { type: 'text', text: ' and ', format: 0 },
          { type: 'text', text: 'code', format: 16 },
        ],
      },
      { type: 'quote', children: [{ type: 'text', text: 'A quote', format: 2 }] },
      {
        type: 'list',
        listType: 'number',
        children: [
          { type: 'listitem', children: [{ type: 'text', text: 'one' }] },
          { type: 'listitem', children: [{ type: 'text', text: 'two' }] },
        ],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'link', url: 'https://example.com', children: [{ type: 'text', text: 'a link' }] },
          { type: 'linebreak' },
          { type: 'text', text: '<script>' },
        ],
      },
    ],
  },
};

describe('renderLexicalToHtml', () => {
  it('renders a captured lexical tree to HTML', () => {
    const html = renderLexicalToHtml(fixture);
    expect(html).toBe(
      '<h2>Title</h2>' +
        '<p>Hello <strong>bold</strong> and <code>code</code></p>' +
        '<blockquote><em>A quote</em></blockquote>' +
        '<ol><li>one</li><li>two</li></ol>' +
        '<p><a href="https://example.com">a link</a><br />&lt;script&gt;</p>'
    );
  });

  it('accepts a JSON-encoded string, same as the API returns', () => {
    expect(renderLexicalToHtml(JSON.stringify(fixture))).toContain('<h2>Title</h2>');
  });

  it('returns an empty string for null or undefined content', () => {
    expect(renderLexicalToHtml(null)).toBe('');
    expect(renderLexicalToHtml(undefined)).toBe('');
  });
});
