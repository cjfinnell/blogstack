export const sites = {
  dev: { app: 'apps/web-dev', devPort: 4321, deployed: false },
  terminal: { app: 'apps/web-terminal', devPort: 4322, deployed: true },
  folio: { app: 'apps/web-folio', devPort: 4323, deployed: true },
} as const;

export type SiteId = keyof typeof sites;

export const siteIds = Object.keys(sites) as SiteId[];

export const deployedSiteIds = siteIds.filter((id) => sites[id].deployed);
