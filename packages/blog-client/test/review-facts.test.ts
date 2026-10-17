import { describe, expect, it } from 'vitest';
import { extractReviewFacts } from '../src/review-facts';

const MARK = '<!--facts-->';

const run =
  '<p><strong>Rating:</strong> 2.3 / 4. It was good.</p>' +
  '<p>1 - Bad · 2 - Good · 3 - Great · 4 - Excellent</p>' +
  '<p><strong>Recommendation:</strong> skip the tasting menu.</p>' +
  '<p><strong>Best occasion:</strong> date night.</p>';

describe('extractReviewFacts', () => {
  it('lifts the labelled run out of the body and leaves the marker', () => {
    const html = `<h2>Overview</h2><p>Intro.</p>${run}<h2>Food</h2>`;
    const result = extractReviewFacts(html, MARK);

    expect(result?.html).toBe(`<h2>Overview</h2><p>Intro.</p>${MARK}<h2>Food</h2>`);
    expect(result?.facts).toEqual([
      { label: 'Recommendation', html: 'skip the tasting menu.' },
      { label: 'Best occasion', html: 'date night.' },
    ]);
  });

  it('reads the rating and its own scale rather than treating them as facts', () => {
    const result = extractReviewFacts(run, MARK);

    expect(result?.rating).toEqual({ value: 2.3, max: 4, html: 'It was good.' });
    expect(result?.scale).toEqual([
      { value: 1, label: 'Bad' },
      { value: 2, label: 'Good' },
      { value: 3, label: 'Great' },
      { value: 4, label: 'Excellent' },
    ]);
  });

  it('accepts the colon outside the bold', () => {
    const html = '<p><strong>Parking</strong>: out back.</p><p><strong>Price</strong>: $$.</p>';

    expect(extractReviewFacts(html, MARK)?.facts.map((f) => f.label)).toEqual(['Parking', 'Price']);
  });

  it('leaves a lone bold lead-in in the essay alone', () => {
    const html = '<p><strong>Note:</strong> one aside.</p><p>Then prose.</p>';

    expect(extractReviewFacts(html, MARK)).toBeNull();
  });

  it('skips a lone lead-in and still finds a later run', () => {
    const html = `<p><strong>Note:</strong> aside.</p><p>Prose.</p>${run}`;

    expect(extractReviewFacts(html, MARK)?.html).toBe(
      `<p><strong>Note:</strong> aside.</p><p>Prose.</p>${MARK}`,
    );
  });

  it('keeps inline markup inside a fact', () => {
    const html =
      '<p><strong>Best dishes:</strong> the <em>focaccia</em>.</p><p><strong>Skip:</strong> salad.</p>';

    expect(extractReviewFacts(html, MARK)?.facts[0]?.html).toBe('the <em>focaccia</em>.');
  });
});
