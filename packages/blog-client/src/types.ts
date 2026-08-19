export type PostType = 'essay' | 'review';

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
  bestDishes?: string;
  cuisineTags?: string[];
  photos?: string[];
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
 * Every readable string in the site chrome, from the CMS.
 *
 * No frontend module carries copy. Structural values — route paths, taxonomy
 * keys, design toggles — stay in code; anything a reader can see lives here.
 * `tagLabels` is a list rather than a map because the key is what content is
 * stored against: renaming a label must never migrate anything.
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

/** One row of the `site_settings` collection, in the shape the API returns it. */
export interface SiteSettingsRow {
  id: string;
  slug: string;
  status: string;
  updated_at: number;
  data: Partial<SiteSettings>;
}

export interface SiteSettingsResponse {
  data: SiteSettingsRow[];
  meta: { count: number };
}
