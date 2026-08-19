import {
  assertNoPlaceholders,
  createSiteSettingsClient,
  httpTransport,
} from '@blogstack/blog-client';
import type { SiteSettings } from '@blogstack/blog-client';

const client = createSiteSettingsClient(
  httpTransport(import.meta.env.CMS_URL ?? 'http://localhost:8787'),
);

let cached: SiteSettings | null = null;

/**
 * The site chrome's copy, fetched once per build from the CMS's
 * `global-variables` plugin.
 *
 * Every page renders the masthead and the footer, so without memoising this
 * every route would refetch the same row. Astro builds in a single process, so
 * a module-level cache is the whole of it.
 *
 * A production build refuses to render unfilled settings. `ALLOW_PLACEHOLDER_COPY`
 * exists for exactly one caller — the CI fixture build, which has no live CMS
 * and is never deployed. Anything else that would ship brace-wrapped
 * placeholder text fails here rather than going live, because none of that text
 * was written by the site's owner.
 */
export async function getSettings(): Promise<SiteSettings> {
  if (cached) return cached;

  const settings = await client.getSiteSettings();

  if (import.meta.env.PROD && import.meta.env.ALLOW_PLACEHOLDER_COPY !== '1') {
    assertNoPlaceholders(settings);
  }

  cached = settings;
  return settings;
}

/**
 * The display label for a taxonomy key.
 *
 * Falls back to the key itself rather than to an invented label — an
 * unrecognised key is a content problem to see, not to paper over with a
 * word nobody wrote.
 */
export function tagLabel(settings: SiteSettings, key: string): string {
  return settings.tagLabels.find((t) => t.key === key)?.label ?? key;
}
