import { describe, expect, it } from 'vitest';
import { highlightCodeBlocks } from '../src/highlight';

const themes = { light: 'github-light', dark: 'github-dark' } as const;

describe('highlightCodeBlocks', () => {
  it('replaces a code block with themed markup', async () => {
    const out = await highlightCodeBlocks(
      '<p>Before</p><pre><code class="language-js">const x = 1;</code></pre>',
      themes,
    );
    expect(out).toContain('<p>Before</p>');
    expect(out).toContain('class="shiki shiki-themes github-light github-dark"');
    expect(out).toContain('--shiki-dark');
  });

  it('falls back to plain text for an unknown language', async () => {
    const out = await highlightCodeBlocks(
      '<pre><code class="language-klingon">nuqneH</code></pre>',
      themes,
    );
    expect(out).toContain('nuqneH');
    expect(out).toContain('class="shiki');
  });

  it('decodes entities before tokenizing', async () => {
    const out = await highlightCodeBlocks(
      '<pre><code class="language-html">&lt;b&gt;hi&lt;/b&gt;</code></pre>',
      themes,
    );
    expect(out).toContain('&#x3C;');
    expect(out).not.toContain('&amp;lt;');
  });

  it('leaves content with no code blocks untouched', async () => {
    const html = '<p>Plain</p>';
    expect(await highlightCodeBlocks(html, themes)).toBe(html);
  });
});
