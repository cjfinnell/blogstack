import type { Transport } from './transport';
import type { NavLink, SiteSettings } from './types';
import { PLACEHOLDER_MARKER, PLACEHOLDER_VARIABLES } from './placeholders';

// The `global-variables` core plugin mounts its resolve route at
// `/api/global-variables/resolve`, but core's `/api/:collection` wildcard
// shadows it and answers "Collection not found" instead — see
// apps/cms/src/plugins/global-variables-route. That plugin re-mounts a
// read-only equivalent at `/global-variables/resolve`, clear of the
// wildcard, which is the path this client actually has to call. A CMS
// running a core older than 3.0.0-beta.26 never mounted the plugin's routes
// at all and answers 404 either way.
const RESOLVE_PATH = '/global-variables/resolve';

interface ResolveResponse {
  success: boolean;
  data: Record<string, string>;
}

export class MissingSiteSettingsError extends Error {
  constructor(detail: string) {
    super(
      `Could not read the CMS global variables (${detail}). Every readable string in the ` +
        'site chrome comes from the `global-variables` plugin, and there is deliberately no ' +
        'copy in the frontend to fall back to — a plausible default is exactly what ships to ' +
        'production unnoticed. Check that the plugin is active, that the CMS is running ' +
        '@sonicjs-cms/core >= 3.0.0-beta.26 (older versions never mounted the plugin routes), ' +
        'and that CMS_URL points at it.',
    );
    this.name = 'MissingSiteSettingsError';
  }
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
      `${found.join(', ')}. Fill these in the CMS at /admin/global-variables before ` +
      'building for production.',
  );
}

export function createSiteSettingsClient(transport: Transport) {
  async function getSiteSettings(): Promise<SiteSettings> {
    const res = await transport.fetch(RESOLVE_PATH);
    if (!res.ok) throw new MissingSiteSettingsError(`the CMS returned ${String(res.status)}`);

    const body = (await res.json()) as ResolveResponse;
    if (!body.success) throw new MissingSiteSettingsError('the CMS reported failure');

    return assembleSettings(body.data);
  }

  return { getSiteSettings };
}

export type SiteSettingsClient = ReturnType<typeof createSiteSettingsClient>;
