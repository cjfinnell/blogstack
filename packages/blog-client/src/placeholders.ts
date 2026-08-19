/**
 * The site chrome's copy, as flat keyed strings.
 *
 * Storage is the `site_copy` collection: one document per string, with
 * `key` / `value` / `description` / `category`, edited in the admin and read at
 * `GET /api/site_copy` like any other collection. It lived in the
 * `global-variables` core plugin until it didn't — that plugin substitutes
 * `{key}` tokens into prose on read, which made every one of these strings raw
 * markup inside other people's post bodies, and its write routes carried no
 * authentication.
 *
 * Two consequences of the store shape, both deliberate:
 *
 *   Keys stay `^[a-z0-9_]+$`. Nothing enforces it now that the plugin's admin
 *   form is gone, but the frontend looks strings up by key and the convention
 *   is what keeps that legible.
 *
 *   Values are plain strings, so lists are indexed rather than nested:
 *   `nav_1_label`, `nav_2_label`, and so on. Every value stays a single line
 *   in a single text box, which is the right trade for the person editing;
 *   JSON in a textarea is not. The reader below is data-driven, so adding
 *   `nav_5_label` and `nav_5_href` adds a fifth nav item with no code change.
 *
 * Every default is wrapped in double braces. That is the point of this file: a
 * missing value has to be unmistakable on sight, because none of this text was
 * written by the person whose site it is and none of it may reach a reader.
 *
 * These same values are the CI fixture and the test expectations — one object,
 * imported in all three places, because a second hand-written copy would drift
 * and the drift would surface as copy on a real page.
 */

export const PLACEHOLDER_MARKER = '{{';

export interface SettingKey {
  key: string;
  /** Shown to the editor in the admin UI. Says what the string is for. */
  description: string;
  category: string;
  placeholder: string;
}

function indexed(count: number, make: (n: number) => SettingKey[]): SettingKey[] {
  return Array.from({ length: count }, (_, i) => make(i + 1)).flat();
}

/**
 * Every key the frontend reads, with the description the editor sees.
 *
 * This list is also what `scripts/seed-site-copy.ts` creates, so the documents
 * exist to be edited rather than having to be typed out by hand.
 */
