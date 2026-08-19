import type { Transport } from './transport';
import type { SiteSettings, SiteSettingsResponse, SiteSettingsRow } from './types';
import { PLACEHOLDER_MARKER, PLACEHOLDER_SITE_SETTINGS } from './placeholders';

// Same rationale as the blog_post path in ./client: reads go to
// /api/site_settings, not the documented collections route, because that one
// serves from a registry cache that does not see newly published rows.
const COLLECTION_PATH = 'site_settings';

const publishedFilter = encodeURIComponent(
  JSON.stringify({ and: [{ field: 'status', operator: 'equals', value: 'published' }] }),
);

export class MissingSiteSettingsError extends Error {
  constructor(detail: string) {
    super(
      `No published row in the CMS \`site_settings\` collection (${detail}). ` +
        'Every readable string in the site chrome comes from that collection, and there ' +
        'is deliberately no copy in the frontend to fall back to — a plausible default ' +
        'is exactly what ships to production unnoticed. Publish a settings row, or point ' +
        'CMS_URL at an instance that has one.',
    );
    this.name = 'MissingSiteSettingsError';
  }
}

/**
 * Merges a CMS row over the placeholder set.
 *
 * A row that is missing a field renders the placeholder for that field rather
 * than an empty gap, so an unfilled setting is visible in review instead of
 * silently absent. Whether that is allowed to ship is a separate question,
 * answered by `assertNoPlaceholders`.
 */
function merge(row: Partial<SiteSettings>): SiteSettings {
  const base = PLACEHOLDER_SITE_SETTINGS;
  return {
    siteName: text(row.siteName, base.siteName),
    tagline: text(row.tagline, base.tagline),
    missionLine: text(row.missionLine, base.missionLine),

    primaryNav: row.primaryNav?.length ? row.primaryNav : base.primaryNav,
    tipJarLabel: text(row.tipJarLabel, base.tipJarLabel),
    tipJarHref: text(row.tipJarHref, base.tipJarHref),

    searchPlaceholder: text(row.searchPlaceholder, base.searchPlaceholder),
    searchPlaceholderMap: text(row.searchPlaceholderMap, base.searchPlaceholderMap),
    searchHints: row.searchHints?.length ? row.searchHints : base.searchHints,

    tagLabels: row.tagLabels?.length ? row.tagLabels : base.tagLabels,

    philosophy: { ...base.philosophy, ...stripEmpty(row.philosophy) },
    pledge: { ...base.pledge, ...stripEmpty(row.pledge) },

    tipTiers: row.tipTiers?.length ? row.tipTiers : base.tipTiers,
    footerColumns: row.footerColumns?.length ? row.footerColumns : base.footerColumns,
  };
}

// An unfilled CMS text field arrives as an empty string, not as undefined, so
// `??` would accept it and render nothing. A blank label is worse than a
// visible placeholder: it looks like a design decision rather than an omission.
function text(value: string | undefined, fallback: string): string {
  return value === undefined || value.trim() === '' ? fallback : value;
}

// SonicJS persists nested objects with every key present but empty when an
// author saves a group before filling it in — the same shape `hasReviewContent`
// guards against in ./client. Spreading that over the base would blank the
// placeholders rather than leave them showing.
function stripEmpty<T extends object>(group: T | undefined): Partial<T> {
  if (!group) return {};
  return Object.fromEntries(
    Object.entries(group).filter(([, value]) => value != null && value !== ''),
  ) as Partial<T>;
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
 * settings are obvious during development and in the CI fixture build; they
 * are never allowed out, because none of that text was written by the person
 * whose site it is.
 */
export function assertNoPlaceholders(settings: SiteSettings): void {
  const found = findPlaceholders(settings);
  if (found.length === 0) return;
  throw new Error(
    `${String(found.length)} unfilled site setting(s) would ship as placeholder text: ` +
      `${found.join(', ')}. Fill these in the CMS \`site_settings\` collection before ` +
      'building for production.',
  );
}

export function createSiteSettingsClient(transport: Transport) {
  /**
   * The most recently updated published row. This is a one-row collection, but
   * an editor can end up with a second draft-then-published row, and silently
   * picking the older one would be worse than picking a definite rule.
   */
  async function getSiteSettings(): Promise<SiteSettings> {
    const res = await transport.fetch(
      `/api/${COLLECTION_PATH}?where=${publishedFilter}&limit=1&sort=updated_at&order=desc`,
    );
    if (!res.ok) throw new MissingSiteSettingsError(`the CMS returned ${String(res.status)}`);

    const { data } = (await res.json()) as SiteSettingsResponse;
    const row: SiteSettingsRow | undefined = data[0];
    if (!row) throw new MissingSiteSettingsError('the collection is empty');

    return merge(row.data);
  }

  return { getSiteSettings };
}

export type SiteSettingsClient = ReturnType<typeof createSiteSettingsClient>;
