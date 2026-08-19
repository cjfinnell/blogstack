import type { SiteSettings } from './types';

/**
 * The one set of placeholder values, used as the defaults, the CI fixture, and
 * the test expectations — the same object in all three places, so they cannot
 * drift apart.
 *
 * Every string is wrapped in double braces. That is deliberate and it is the
 * whole point of this file: a missing CMS value has to be unmistakable on
 * sight. Plausible-looking default copy is exactly the thing that survives to
 * production unnoticed, and none of this text was written by the person whose
 * site it is, so none of it may ever reach a reader.
 *
 * `assertNoPlaceholders` in ./site-settings enforces that for real builds, and
 * CI greps the built output for the brace marker.
 */
export const PLACEHOLDER_MARKER = '{{';

export const PLACEHOLDER_SITE_SETTINGS: SiteSettings = {
  siteName: '{{ site name }}',
  tagline: '{{ tagline }}',
  missionLine: '{{ footer mission line }}',

  primaryNav: [
    { label: '{{ nav 1 }}', href: '/' },
    { label: '{{ nav 2 }}', href: '/' },
    { label: '{{ nav 3 }}', href: '/' },
    { label: '{{ nav 4 }}', href: '/' },
  ],
  tipJarLabel: '{{ tip jar }}',
  tipJarHref: '/',

  searchPlaceholder: '{{ search placeholder }}',
  searchPlaceholderMap: '{{ search placeholder, map }}',
  searchHints: [
    { label: '{{ example search 1 }}', href: '/' },
    { label: '{{ example search 2 }}', href: '/' },
    { label: '{{ example search 3 }}', href: '/' },
  ],

  tagLabels: [
    { key: 'reviews', label: '{{ tag: reviews }}' },
    { key: 'recipes', label: '{{ tag: recipes }}' },
    { key: 'food-ed', label: '{{ tag: food-ed }}' },
    { key: 'wine-ed', label: '{{ tag: wine-ed }}' },
    { key: 'interviews', label: '{{ tag: interviews }}' },
    { key: 'culture', label: '{{ tag: culture }}' },
    { key: 'community', label: '{{ tag: community }}' },
    { key: 'values', label: '{{ tag: values }}' },
  ],

  philosophy: {
    railLabel: '{{ philosophy rail label }}',
    heading: '{{ philosophy heading }}',
    body: '{{ philosophy body }}',
    ctaLabel: '{{ philosophy link }}',
    ctaHref: '/',
  },

  pledge: {
    statement: '{{ pledge statement }}',
    byline: '{{ pledge byline }}',
    newsletterLabel: '{{ newsletter button }}',
    newsletterPlaceholder: '{{ email placeholder }}',
  },

  tipTiers: [
    { amount: '{{ amount 1 }}', description: '{{ tier 1 }}', href: '/' },
    { amount: '{{ amount 2 }}', description: '{{ tier 2 }}', href: '/' },
    { amount: '{{ amount 3 }}', description: '{{ tier 3 }}', href: '/' },
  ],

  footerColumns: [
    {
      heading: '{{ footer column 1 }}',
      links: [
        { label: '{{ footer link 1a }}', href: '/' },
        { label: '{{ footer link 1b }}', href: '/' },
      ],
    },
    {
      heading: '{{ footer column 2 }}',
      links: [
        { label: '{{ footer link 2a }}', href: '/' },
        { label: '{{ footer link 2b }}', href: '/' },
      ],
    },
    {
      heading: '{{ footer column 3 }}',
      links: [
        { label: '{{ footer link 3a }}', href: '/' },
        { label: '{{ footer link 3b }}', href: '/' },
      ],
    },
  ],
};
