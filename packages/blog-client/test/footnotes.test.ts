import { describe, expect, it } from 'vitest';
import { applyFootnotes } from '../src/footnotes';

const NOTES = '<h2>Notes</h2><ol><li>First note.</li><li>Second note.</li></ol>';

describe('applyFootnotes', () => {
  it('turns a marker into a superscript link', () => {
    const html = applyFootnotes(`<p>Claim[^1]</p>${NOTES}`);
    expect(html).toContain('<sup id="fnref-1"><a href="#fn-1">1</a></sup>');
    expect(html).not.toContain('[^1]');
  });

  it('gives each note an id and a back-link', () => {
    const html = applyFootnotes(`<p>Claim[^1]</p>${NOTES}`);
    expect(html).toContain('<li id="fn-1">');
    expect(html).toContain('<a href="#fnref-1"');
  });

  it('handles multiple markers', () => {
    const html = applyFootnotes(`<p>A[^1] and B[^2]</p>${NOTES}`);
    expect(html).toContain('href="#fn-1"');
    expect(html).toContain('href="#fn-2"');
  });

  it('leaves a marker with no matching note as literal text', () => {
    const html = applyFootnotes(`<p>Claim[^9]</p>${NOTES}`);
    expect(html).toContain('[^9]');
    expect(html).not.toContain('href="#fn-9"');
  });

  it('returns html untouched when there is no Notes section', () => {
    const input = '<p>Claim[^1]</p>';
    expect(applyFootnotes(input)).toBe(input);
  });

  it('does not rewrite a marker inside the notes list itself', () => {
    const html = applyFootnotes(`<p>A[^1]</p>${NOTES}`);
    expect(html.split('<sup id="fnref-1">').length - 1).toBe(1);
  });

  it('is a no-op on empty input', () => {
    expect(applyFootnotes('')).toBe('');
  });
});
