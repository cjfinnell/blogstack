import type { Transport } from './transport';
import type { NavLink, SiteSettings } from './types';
import { PLACEHOLDER_MARKER, PLACEHOLDER_VARIABLES } from './placeholders';

// The chrome's copy is the `site_copy` collection: one document per string,
// read the same way posts are read. It used to be the `global-variables` core
// plugin, which was never a settings store — its job is substituting `{key}`
// tokens inside prose, its API sits on a path core's `/api/:collection`
// wildcard swallows, and its write routes carry no authentication. See
// apps/cms/src/collections/site-copy.collection.ts.
const COLLECTION_PATH = 'site_copy';

// One request for the lot. There are ~60 strings and core's default page size
// is 50, so the limit has to be explicit; core caps it at 1000.
const READ_LIMIT = 500;

interface SiteCopyDocument {
  data?: { key?: string; value?: string };
}

interface CollectionResponse {
  data?: SiteCopyDocument[];
}

export class MissingSiteSettingsError extends Error {
  constructor(detail: string) {
    super(
      `Could not read the site copy from the CMS (${detail}). Every readable string in the ` +
        'site chrome comes from the `site_copy` collection, and there is deliberately no copy ' +
        'in the frontend to fall back to — a plausible default is exactly what ships to ' +
        'production unnoticed. Check that CMS_URL points at the CMS, that the collection has ' +
        'documents (`npm run seed:site-copy` creates them), and that they are published: the ' +
        'build reads anonymously, and core serves only published documents to anonymous ' +
        'callers, so a draft-only edit reads as an empty collection.',
    );
    this.name = 'MissingSiteSettingsError';
  }
}

/**
 * The flat key→value map the rest of this file is written against.
 *
 * Documents with no key are skipped rather than throwing: one malformed row
 * should cost its own string, which then shows as a placeholder, not the whole
 * build. A repeated key takes the last one — the collection does not enforce
 * uniqueness, and picking silently is better than failing a deploy over it.
 */
export function toCopyMap(documents: SiteCopyDocument[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const doc of documents) {
    const key = doc.data?.key;
    if (!key) continue;
    map[key] = doc.data?.value ?? '';
  }
  return map;
}

// An unfilled variable arrives as an empty string, not as a missing key, so
// `??` would accept it and render nothing. A blank label is worse than a
// visible placeholder: it reads as a design decision rather than an omission.
function text(vars: Record<string, string>, key: string): string {
  const value = vars[key];
  if (value !== undefined && value.trim() !== '') return value;
  return PLACEHOLDER_VARIABLES[key] ?? `${PLACEHOLDER_MARKER} ${key} }}`;
}

/**
 * Reads an indexed group — `nav_1_label`, `nav_2_label`, … — until a gap.
 *
 * Data-driven on purpose: adding `nav_5_label` and `nav_5_href` in the admin
 * adds a fifth nav item with no code change. Stopping at the first missing
 * index rather than scanning all keys means a stray `nav_9_label` cannot
 * silently append an item after a gap nobody meant to leave.
 */
function group<T>(
  vars: Record<string, string>,
  probe: (n: number) => string,
  build: (n: number) => T,
  fallbackCount: number,
): T[] {
  const items: T[] = [];
  for (let n = 1; ; n++) {
    const value = vars[probe(n)];
    if (value === undefined || value.trim() === '') break;
    items.push(build(n));
  }
  if (items.length > 0) return items;
  // Nothing configured: render the placeholder rows, so the shape of the page
  // is visible in review and `assertNoPlaceholders` still blocks the deploy.
  return Array.from({ length: fallbackCount }, (_, i) => build(i + 1));
}

function navLink(vars: Record<string, string>, prefix: string): NavLink {
  return { label: text(vars, `${prefix}_label`), href: text(vars, `${prefix}_href`) };
}

const TAG_KEYS = [
  'reviews',
  'recipes',
  'food_ed',
  'wine_ed',
  'interviews',
  'culture',
  'community',
  'values',
] as const;

