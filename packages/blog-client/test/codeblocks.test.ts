import { describe, expect, it } from 'vitest';
import { applyCodeBlocks } from '../src/codeblocks';

const span = (text: string) => `<span style="white-space: pre-wrap;">${text}</span>`;

describe('applyCodeBlocks', () => {
  it('lifts a fence out of a shift-entered paragraph', () => {
    const html = `<p dir="ltr">${span('Intro.')}<br>${span('```sh')}<br>${span('$ echo hi')}<br>${span('```')}<br>${span('Outro.')}</p>`;
    const out = applyCodeBlocks(html);
    expect(out).toContain('<pre><code class="language-sh">$ echo hi</code></pre>');
    expect(out).toContain('Intro.');
    expect(out).toContain('Outro.');
    expect(out).not.toContain('```');
  });

  it('lifts a fence spread across separate paragraphs', () => {
    const html = `<p>${span('```js')}</p><p>${span('const x = 1;')}</p><p>${span('```')}</p>`;
    expect(applyCodeBlocks(html)).toBe('<pre><code class="language-js">const x = 1;</code></pre>');
  });

  it('keeps multi-line code together', () => {
    const html = `<p>${span('```')}<br>${span('one')}<br>${span('two')}<br>${span('```')}</p>`;
    expect(applyCodeBlocks(html)).toBe('<pre><code>one\ntwo</code></pre>');
  });

  it('re-escapes markup inside a code block', () => {
    const html = `<p>${span('```html')}<br>${span('&lt;b&gt;hi&lt;/b&gt;')}<br>${span('```')}</p>`;
    expect(applyCodeBlocks(html)).toContain('&lt;b&gt;hi&lt;/b&gt;');
  });

  it('converts inline backticks to code', () => {
    const html = `<p>${span('Run `npm ci` first.')}</p>`;
    expect(applyCodeBlocks(html)).toContain('Run <code>npm ci</code> first.');
  });

  it('leaves backticks inside attributes alone', () => {
    const html = `<p><a href="/a\`b\`c">link</a></p>`;
    expect(applyCodeBlocks(html)).toBe(html);
  });

  it('leaves an unclosed fence as literal text', () => {
    const html = `<p>${span('```sh')}<br>${span('echo hi')}</p>`;
    const out = applyCodeBlocks(html);
    expect(out).toContain('```sh');
    expect(out).not.toContain('<pre>');
  });

  it('abandons a fence interrupted by a block element', () => {
    const html = `<p>${span('```sh')}</p><h2>Heading</h2><p>${span('after')}</p>`;
    const out = applyCodeBlocks(html);
    expect(out).toContain('<h2>Heading</h2>');
    expect(out).not.toContain('<pre>');
  });

  it('passes content with no backticks through untouched', () => {
    const html = '<p>Nothing to do here.</p>';
    expect(applyCodeBlocks(html)).toBe(html);
  });
});
