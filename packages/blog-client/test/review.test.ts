import { describe, expect, it } from 'vitest';
import {
  AXIS_ORDER,
  compositeScore,
  heroPhoto,
  isUnrated,
  photosMissingAlt,
  priceBand,
  reviewAxes,
  reviewDishes,
  reviewPhotos,
  reviewRevisits,
} from '../src/review';
import type { ReviewMeta } from '../src/types';

describe('reviewAxes', () => {
  it('always returns the seven axes in the published order', () => {
    const axes = reviewAxes({});

    expect(axes.map((a) => a.key)).toEqual([...AXIS_ORDER]);
    expect(axes).toHaveLength(7);
  });

  it('reports an unscored axis as null rather than zero', () => {
    const axes = reviewAxes({ axes: { food: 8.8 } });

    expect(axes.find((a) => a.key === 'food')?.value).toBe(8.8);
    expect(axes.find((a) => a.key === 'value')?.value).toBeNull();
  });

  it('converts a score to a bar percentage out of ten', () => {
    expect(reviewAxes({ axes: { food: 8.8 } }).find((a) => a.key === 'food')?.percent).toBeCloseTo(
      88,
    );
  });

  it('clamps a bar that would overflow', () => {
    expect(reviewAxes({ axes: { food: 12 } }).find((a) => a.key === 'food')?.percent).toBe(100);
  });
});

describe('compositeScore', () => {
  it('is the unweighted mean of the scored axes', () => {
    // Unweighted is the editorial position: a beautiful room cannot buy its way
    // out of an opaque supply chain.
    const review: ReviewMeta = {
      axes: { food: 8.8, vegan: 6.5, service: 8.2, ambiance: 9, value: 6, ethics: 7, supply: 4.5 },
    };

    expect(compositeScore(review)).toBe(7.1);
  });

  it('ignores axes that have no score rather than treating them as zero', () => {
    expect(compositeScore({ axes: { food: 8, service: 6 } })).toBe(7);
  });

  it('is null when the review is explicitly unrated, even with axes scored', () => {
    expect(compositeScore({ scoreState: 'unrated', axes: { food: 9 } })).toBeNull();
  });

  it('is null when nothing has been scored at all', () => {
    expect(compositeScore({})).toBeNull();
  });

  it('rescales a legacy rating so older reviews still show their number', () => {
    expect(compositeScore({ rating: 3, ratingScaleMax: 4 })).toBe(7.5);
  });

  it('prefers the axes over a legacy rating when both are present', () => {
    expect(compositeScore({ rating: 1, ratingScaleMax: 4, axes: { food: 9 } })).toBe(9);
  });

  it('does not divide by a zero scale', () => {
    expect(compositeScore({ rating: 3, ratingScaleMax: 0 })).toBeNull();
  });
});

describe('isUnrated', () => {
  it('is true for a deliberately unrated review', () => {
    expect(isUnrated({ scoreState: 'unrated' })).toBe(true);
  });

  it('is false once an axis is scored', () => {
    expect(isUnrated({ axes: { food: 7 } })).toBe(false);
  });
});

describe('reviewPhotos', () => {
  it('normalises legacy bare strings into photo objects', () => {
    expect(reviewPhotos({ photos: ['/a.jpg'] })).toEqual([{ src: '/a.jpg' }]);
  });

  it('passes through photos that already carry alt text', () => {
    const photo = { src: '/a.jpg', alt: 'A bowl of beans', credit: 'Someone' };

    expect(reviewPhotos({ photos: [photo] })).toEqual([photo]);
  });
});

describe('photosMissingAlt', () => {
  it('reports legacy photos rather than inventing a description for them', () => {
    expect(photosMissingAlt({ photos: ['/a.jpg', { src: '/b.jpg', alt: 'Described' }] })).toEqual([
      '/a.jpg',
    ]);
  });

  it('treats blank alt as missing', () => {
    expect(photosMissingAlt({ photos: [{ src: '/a.jpg', alt: '  ' }] })).toEqual(['/a.jpg']);
  });

  it('includes a hero that is not also in the gallery', () => {
    expect(photosMissingAlt({ heroPhoto: '/hero.jpg', photos: [] })).toEqual(['/hero.jpg']);
  });

  it('does not report the same photo twice when the hero is the first gallery image', () => {
    expect(photosMissingAlt({ heroPhoto: '/a.jpg', photos: ['/a.jpg'] })).toEqual(['/a.jpg']);
  });
});

describe('heroPhoto', () => {
  it('uses the explicit hero when set', () => {
    expect(heroPhoto({ heroPhoto: '/hero.jpg', photos: ['/a.jpg'] })).toEqual({ src: '/hero.jpg' });
  });

  it('falls back to the first gallery photograph', () => {
    expect(heroPhoto({ photos: ['/a.jpg', '/b.jpg'] })).toEqual({ src: '/a.jpg' });
  });

  it('is null when there are no photographs', () => {
    expect(heroPhoto({})).toBeNull();
  });
});

describe('reviewDishes', () => {
  it('returns the structured rundown when there is one', () => {
    const dishes = [{ name: 'Gigantes', note: 'Order two.', verdict: 'must' as const }];

    expect(reviewDishes({ dishes })).toEqual(dishes);
  });

  it('shows a legacy free-text line unsplit rather than fabricating structure', () => {
    // Splitting on commas would invent a rundown the writer never wrote.
    expect(reviewDishes({ bestDishes: 'gigantes, hummus, charred cabbage' })).toEqual([
      { name: 'gigantes, hummus, charred cabbage', note: '' },
    ]);
  });

  it('is empty when neither is set', () => {
    expect(reviewDishes({})).toEqual([]);
  });

  it('prefers the structured rundown over the legacy line', () => {
    const dishes = [{ name: 'Gigantes', note: 'Order two.' }];

    expect(reviewDishes({ dishes, bestDishes: 'something else' })).toEqual(dishes);
  });
});

describe('reviewRevisits', () => {
  it('orders the log newest first', () => {
    const review: ReviewMeta = {
      revisits: [
        { date: '2025-11-02', note: 'Published.' },
        { date: '2026-07-28', note: 'Vegan legend now printed.' },
        { date: '2026-03-11', note: 'New pastry chef.' },
      ],
    };

    expect(reviewRevisits(review)?.map((r) => r.date)).toEqual([
      '2026-07-28',
      '2026-03-11',
      '2025-11-02',
    ]);
  });

  it('does not mutate the stored order', () => {
    const revisits = [
      { date: '2025-01-01', note: 'a' },
      { date: '2026-01-01', note: 'b' },
    ];
    reviewRevisits({ revisits });

    expect(revisits[0]?.date).toBe('2025-01-01');
  });
});

describe('priceBand', () => {
  it.each([
    [12, '$'],
    [34, '$$'],
    [72, '$$$'],
    [220, '$$$$'],
  ])('reads %d a head as %s', (spend, band) => {
    expect(priceBand({ pricePerPerson: spend })).toBe(band);
  });

  it('is null when the spend is unknown', () => {
    expect(priceBand({})).toBeNull();
  });

  it('is null for a nonsense spend rather than showing a band', () => {
    expect(priceBand({ pricePerPerson: 0 })).toBeNull();
  });
});
