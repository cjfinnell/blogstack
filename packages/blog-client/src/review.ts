import type { Dish, Photo, ReviewAxes, ReviewMeta } from './types';

/**
 * Helpers over `ReviewMeta`.
 *
 * Two jobs: normalise the legacy shapes so templates never branch on them, and
 * derive the numbers rather than storing them.
 */

/** The seven axes, in the order they are always shown. */
export const AXIS_ORDER = [
  'food',
  'vegan',
  'service',
  'ambiance',
  'value',
  'ethics',
  'supply',
] as const satisfies readonly (keyof ReviewAxes)[];

export type AxisKey = (typeof AXIS_ORDER)[number];

/**
 * Axis labels.
 *
 * These are the one exception to copy living in the CMS: they are the fixed
 * terms of the published rubric, not editorial voice. If two reviews could
 * label the same axis differently the rubric stops being comparable, which is
 * the entire point of scoring every review on the same seven questions.
 */
export const AXIS_LABELS: Record<AxisKey, string> = {
  food: 'Food quality',
  vegan: 'Vegan-friendliness',
  service: 'Service',
  ambiance: 'Ambiance',
  value: 'Value',
  ethics: 'Ownership & ethics',
  supply: 'Supply transparency',
};

export const SCORE_MAX = 10;

export interface ScoredAxis {
  key: AxisKey;
  label: string;
  value: number | null;
  /** Bar width as a percentage of SCORE_MAX. Null-scored axes render no bar. */
  percent: number;
}

/** The axes in fixed order, including the ones with no score yet. */
export function reviewAxes(review: ReviewMeta): ScoredAxis[] {
  return AXIS_ORDER.map((key) => {
    const raw = review.axes?.[key];
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
    return {
      key,
      label: AXIS_LABELS[key],
      value,
      percent: value === null ? 0 : Math.min(100, Math.max(0, (value / SCORE_MAX) * 100)),
    };
  });
}

/**
 * The composite: the unweighted mean of the axes that have a score.
 *
 * Unweighted is a stated editorial position, not an implementation shortcut —
 * it is what stops a beautiful room buying its way out of an opaque supply
 * chain. Returns null when the review is explicitly unrated or has no axis
 * scored, so `unrated` renders as a state rather than as a zero.
 */
export function compositeScore(review: ReviewMeta): number | null {
  if (review.scoreState === 'unrated') return null;

  const scored = reviewAxes(review)
    .map((axis) => axis.value)
    .filter((value): value is number => value !== null);

  if (scored.length === 0) {
    // Fall back to the legacy single rating, rescaled, so reviews written
    // before the seven axes existed still show the number they were given.
    if (typeof review.rating !== 'number') return null;
    const max = review.ratingScaleMax ?? 4;
    if (max <= 0) return null;
    return round1((review.rating / max) * SCORE_MAX);
  }

  return round1(scored.reduce((sum, value) => sum + value, 0) / scored.length);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** True when the review is deliberately unrated, rather than merely unscored. */
export function isUnrated(review: ReviewMeta): boolean {
  return review.scoreState === 'unrated' || compositeScore(review) === null;
}

function toPhoto(value: string | Photo): Photo {
  return typeof value === 'string' ? { src: value } : value;
}

/**
 * The gallery photographs, normalised.
 *
 * Legacy rows hold bare strings and therefore carry no alt text. Rather than
 * invent a description — which would be putting words nobody wrote in front of
 * a screen reader — those come back with `alt` undefined, and
 * `photosMissingAlt()` lets a build surface them.
 */
export function reviewPhotos(review: ReviewMeta): Photo[] {
  return (review.photos ?? []).map(toPhoto);
}

export function heroPhoto(review: ReviewMeta): Photo | null {
  if (review.heroPhoto) return toPhoto(review.heroPhoto);
  // No explicit hero: the first gallery photograph stands in, which is what
  // every review written before `heroPhoto` existed will hit.
  const first = review.photos?.[0];
  return first ? toPhoto(first) : null;
}

/** Sources of photographs with no alt text, for a build-time warning. */
export function photosMissingAlt(review: ReviewMeta): string[] {
  const all = [...reviewPhotos(review)];
  const hero = heroPhoto(review);
  if (hero && !all.some((p) => p.src === hero.src)) all.push(hero);
  return all.filter((p) => p.alt === undefined || p.alt.trim() === '').map((p) => p.src);
}

/**
 * The dish rundown.
 *
 * `dishes` when present. Otherwise the legacy `bestDishes` string is shown as a
 * single unsplit entry: it was authored as prose, and slicing it on commas
 * would fabricate structure that was never there.
 */
export function reviewDishes(review: ReviewMeta): Dish[] {
  if (review.dishes?.length) return review.dishes;
  const legacy = review.bestDishes?.trim();
  if (!legacy) return [];
  return [{ name: legacy, note: '' }];
}

/** The revisit log, newest first. */
export function reviewRevisits(review: ReviewMeta): ReviewMeta['revisits'] {
  return [...(review.revisits ?? [])].sort((a, b) => b.date.localeCompare(a.date));
}

/** `$`–`$$$$` from the per-person spend, or null when that is unknown. */
export function priceBand(review: ReviewMeta): string | null {
  const spend = review.pricePerPerson;
  if (typeof spend !== 'number' || !Number.isFinite(spend) || spend <= 0) return null;
  if (spend < 20) return '$';
  if (spend < 50) return '$$';
  if (spend < 100) return '$$$';
  return '$$$$';
}