export const SETTING_KEYS: SettingKey[] = [
  {
    key: 'site_name',
    description: 'The wordmark, the page titles, and every link preview.',
    category: 'identity',
    placeholder: '{{ site name }}',
  },
  {
    key: 'tagline',
    description: 'One line under the homepage masthead. Seven words can do the whole job.',
    category: 'identity',
    placeholder: '{{ tagline }}',
  },
  {
    key: 'footer_mission',
    description: 'Sits beside the bow in the footer, on every page.',
    category: 'identity',
    placeholder: '{{ footer mission line }}',
  },

  ...indexed(4, (n) => [
    {
      key: `nav_${String(n)}_label`,
      description: `Primary navigation item ${String(n)} — the text.`,
      category: 'navigation',
      placeholder: `{{ nav ${String(n)} }}`,
    },
    {
      key: `nav_${String(n)}_href`,
      description: `Primary navigation item ${String(n)} — the path, e.g. /food.`,
      category: 'navigation',
      placeholder: '/',
    },
  ]),
  {
    key: 'tip_jar_label',
    description: 'The pill at the end of the navigation.',
    category: 'navigation',
    placeholder: '{{ tip jar }}',
  },
  {
    key: 'tip_jar_href',
    description: 'Where the tip jar pill goes.',
    category: 'navigation',
    placeholder: '/',
  },

  {
    key: 'search_placeholder',
    description: 'Grey text inside the search box on most pages.',
    category: 'search',
    placeholder: '{{ search placeholder }}',
  },
  {
    key: 'search_placeholder_map',
    description: 'Grey text inside the search box on the map page.',
    category: 'search',
    placeholder: '{{ search placeholder, map }}',
  },
  ...indexed(3, (n) => [
    {
      key: `search_hint_${String(n)}_label`,
      description: `Example search ${String(n)} under the homepage search box. These teach the archive in one line.`,
      category: 'search',
      placeholder: `{{ example search ${String(n)} }}`,
    },
    {
      key: `search_hint_${String(n)}_href`,
      description: `Where example search ${String(n)} goes.`,
      category: 'search',
      placeholder: '/',
    },
  ]),

  ...(
    [
      'reviews',
      'recipes',
      'food_ed',
      'wine_ed',
      'interviews',
      'culture',
      'community',
      'values',
    ] as const
  ).map((tag) => ({
    key: `tag_${tag}`,
    description: `Display name for the "${tag}" tag. Renaming it here changes nothing about the posts filed under it.`,
    category: 'tags',
    placeholder: `{{ tag: ${tag} }}`,
  })),

  {
    key: 'philosophy_rail_label',
    description: 'Small uppercase label above the philosophy block.',
    category: 'philosophy',
    placeholder: '{{ philosophy rail label }}',
  },
  {
    key: 'philosophy_heading',
    description: 'Heading of the philosophy block on the homepage.',
    category: 'philosophy',
    placeholder: '{{ philosophy heading }}',
  },
  {
    key: 'philosophy_body',
    description: 'The paragraph in the philosophy block.',
    category: 'philosophy',
    placeholder: '{{ philosophy body }}',
  },
  {
    key: 'philosophy_cta_label',
    description: 'Link text at the foot of the philosophy block.',
    category: 'philosophy',
    placeholder: '{{ philosophy link }}',
  },
  {
    key: 'philosophy_cta_href',
    description: 'Where the philosophy link goes.',
    category: 'philosophy',
    placeholder: '/',
  },

  {
    key: 'pledge_statement',
    description: 'The no-ads, no-sponsors statement above the newsletter form.',
    category: 'pledge',
    placeholder: '{{ pledge statement }}',
  },
  {
    key: 'pledge_byline',
    description: 'The smaller line under the pledge — who writes it, who pays the bills.',
    category: 'pledge',
    placeholder: '{{ pledge byline }}',
  },
  {
    key: 'newsletter_button',
    description: 'Text on the newsletter sign-up button.',
    category: 'pledge',
    placeholder: '{{ newsletter button }}',
  },
  {
    key: 'newsletter_placeholder',
    description: 'Grey text inside the newsletter email box.',
    category: 'pledge',
    placeholder: '{{ email placeholder }}',
  },

  ...indexed(3, (n) => [
    {
      key: `tip_${String(n)}_amount`,
      description: `Tip tier ${String(n)} — the amount, as you want it written.`,
      category: 'tip-jar',
      placeholder: `{{ amount ${String(n)} }}`,
    },
    {
      key: `tip_${String(n)}_description`,
      description: `Tip tier ${String(n)} — what it buys.`,
      category: 'tip-jar',
      placeholder: `{{ tier ${String(n)} }}`,
    },
    {
      key: `tip_${String(n)}_href`,
      description: `Tip tier ${String(n)} — where the link goes.`,
      category: 'tip-jar',
      placeholder: '/',
    },
  ]),

  ...indexed(3, (col) => [
    {
      key: `footer_${String(col)}_heading`,
      description: `Footer column ${String(col)} — the heading.`,
      category: 'footer',
      placeholder: `{{ footer column ${String(col)} }}`,
    },
    ...indexed(2, (link) => [
      {
        key: `footer_${String(col)}_link_${String(link)}_label`,
        description: `Footer column ${String(col)}, link ${String(link)} — the text.`,
        category: 'footer',
        placeholder: `{{ footer link ${String(col)}.${String(link)} }}`,
      },
      {
        key: `footer_${String(col)}_link_${String(link)}_href`,
        description: `Footer column ${String(col)}, link ${String(link)} — the path.`,
        category: 'footer',
        placeholder: '/',
      },
    ]),
  ]),
];

/** The placeholder map: the defaults, the fixture, and the test values, all at once. */
export const PLACEHOLDER_VARIABLES: Record<string, string> = Object.fromEntries(
  SETTING_KEYS.map((k) => [k.key, k.placeholder]),
);
