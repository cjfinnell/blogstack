export type PostType = 'essay' | 'review';

/**
 * A content photograph.
 *
 * `alt` is required for anything new. The legacy shape was a bare `src` string
 * and every gallery image rendered with `alt=""`, which is wrong for content
 * photography — but alt text cannot be generated, so `reviewPhotos()` surfaces
 * the gap rather than inventing a description.
 */
export interface Photo {
  src: string;
  alt?: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
}

/**
 * One dish in the rundown.
 *
 * This replaces `bestDishes`, which was a single free-text string. The dish
 * rundown is the most reusable block in food writing and it cannot be built
 * from one line.
 */
export interface Dish {
  name: string;
  note: string;
  photo?: Photo;
  verdict?: 'must' | 'skip';
}

/**
 * The seven axes, scored independently.
 *
 * The composite is derived, never stored — see `compositeScore()`. Storing it
 * would let the two drift, and the whole claim of the rubric is that the
 * number is a measurement rather than an opinion.
 */
export interface ReviewAxes {
  food?: number;
  vegan?: number;
  service?: number;
  ambiance?: number;
  value?: number;
  ethics?: number;
  supply?: number;
}

/** One entry in the living-updates log. A review changes when the restaurant does. */
export interface Revisit {
  date: string;
  visitNumber?: number;
  note: string;
}

export interface ReviewMeta {
  restaurant?: string;
  city?: string;
  visitedAt?: string;
  rating?: number;
  ratingScaleMax?: number;
  pricePerPerson?: number;
  verdictSummary?: string;
  recommendation?: string;
  bestOccasion?: string;
  cuisineTags?: string[];

  /**
   * Legacy free-text dishes. Rows written before `dishes` existed only have
   * this, so it stays readable; nothing new should be written to it.
   */
  bestDishes?: string;
  dishes?: Dish[];

  /**
   * Legacy rows hold bare `src` strings; newer ones hold objects. Read through
   * `reviewPhotos()` rather than touching this directly.
   */
  photos?: (string | Photo)[];
  heroPhoto?: string | Photo;

  axes?: ReviewAxes;
  /** `unrated` is a first-class state, not an absent number. */
  scoreState?: 'scored' | 'unrated';

  revisits?: Revisit[];
  updatedAt?: string;
  nextRevisit?: string;

  address?: string;
  /** At least five decimal places, or the JSON-LD `geo` is not worth emitting. */
  geo?: { lat: number; lng: number };
  /** Disambiguates chains far better than a name does. */
  placeId?: string;
  neighbourhood?: string;
  gettingIn?: string;
  /** The literal cost sentence. The price band scans; this is the utility. */
  damage?: string;
  badges?: string[];

  disclosures?: {
    howWeAte?: string;
    ownership?: string;
    supplyChain?: string;
    interview?: string;
  };

  // Deliberately absent: opening hours. She will not maintain them, and a
  // wrong opening time is worse than no opening time.
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  status: string;
  collectionId: string;
  created_at: number;
  updated_at: number;
  data: {
    // Nested `data.*` mirrors the top-level field on every row written since
    // the CMS added the nested content shape; rows from before that migration
    // only have the top-level field, so these read as genuinely optional —
    // see postSlug/postTitle/postPublishedAt below, which fall back to the
    // top-level value.
    title?: string;
    slug?: string;
    content: string; // JSON-encoded lexical tree — parse before rendering
    author: string;
    publishedAt?: string;
    // Absent on every row written before the review post type existed.
    postType?: PostType;
    review?: ReviewMeta;
  };
}

export interface ContentResponse {
  data: Post[];
  meta: { count: number };
}

export interface NavLink {
  label: string;
  href: string;
}

/**
 * Every readable string in the site chrome, assembled from the CMS.
 *
 * Storage is the `site_copy` collection — one document per key/value string,
 * edited in the admin. This is the shape the frontend wants;
 * `assembleSettings` in ./site-settings does the translation, including the
 * indexed groups that stand in for lists.
 *
 * No frontend module carries copy. Structural values — route paths, taxonomy
 * keys, design toggles — stay in code; anything a reader can see lives here.
 * `tagLabels` is a list rather than a map because the key is what content is
 * filed under: renaming a label must never migrate anything.
 */
export interface SiteSettings {
  siteName: string;
  tagline: string;
  missionLine: string;

  primaryNav: NavLink[];
  tipJarLabel: string;
  tipJarHref: string;

  searchPlaceholder: string;
  searchPlaceholderMap: string;
  searchHints: NavLink[];

  tagLabels: { key: string; label: string }[];

  philosophy: {
    railLabel: string;
    heading: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };

  pledge: {
    statement: string;
    byline: string;
    newsletterLabel: string;
    newsletterPlaceholder: string;
  };

  tipTiers: { amount: string; description: string; href: string }[];

  footerColumns: { heading: string; links: NavLink[] }[];
}
