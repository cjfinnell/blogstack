# .github/workflows

| Workflow                | Trigger                                                                                   | Does                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `ci.yml`                | pull request, push to `main`                                                              | lint, format-check, typecheck, test, build (via Makefile targets) |
| `deploy.yml`            | push to `main`, CMS publish webhook (`repository_dispatch`), manual (`workflow_dispatch`) | Deploys production sites                                          |
| `preview.yml`           | pull request opened/synced/closed                                                         | Builds/tears down per-PR preview Workers                          |
| `preview-reconcile.yml` | nightly schedule                                                                          | Sweeps orphaned preview Workers/Environments                      |

## Deploying

`deploy.yml` deploys on push to `main`, on a CMS publish webhook
(`repository_dispatch`), or manually (`workflow_dispatch`). One job per site
does CMS-then-web, serialized per site and never cancelled mid-flight. The
same sequence is available locally as the manual escape hatch:

```
npm run release -- --site terminal
```

Each site's job also builds and deploys that site's admin-draft Worker right
after its normal (static) web deploy — same app, rebuilt with
`RENDER_MODE=ssr`, so it renders drafts+published against the same CMS the
job just deployed. Not a separate matrix entry, not a separate GitHub
Environment: it reuses the job's own `CMS_HOST` and only needs one more
secret, `WEB_DRAFT_HOST`/`WEB_DRAFT_ORIGIN` (see Required secrets below). The
manual escape hatch for a draft target is:

```
npm run release -- --site terminal_draft
```

## Previews

Each PR gets its own Worker per site in `vars.PREVIEW_SITES`, named
`blogstack-web-<site>-pr-<N>`, on workers.dev with no route and no custom
domain. It is built against the dev CMS, so previews never render production
content or embed a production hostname.

Previews run in a per-PR GitHub Environment (`pr-<N>-<site>`), deliberately not
the site's production Environment — a PR must never be handed production
credentials or hostnames. `ci-gen-wrangler` (see
[`scripts/README.md`](../../scripts/README.md)) enforces this: `PREVIEW=1`
fails if any production host secret is in scope.

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

## Required secrets

Environment secrets, per deployed site (`terminal`, `folio`, `olive`) — production only:

| Secret                               | Purpose                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `CF_API_TOKEN`, `CF_ACCOUNT_ID`      | Deploy credentials for that site                                                   |
| `CMS_HOST`, `WEB_HOST`, `WEB_ORIGIN` | That site's hostnames                                                              |
| `D1_ID`                              | That site's D1 database id, substituted into `wrangler.toml`                       |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`      | That site's CMS admin login, (re)seeded after every CMS deploy                     |
| `WEB_DRAFT_HOST`, `WEB_DRAFT_ORIGIN` | That site's admin-draft hostnames — reads the same `CMS_HOST` above, no new CMS/D1 |

Repository secrets — used by the preview, cleanup and reconcile jobs, which are
not scoped to a production Environment. A same-named Environment secret wins for
deploy jobs, so these do not weaken production scoping:

| Secret                                  | Purpose                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `CF_API_TOKEN`, `CF_ACCOUNT_ID`         | Deploy and teardown, for every workflow                                                                             |
| `DEV_CMS_URL`                           | Dev CMS that previews build against                                                                                 |
| `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD` | Dev CMS admin login, (re)seeded by `preview-cms` on every CMS-touching PR                                           |
| `DEV_D1_ID`                             | Shared dev CMS's D1 database id, substituted into `wrangler.toml`'s `env.dev` block                                 |
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
