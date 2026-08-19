export const sites = {
  dev: { app: 'apps/web-dev', devPort: 4321, deployed: false },
  terminal: { app: 'apps/web-terminal', devPort: 4322, deployed: true },
  folio: { app: 'apps/web-folio', devPort: 4323, deployed: true },
  olive: { app: 'apps/web-olive', devPort: 4324, deployed: true },
} as const;

export type SiteId = keyof typeof sites;

export const siteIds = Object.keys(sites) as SiteId[];

export const deployedSiteIds = siteIds.filter((id) => sites[id].deployed);

// Admin-draft targets: same app (same component library, same templates —
// nothing duplicated) as their `cms` site, built with RENDER_MODE=ssr instead
// of the default static build, so drafts show without a redeploy. Not part
// of `sites` — a draft target deploys no CMS/D1/R2 of its own, it only ever
// reads the parent site's already-deployed CMS. Consumers that assume a
// site owns a full cms_*/web_*/preview_* triplet (release.ts,
// check-config-drift.ts) must not iterate this alongside `sites`.
interface DraftSiteConfig {
  app: string;
  devPort: number;
  cms: SiteId;
  // Not literal `true` like `sites`' deployed field currently is — a draft
  // target can flip to false independent of its parent site, so this stays
  // `boolean`, not narrowed by `as const`.
  deployed: boolean;
}

export const draftSites: Record<'terminal_draft' | 'folio_draft' | 'olive_draft', DraftSiteConfig> =
  {
    terminal_draft: { app: sites.terminal.app, devPort: 4332, cms: 'terminal', deployed: true },
    folio_draft: { app: sites.folio.app, devPort: 4333, cms: 'folio', deployed: true },
    olive_draft: { app: sites.olive.app, devPort: 4334, cms: 'olive', deployed: true },
  };

export type DraftSiteId = keyof typeof draftSites;

export const draftSiteIds = Object.keys(draftSites) as DraftSiteId[];

export const deployedDraftSiteIds = draftSiteIds.filter((id) => draftSites[id].deployed);
