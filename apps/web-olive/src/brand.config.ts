/**
 * Every design decision that is Maria's to make, in one place.
 *
 * See DESIGN-SPEC.md §1. Each of these was an open question at the end of the
 * mockup rounds. Rather than hardcode a guess and wait, each ships with a
 * default and a key here, so answering one is a one-line change instead of a
 * refactor. Nothing in the build blocks on her.
 *
 * Every key also takes a `PUBLIC_`-prefixed environment override, read at build
 * time, so a preview deploy can show two variants side by side without a
 * commit. That matters because most of these questions are about how something
 * looks at real size on a real page, which is not a thing anyone can answer
 * from a description.
 */

/**
 * Q1 — the wordmark face.
 *
 * Pinyon Script was her pick, but it has no swash alternate for its capitals,
 * so "more dramatic tails on the M" cannot be turned on with an OpenType
 * feature. F1 and F2 are the same engraved copperplate lineage with the
 * flourish built into the glyph; F3 keeps Pinyon and sweeps a drawn flourish
 * under the whole name.
 *
 * Fusing a drawn swash into the M itself was built and thrown away. Do not
 * re-attempt it — see DESIGN-SPEC.md §2.1.
 */
export type WordmarkFace =
  | 'monsieur-la-doulaise' // F1 — closest to her note
  | 'miss-fajardose' // F2
  | 'pinyon-flourish'; // F3 — Pinyon, flourish drawn under the name

/** Q2 — the bow finish. Favicon sizes always use the unfiltered variant. */
export type BowFinish =
  | 'painted' // W1 — gradient and uneven edges, reads like gouache
  | 'painted-grain'; // W2 — the same, plus paper grain. Closer to her photograph.

/**
 * Q3 — where the bow comes from.
 *
 * 'scan' swaps a photograph of her own painting in at large sizes and keeps the
 * drawn SVG for the favicon and anything small. The reference photograph she
 * sent cannot be used: it is printed artwork on a stationery-brand product,
 * with the maker's mark visible in the wider shot. The style is not ownable;
 * that specific painting is.
 */
export type BowSource = 'drawn' | 'scan';

/**
 * Q8 — the display face.
 *
 * Six of her seven reference sites are sans, and concept D leads with a display
 * serif. This is a token swap, not a redesign: 'sans' sets headings in the body
 * face and leans on uppercase letterspaced labels for structure, leaving the
 * script wordmark to carry the personality by itself.
 */
export type DisplayFace = 'serif' | 'sans';

/** Q4 — how rankings are scoped. Blocked on her, defaulted to the narrower read. */
export type RankingScope = 'worldwide' | 'region' | 'both';

/** Q6 — how photographs sit against the score. Resolves against real photographs. */
export type ReviewPhotoTreatment = 'above-score' | 'beside-score' | 'full-bleed';

export interface BrandConfig {
  wordmarkFace: WordmarkFace;
  bowFinish: BowFinish;
  bowSource: BowSource;
  displayFace: DisplayFace;
  rankingScope: RankingScope;
  reviewPhotoTreatment: ReviewPhotoTreatment;
}

/**
 * Reads a `PUBLIC_`-prefixed override, falling back to the default when the
 * variable is unset or holds a value outside the allowed set. A typo in a
 * preview deploy's environment should render the default, not crash the build.
 */
function pick<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const raw = import.meta.env[name] as string | undefined;
  if (raw === undefined) return fallback;
  const match = allowed.find((value) => value === raw);
  if (match === undefined) {
    console.warn(
      `[brand.config] ${name}="${raw}" is not one of ${allowed.join(', ')}. Using "${fallback}".`,
    );
    return fallback;
  }
  return match;
}

const WORDMARK_FACES = ['monsieur-la-doulaise', 'miss-fajardose', 'pinyon-flourish'] as const;
const BOW_FINISHES = ['painted', 'painted-grain'] as const;
const BOW_SOURCES = ['drawn', 'scan'] as const;
const DISPLAY_FACES = ['serif', 'sans'] as const;
const RANKING_SCOPES = ['worldwide', 'region', 'both'] as const;
const PHOTO_TREATMENTS = ['above-score', 'beside-score', 'full-bleed'] as const;

export const brand: BrandConfig = {
  wordmarkFace: pick('PUBLIC_WORDMARK_FACE', WORDMARK_FACES, 'monsieur-la-doulaise'),
  bowFinish: pick('PUBLIC_BOW_FINISH', BOW_FINISHES, 'painted-grain'),
  bowSource: pick('PUBLIC_BOW_SOURCE', BOW_SOURCES, 'drawn'),
  displayFace: pick('PUBLIC_DISPLAY_FACE', DISPLAY_FACES, 'serif'),
  rankingScope: pick('PUBLIC_RANKING_SCOPE', RANKING_SCOPES, 'region'),
  reviewPhotoTreatment: pick('PUBLIC_REVIEW_PHOTO_TREATMENT', PHOTO_TREATMENTS, 'above-score'),
};

/**
 * The CSS family name for the selected wordmark face. Only this one is ever
 * fetched — the identity sheet loaded all three because it was a comparison
 * sheet, and the product must not.
 */
export const WORDMARK_FAMILY: Record<WordmarkFace, string> = {
  'monsieur-la-doulaise': 'Monsieur La Doulaise',
  'miss-fajardose': 'Miss Fajardose',
  'pinyon-flourish': 'Pinyon Script',
};

/** Whether the selected face needs the separately drawn flourish rendered under the name. */
export const wordmarkNeedsFlourish = brand.wordmarkFace === 'pinyon-flourish';
