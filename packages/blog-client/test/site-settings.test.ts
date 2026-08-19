import { describe, expect, it, vi } from 'vitest';
import {
  assembleSettings,
  assertNoPlaceholders,
  createSiteSettingsClient,
  findPlaceholders,
  MissingSiteSettingsError,
} from '../src/site-settings';
import { PLACEHOLDER_VARIABLES, SETTING_KEYS } from '../src/placeholders';
import type { Transport } from '../src/transport';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function transportReturning(body: unknown, status = 200) {
  const fetchSpy = vi.fn<Transport['fetch']>(async (_path) => jsonResponse(body, status));
  return { fetchSpy, transport: { fetch: fetchSpy } satisfies Transport };
}

/** A fully-filled variable map, so nothing trips the placeholder guard. */
function filledVariables(): Record<string, string> {
  return Object.fromEntries(
    SETTING_KEYS.map((k) => [k.key, k.placeholder === '/' ? '/somewhere' : `real ${k.key}`]),
  );
}

describe('createSiteSettingsClient', () => {
  it('reads the global-variables plugin resolve route', async () => {
    const { fetchSpy, transport } = transportReturning({
      success: true,
      data: PLACEHOLDER_VARIABLES,
    });

    await createSiteSettingsClient(transport).getSiteSettings();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0];
    if (!call) throw new Error('expected fetch to have been called');
    expect(call[0]).toBe('/api/global-variables/resolve');
  });

  it('throws rather than inventing copy when the CMS errors', async () => {
    const { transport } = transportReturning({}, 500);

    await expect(createSiteSettingsClient(transport).getSiteSettings()).rejects.toThrow(
      MissingSiteSettingsError,
    );
  });

  // A CMS older than 3.0.0-beta.26 never mounted the plugin routes, so the
  // catch-all collection route answers instead. The error has to point at that,
  // not at a missing variable.
  it('throws when the plugin route is not mounted', async () => {
    const { transport } = transportReturning({ error: 'Collection not found' }, 404);

    await expect(createSiteSettingsClient(transport).getSiteSettings()).rejects.toThrow(
      /global-variables/,
    );
  });

  it('throws when the plugin reports failure', async () => {
    const { transport } = transportReturning({ success: false, data: {} });

    await expect(createSiteSettingsClient(transport).getSiteSettings()).rejects.toThrow(
      MissingSiteSettingsError,
    );
  });
});

describe('assembleSettings', () => {
  it('takes CMS values over the placeholders', () => {
    const settings = assembleSettings({ ...PLACEHOLDER_VARIABLES, site_name: 'A Real Name' });

    expect(settings.siteName).toBe('A Real Name');
  });

  it('leaves a placeholder showing for a variable that is missing', () => {
    const rest = { ...PLACEHOLDER_VARIABLES };
    delete rest.site_name;
    const settings = assembleSettings(rest);

    // Visible in review beats silently absent, and assertNoPlaceholders stops
    // it reaching production either way.
    expect(settings.siteName).toBe(PLACEHOLDER_VARIABLES.site_name);
  });

  it('treats an empty variable as unfilled rather than rendering nothing', () => {
    const settings = assembleSettings({ ...PLACEHOLDER_VARIABLES, tagline: '   ' });

    expect(settings.tagline).toBe(PLACEHOLDER_VARIABLES.tagline);
  });

  it('builds indexed groups from the flat keys', () => {
    const settings = assembleSettings({
      ...filledVariables(),
      nav_1_label: 'Food',
      nav_1_href: '/food',
      nav_2_label: 'Wine',
      nav_2_href: '/wine',
    });

    expect(settings.primaryNav[0]).toEqual({ label: 'Food', href: '/food' });
    expect(settings.primaryNav[1]).toEqual({ label: 'Wine', href: '/wine' });
  });

  it('grows a group when the editor adds another indexed key', () => {
    const vars = filledVariables();
    vars.nav_5_label = 'Shop';
    vars.nav_5_href = '/shop';

    // Data-driven: a fifth nav item needs no code change.
    expect(assembleSettings(vars).primaryNav).toHaveLength(5);
  });

  it('stops at the first gap rather than appending across it', () => {
    const vars = filledVariables();
    delete vars.nav_3_label;
    vars.nav_9_label = 'Stray';
    vars.nav_9_href = '/stray';

    const labels = assembleSettings(vars).primaryNav.map((n) => n.label);
    expect(labels).toHaveLength(2);
    expect(labels).not.toContain('Stray');
  });

  it('keys tag labels by the stable key, not the display name', () => {
    const settings = assembleSettings({ ...filledVariables(), tag_food_ed: 'Cooking School' });

    const foodEd = settings.tagLabels.find((t) => t.key === 'food-ed');
    expect(foodEd?.label).toBe('Cooking School');
  });

  it('nests footer links under their column', () => {
    const settings = assembleSettings({
      ...filledVariables(),
      footer_1_heading: 'Read',
      footer_1_link_1_label: 'Food',
      footer_1_link_1_href: '/food',
    });

    expect(settings.footerColumns[0]?.heading).toBe('Read');
    expect(settings.footerColumns[0]?.links[0]).toEqual({ label: 'Food', href: '/food' });
  });
});

describe('findPlaceholders', () => {
  it('reports every unfilled field as a dotted path, including inside arrays', () => {
    const found = findPlaceholders(assembleSettings(PLACEHOLDER_VARIABLES));

    expect(found).toContain('siteName');
    expect(found).toContain('philosophy.heading');
    expect(found).toContain('primaryNav[0].label');
    expect(found).toContain('footerColumns[0].links[0].label');
  });

  it('reports nothing when every variable is filled', () => {
    expect(findPlaceholders(assembleSettings(filledVariables()))).toEqual([]);
  });
});

describe('assertNoPlaceholders', () => {
  it('throws for a production build that would ship placeholder text', () => {
    expect(() => {
      assertNoPlaceholders(assembleSettings(PLACEHOLDER_VARIABLES));
    }).toThrow(/would ship as placeholder text/);
  });

  it('points the reader at the admin page to fix it', () => {
    expect(() => {
      assertNoPlaceholders(assembleSettings(PLACEHOLDER_VARIABLES));
    }).toThrow(/\/admin\/global-variables/);
  });

  it('passes once every variable is filled', () => {
    expect(() => {
      assertNoPlaceholders(assembleSettings(filledVariables()));
    }).not.toThrow();
  });
});