export function assembleSettings(vars: Record<string, string>): SiteSettings {
  return {
    siteName: text(vars, 'site_name'),
    tagline: text(vars, 'tagline'),
    missionLine: text(vars, 'footer_mission'),

    primaryNav: group(
      vars,
      (n) => `nav_${String(n)}_label`,
      (n) => navLink(vars, `nav_${String(n)}`),
      4,
    ),
    tipJarLabel: text(vars, 'tip_jar_label'),
    tipJarHref: text(vars, 'tip_jar_href'),

    searchPlaceholder: text(vars, 'search_placeholder'),
    searchPlaceholderMap: text(vars, 'search_placeholder_map'),
    searchHints: group(
      vars,
      (n) => `search_hint_${String(n)}_label`,
      (n) => navLink(vars, `search_hint_${String(n)}`),
      3,
    ),

    // The key is what posts are filed under and never changes; only the label
    // moves, so renaming one migrates nothing.
    tagLabels: TAG_KEYS.map((tag) => ({
      key: tag.replace(/_/g, '-'),
      label: text(vars, `tag_${tag}`),
    })),

    philosophy: {
      railLabel: text(vars, 'philosophy_rail_label'),
      heading: text(vars, 'philosophy_heading'),
      body: text(vars, 'philosophy_body'),
      ctaLabel: text(vars, 'philosophy_cta_label'),
      ctaHref: text(vars, 'philosophy_cta_href'),
    },

    pledge: {
      statement: text(vars, 'pledge_statement'),
      byline: text(vars, 'pledge_byline'),
      newsletterLabel: text(vars, 'newsletter_button'),
      newsletterPlaceholder: text(vars, 'newsletter_placeholder'),
    },

    tipTiers: group(
      vars,
      (n) => `tip_${String(n)}_amount`,
      (n) => ({
        amount: text(vars, `tip_${String(n)}_amount`),
        description: text(vars, `tip_${String(n)}_description`),
        href: text(vars, `tip_${String(n)}_href`),
      }),
      3,
    ),

    footerColumns: group(
      vars,
      (n) => `footer_${String(n)}_heading`,
      (col) => ({
        heading: text(vars, `footer_${String(col)}_heading`),
        links: group(
          vars,
          (n) => `footer_${String(col)}_link_${String(n)}_label`,
          (n) => navLink(vars, `footer_${String(col)}_link_${String(n)}`),
          2,
        ),
      }),
      3,
    ),
  };
}

/** Every placeholder still present in a settings object, as dotted paths. */
export function findPlaceholders(settings: SiteSettings): string[] {
  const found: string[] = [];
  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      if (value.includes(PLACEHOLDER_MARKER)) found.push(path);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        walk(item, `${path}[${String(i)}]`);
      });
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        walk(child, path ? `${path}.${key}` : key);
      }
    }
  };
  walk(settings, '');
  return found;
}

/**
 * Fails when any placeholder would reach a reader.
 *
 * Called for production builds only. Placeholders exist so that unfilled
 * settings are obvious during development and in the CI fixture build; they are
 * never allowed out, because none of that text was written by the person whose
 * site it is.
 */
export function assertNoPlaceholders(settings: SiteSettings): void {
  const found = findPlaceholders(settings);
  if (found.length === 0) return;
  throw new Error(
    `${String(found.length)} unfilled site setting(s) would ship as placeholder text: ` +
      `${found.join(', ')}. Fill these in the CMS — the Site Copy collection under ` +
      '/admin/content — and publish them, before building for production.',
  );
}

export function createSiteSettingsClient(transport: Transport) {
  async function getSiteSettings(): Promise<SiteSettings> {
    const res = await transport.fetch(`/api/${COLLECTION_PATH}?limit=${String(READ_LIMIT)}`);
    if (!res.ok) throw new MissingSiteSettingsError(`the CMS returned ${String(res.status)}`);

    const body = (await res.json()) as CollectionResponse;
    if (!Array.isArray(body.data)) throw new MissingSiteSettingsError('the CMS returned no list');
    // An empty collection is a misconfiguration, not a site with no words in it.
    // Assembling from nothing would produce a full set of placeholders, which
    // reads as "unfilled copy" rather than "the CMS is wrong".
    if (body.data.length === 0) {
      throw new MissingSiteSettingsError('the site_copy collection came back empty');
    }

    return assembleSettings(toCopyMap(body.data));
  }

  return { getSiteSettings };
}

export type SiteSettingsClient = ReturnType<typeof createSiteSettingsClient>;
