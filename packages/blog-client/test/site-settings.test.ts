import { describe, expect, it, vi } from 'vitest';
import {
  assertNoPlaceholders,
  createSiteSettingsClient,
  findPlaceholders,
  MissingSiteSettingsError,
} from '../src/site-settings';
import { PLACEHOLDER_SITE_SETTINGS } from '../src/placeholders';
import type { Transport } from '../src/transport';
import type { SiteSettings, SiteSettingsRow } from '../src/types';

function makeRow(data: Partial<SiteSettings> = {}): SiteSettingsRow {
  return {
    id: '1',
    slug: 'settings',
    status: 'published',
    updated_at: 0,
    data,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function transportReturning(body: unknown, status = 200) {
  const fetchSpy = vi.fn<Transport['fetch']>(async (_path) => jsonResponse(body, status));
  return { fetchSpy, transport: { fetch: fetchSpy } satisfies Transport };
}

describe('createSiteSettingsClient', () => {
  it('requests the direct site_settings collection path, not the cached content endpoint', async () => {
    const { fetchSpy, transport } = transportReturning({
      data: [makeRow()],
      meta: { count: 1 },
    });

    await createSiteSettingsClient(transport).getSiteSettings();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0];
    if (!call) throw new Error('expected fetch to have been called');
    const [path] = call;
    expect(path.startsWith('/api/site_settings?')).toBe(true);
    expect(path).not.toContain('/api/collections/site-settings/content');
  });

  it('filters to published rows and takes the most recently updated', async () => {
    const { fetchSpy, transport } = transportReturning({
      data: [makeRow()],
      meta: { count: 1 },
    });

    await createSiteSettingsClient(transport).getSiteSettings();

    const call = fetchSpy.mock.calls[0];
    if (!call) throw new Error('expected fetch to have been called');
    const [path] = call;
    expect(decodeURIComponent(path)).toContain('"field":"status","operator":"equals"');
    expect(decodeURIComponent(path)).toContain('"value":"published"');
    expect(path).toContain('sort=updated_at');
    expect(path).toContain('order=desc');
  });

  it('throws rather than inventing copy when the collection is empty', async () => {
    const { transport } = transportReturning({ data: [], meta: { count: 0 } });

    await expect(createSiteSettingsClient(transport).getSiteSettings()).rejects.toThrow(
      MissingSiteSettingsError,
    );
  });

  it('throws rather than inventing copy when the CMS errors', async () => {
    const { transport } = transportReturning({}, 500);

    await expect(createSiteSettingsClient(transport).getSiteSettings()).rejects.toThrow(
      MissingSiteSettingsError,
    );
  });

  it('takes CMS values over the placeholders', async () => {
    const { transport } = transportReturning({
      data: [makeRow({ siteName: 'A Real Name', tagline: 'A real tagline.' })],
      meta: { count: 1 },
    });

    const settings = await createSiteSettingsClient(transport).getSiteSettings();

    expect(settings.siteName).toBe('A Real Name');
    expect(settings.tagline).toBe('A real tagline.');
  });

  it('leaves a placeholder showing for a field the row does not fill', async () => {
    const { transport } = transportReturning({
      data: [makeRow({ siteName: 'A Real Name' })],
      meta: { count: 1 },
    });

    const settings = await createSiteSettingsClient(transport).getSiteSettings();

    // Visible in review beats silently absent — and assertNoPlaceholders stops
    // it reaching production either way.
    expect(settings.tagline).toBe(PLACEHOLDER_SITE_SETTINGS.tagline);
  });

  it('does not let a group saved with empty keys blank the placeholders', async () => {
    // SonicJS persists a nested object with every key present but empty when an
    // author saves the group before filling it in.
    const { transport } = transportReturning({
      data: [
        makeRow({
          philosophy: {
            railLabel: '',
            heading: 'Real heading',
            body: '',
            ctaLabel: '',
            ctaHref: '',
          },
        }),
      ],
      meta: { count: 1 },
    });

    const settings = await createSiteSettingsClient(transport).getSiteSettings();

    expect(settings.philosophy.heading).toBe('Real heading');
    expect(settings.philosophy.body).toBe(PLACEHOLDER_SITE_SETTINGS.philosophy.body);
  });

  it('ignores an empty array rather than rendering no navigation at all', async () => {
    const { transport } = transportReturning({
      data: [makeRow({ primaryNav: [] })],
      meta: { count: 1 },
    });

    const settings = await createSiteSettingsClient(transport).getSiteSettings();

    expect(settings.primaryNav).toEqual(PLACEHOLDER_SITE_SETTINGS.primaryNav);
  });
});

describe('findPlaceholders', () => {
  it('reports every unfilled field as a dotted path, including inside arrays', () => {
    const found = findPlaceholders(PLACEHOLDER_SITE_SETTINGS);

    expect(found).toContain('siteName');
    expect(found).toContain('philosophy.heading');
    expect(found).toContain('primaryNav[0].label');
    expect(found).toContain('footerColumns[0].links[0].label');
  });

  it('reports nothing when every string is filled', () => {
    const filled: SiteSettings = {
      ...PLACEHOLDER_SITE_SETTINGS,
      siteName: 'Name',
      tagline: 'Tagline',
      missionLine: 'Mission',
      primaryNav: [{ label: 'Food', href: '/food' }],
      tipJarLabel: 'Tips',
      tipJarHref: '/tips',
      searchPlaceholder: 'Search',
      searchPlaceholderMap: 'Search places',
      searchHints: [{ label: 'a query', href: '/q' }],
      tagLabels: [{ key: 'reviews', label: 'Reviews' }],
      philosophy: {
        railLabel: 'Start here',
        heading: 'Heading',
        body: 'Body',
        ctaLabel: 'Read',
        ctaHref: '/letter',
      },
      pledge: {
        statement: 'Statement',
        byline: 'Byline',
        newsletterLabel: 'Sign up',
        newsletterPlaceholder: 'you@example.com',
      },
      tipTiers: [{ amount: '$2', description: 'A coffee', href: '/tip/2' }],
      footerColumns: [{ heading: 'Read', links: [{ label: 'Food', href: '/food' }] }],
    };

    expect(findPlaceholders(filled)).toEqual([]);
  });
});

describe('assertNoPlaceholders', () => {
  it('throws for a production build that would ship placeholder text', () => {
    expect(() => {
      assertNoPlaceholders(PLACEHOLDER_SITE_SETTINGS);
    }).toThrow(/would ship as placeholder text/);
  });

  it('names the offending fields so the CMS edit is obvious', () => {
    expect(() => {
      assertNoPlaceholders(PLACEHOLDER_SITE_SETTINGS);
    }).toThrow(/siteName/);
  });
});
