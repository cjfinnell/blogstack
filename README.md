# blogstack

A monorepo hosting one [SonicJS](https://sonicjs.com) CMS codebase deployed
once per domain, plus a per-domain [Astro](https://astro.build) frontend,
driven by a single wrangler config entrypoint. Static output only — readers
never hit a Worker or a database.

No committed file maps a theme to a domain. Sites are referred to by
codename (`dev`, `terminal`, `folio`); the codename-to-hostname mapping lives
in `.env.local` (gitignored) and GitHub Environment secrets, not in this
repo.

## Layout

```
apps/
  cms/               SonicJS CMS — one codebase, deployed per site
  web-dev/            unbranded baseline frontend, CI fixture target
  web-terminal/        developer-blog theme
  web-folio/            portfolio theme
packages/
  blog-client/       shared data client (fetch + lexical rendering), no UI
config/sites.ts      theme registry
scripts/             gen-wrangler, config-drift check, release, CI helpers
wrangler.template.toml  single wrangler config, one env block per deploy target
```

## Getting started

Requires [mise](https://mise.jdx.dev) for the pinned Node version.

```
mise install && npm ci
cp .env.example .env.local     # fill in real hostnames, gitignored
npm run dev:cms                # wrangler dev --env dev, :8787
npm run db:migrate:local && npm run seed
npm run dev:web -- terminal    # astro dev, :4322
```

## Scripts

| Command                            | Does                                                    |
| ---------------------------------- | ------------------------------------------------------- |
| `npm run dev:cms`                  | Local CMS dev server                                    |
| `npm run dev:web -- <site>`        | Local Astro dev server for a site                       |
| `npm run gen-wrangler`             | Renders `wrangler.toml` from the template               |
| `npm run db:migrate:local`         | Applies D1 migrations to the local dev DB               |
| `npm run seed`                     | Creates the local admin user (`ADMIN_PASSWORD=...`)     |
| `npm run typecheck`                | Typechecks every workspace                              |
| `npm run test`                     | Runs the vitest suite, including the config-drift check |
| `npm run build:web-dev`            | Builds `web-dev` against a fixture CMS (what CI runs)   |
| `npm run release -- --site <site>` | Full gen → migrate → deploy sequence for one site       |

## Testing

`vitest` at the workspace root: `blog-client` unit tests (mocked transport,
no network) and a config-drift check that renders `wrangler.template.toml`
against `.env.example` dummies and asserts the hand-authored env blocks stay
consistent with `config/sites.ts`. Both run with no secrets, so fork PRs get
full CI.

## Deploying

`.github/workflows/deploy.yml` deploys on push to `main`, on a CMS publish
webhook (`repository_dispatch`), or manually (`workflow_dispatch`). One job per
site does CMS-then-web, serialized per site and never cancelled mid-flight. The
same sequence is available locally as the manual escape hatch:

```
npm run release -- --site terminal
```

## Previews

Each PR gets its own Worker per site in `vars.PREVIEW_SITES`, named
`blogstack-web-<site>-pr-<N>`, on workers.dev with no route and no custom
domain. It is built against the dev CMS, so previews never render production
content or embed a production hostname.

Previews run in a per-PR GitHub Environment (`pr-<N>-<site>`), deliberately not
the site's production Environment — a PR must never be handed production
credentials or hostnames. `ci-gen-wrangler` enforces this: `PREVIEW=1` fails if
any production host secret is in scope.

When the PR closes, `preview.yml`'s cleanup job deletes the Worker, marks the
deployments inactive, deletes them, and deletes the Environment.
`preview-reconcile.yml` sweeps nightly for orphans, since a `closed` webhook can
be dropped entirely.

This is a per-PR Worker rather than `wrangler versions upload` because
Cloudflare has no per-version or per-alias delete — a version-based preview
outlives its PR — and because a preview version would otherwise sit in the
production Worker's version history, one `wrangler versions deploy` away from
serving live traffic. `preview_urls` is correspondingly `false` on the
production env blocks, enforced by the config-drift check.

The dev CMS itself is a single durable shared instance (`env.dev`), not
per-PR. A `resolve` job three-dot-diffs each PR against its merge base
(`scripts/resolve-deploy-matrix.ts`, same file-path check `deploy.yml` uses
for production); if the PR touched `apps/cms/` or `wrangler.template.toml`,
the `preview-cms` job applies D1 migrations, deploys `--env dev`, seeds the
admin user, and posts a sticky `/admin`-link comment — all before the web
preview matrix builds, so a PR's own schema changes land before the site
that renders them. Web-only PRs skip `preview-cms` entirely and build
against whatever `env.dev` already has deployed. `preview-cms` runs are
serialized across PRs (not per-PR) since they share one instance; there is
no per-PR isolation and no nightly reset — fix-forward only, same posture as
production.

### Required secrets

Environment secrets, per deployed site (`terminal`, `folio`) — production only:

| Secret                               | Purpose                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| `CF_API_TOKEN`, `CF_ACCOUNT_ID`      | Deploy credentials for that site                               |
| `CMS_HOST`, `WEB_HOST`, `WEB_ORIGIN` | That site's hostnames                                          |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`      | That site's CMS admin login, (re)seeded after every CMS deploy |

Repository secrets — used by the preview, cleanup and reconcile jobs, which are
not scoped to a production Environment. A same-named Environment secret wins for
deploy jobs, so these do not weaken production scoping:

| Secret                                  | Purpose                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `CF_API_TOKEN`, `CF_ACCOUNT_ID`         | Deploy and teardown, for every workflow                                                                             |
| `DEV_CMS_URL`                           | Dev CMS that previews build against                                                                                 |
| `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD` | Dev CMS admin login, (re)seeded by `preview-cms` on every CMS-touching PR                                           |
| `GH_ADMIN_TOKEN`                        | Fine-grained PAT, Administration: Read and write. `GITHUB_TOKEN` cannot delete Environments at any permission level |

Repository **variables**:

| Variable                 | Purpose                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `SITES`, `PREVIEW_SITES` | Deploy and preview matrices                                          |
| `CF_WORKERS_SUBDOMAIN`   | Account workers.dev subdomain, to compute a preview's own `SITE_URL` |

`CF_WORKERS_SUBDOMAIN` must be a variable, not a secret. A secret is masked to
`***` everywhere it appears, including inside the resolved `environment.url`,
which then is not a valid URL — GitHub silently drops it and the deployments
page loses its link. The value is not sensitive: it appears verbatim in the
preview URL posted to every PR.

## License

[MIT](LICENSE)
