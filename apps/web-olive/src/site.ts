/**
 * Structure only. No copy.
 *
 * Two constraints meet in this file, and between them they leave nothing here
 * that a reader can see:
 *
 *   1. All readable content comes from the CMS. A label that cannot be changed
 *      from the CMS is a label that needs an engineer, which is the failure
 *      mode we are avoiding.
 *   2. No generated prose ever ships as final print. So this file carries no
 *      sentences, no names, no labels — not even plausible ones, because a
 *      plausible default is exactly the thing that survives to production
 *      unnoticed.
 *
 * What remains is structure: which taxonomy keys exist, and which shared theme
 * the post renderer is handed. Everything a person reads lives in the
 * `site_settings` collection and arrives as props.
 */

/**
 * Stable taxonomy keys. Content is stored against these, so they never change;
 * the display label for each lives in the CMS and can be renamed freely.
 */
export const TAG_KEYS = [
  'reviews',
  'recipes',
  'food-ed',
  'wine-ed',
  'interviews',
  'culture',
  'community',
  'values',
] as const;

export type TagKey = (typeof TAG_KEYS)[number];

/**
 * Retained for the shared PostLayout, which still takes a theme name. Olive's
 * own chrome no longer routes through the shared BaseLayout: that theme system
 * carries five colours and one font, and this design needs twelve tokens and
 * three faces.
 */
export const theme = 'default' as const;
