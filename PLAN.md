# blogstack — design plan

Status: approved design, not yet implemented.
Date: 2026-08-01

A monorepo hosting one SonicJS CMS codebase deployed once per domain, plus a
per-domain Astro frontend, driven by a single wrangler config entrypoint.

## Goals

- One CMS source tree, N deploy targets — one per live domain.
- One config entrypoint (`wrangler.template.toml`), heavy environment scoping.
- Per-domain Astro frontends with genuinely independent look and feel.
- Public GitHub repo (unlimited Actions minutes) carrying no hostnames.
- `mise.toml` as the sole runtime version authority.

## Sites

| Theme | CMS host | Web host | Deployed |
|---|---|---|---|
| `dev` | localhost:8787 | localhost:4321 | no |
| `terminal` | `${TERMINAL_CMS_HOST}` | `${TERMINAL_WEB_HOST}` | yes |
| `folio` | `${FOLIO_CMS_HOST}` | `${FOLIO_WEB_HOST}` | yes |

`terminal` is the developer technical blog: monospace, high contrast,
code-first, dark default. It is also the canary — it gets PR preview
deploys.

`folio` is the minimalist professional portfolio: serif or humanist sans,
generous whitespace, typographic hierarchy, light default.

`dev` is an unbranded baseline UI bound to no domain. CI builds it against
fixtures on every PR, so a `blog-client` regression fails before any themed
app is touched. New themes start as a copy of it.

**No committed file maps a theme to a domain**, including this one. The
mapping lives in `.env.local`, in GitHub Environment secrets, and in an
appendix kept outside the repo. See [Anonymity](#anonymity).

## Decisions

| Question | Answer |
|---|---|
| Repo | `github.com/cjfinnell/blogstack`, public |
| Bootstrap | Fresh repo; copy from the two existing repos, which stay untouched |
| Config scope | One template covering CMS + all web targets, 7 env blocks |
| Config injection | `${VAR}` placeholders rendered by `gen-wrangler.ts` |
| Data isolation | Own D1 + own R2 per site; no tenant column |
| Rendering | SSG; transport seam keeps SSR a later swap |
| Publish flow | CMS hook fires `repository_dispatch`; Actions rebuilds that site |
| Web sharing | `packages/blog-client` (data only) |
| Themes | `dev` baseline, `terminal`, `folio` |
| Toolchain | `mise.toml`; CI hardcodes no versions |

### Why isolated D1 per site

Two independent blogs sharing only code. Separate admin logins, separate
content, no cross-domain queries, no tenant column to get wrong. Adding a
domain is a new database plus config, never a schema change. Cross-posting
was considered and rejected as YAGNI; the collections keep identical schemas
so a future merge into a shared pool stays possible.

### Why SSG

Reader requests hit Cloudflare's asset store directly — no Worker runs, no
D1 query, and asset requests are unmetered. TTFB is ~10-30ms anywhere.

The decisive argument is failure mode, not cost: with SSG, a CMS outage or a
D1 problem cannot take the blogs down, because the reader path has zero
runtime dependency on a beta CMS. Builds fail loudly instead, which is the
safe direction.

SSR would buy instant publishes and draft previews, at the cost of two Worker
invocations per page view, a D1 round trip to a single primary region on
every uncached render, and `@sonicjs-cms/core@3.0.0-beta.26` sitting on the
reader path. Not worth it for a personal blog. The seam in `blog-client`
exists so the decision stays reversible per-site.

## Anonymity

The repo is public and carries theme codenames only — no hostnames in any
committed file.

**This is portability and tidiness, not secrecy.** Every CMS hostname lands
in Certificate Transparency logs the moment Cloudflare issues a cert, the
blogs are public, and public-repo workflow logs are world-readable. The win
is that adding or changing a domain touches no committed file, and no scraper
gets a tidy list from the repo. Don't contort the design further for it.

Two mechanical constraints drive the implementation:

1. **Wrangler has no variable interpolation in its config.** No `${VAR}`
   support, and no CLI equivalent for `custom_domain = true`. Injection
   therefore means generating the file.
2. **GitHub's `secrets` context is unavailable in `strategy.matrix`.** Matrix
   can only read `vars`, which are echoed unmasked into public logs. So the
   matrix fans out over theme codenames, and each job resolves its hostname
   from that job's `environment:` secrets, which are masked as `***`.

Constraint 2 is the entire reason theme codenames exist.

D1 database IDs stay in the template. A UUID leaks nothing and requires an
account-scoped token to use.

## Layout

```
blogstack/
  PLAN.md
  mise.toml                    # sole version authority
  wrangler.template.toml       # committed, single config entrypoint
  wrangler.toml                # GENERATED, gitignored
  package.json                 # npm workspaces, no Turbo
  config/sites.ts              # theme registry, zero domains
  .env.example                 # committed, placeholder names only
  .env.local                   # gitignored, real hostnames
  apps/
    cms/                       # from sonicjs-blog-base; 3 deploy targets
      src/index.ts
      src/collections/blog-posts.collection.ts
      src/plugins/publish-hook/
      scripts/seed-admin.ts
    web-dev/
    web-terminal/
    web-folio/
  packages/
    blog-client/               # src/{transport,client,lexical,types}.ts
  scripts/
    gen-wrangler.ts
    check-config-drift.ts
    release.ts
  .github/workflows/{ci.yml,deploy.yml,preview.yml}
```

`packages/` ships with one member so promoting shared logic later is a file
move, not a restructure. No shared UI package in v1 — divergent design stays
cheap when there is no theme abstraction to fight.

## config/sites.ts

```ts
export const sites = {
  dev:      { app: 'apps/web-dev',      devPort: 4321, deployed: false },
  terminal: { app: 'apps/web-terminal', devPort: 4322, deployed: true },
  folio:    { app: 'apps/web-folio',    devPort: 4323, deployed: true },
} as const;

export type SiteId = keyof typeof sites;
```

Read by `gen-wrangler.ts`, `release.ts`, the drift check, and each app's
Astro config. Dev ports are pinned here so the `[env.dev]` `CORS_ORIGINS`
list stays correct without hand-editing.

## mise.toml

```toml
[tools]
node = "22.12.0"          # satisfies web engines >=22.12.0 and cms >=18

[env]
_.file = ".env.local"     # gitignored hostnames, auto-loaded for local dev
```

Nothing else pins a runtime version. CI never names one:

```yaml
- uses: actions/checkout@v4
- uses: jdx/mise-action@v2      # installs from mise.toml, caches tool dir
- run: npm ci
```

No `actions/setup-node`. Bumping Node is a one-line edit here.

`mise`'s `_.file` loads `.env.local` into the shell, so `gen-wrangler.ts`
reads hostnames from `process.env` with no dotenv dependency. Local and CI
take the same code path; CI just sources those vars from GitHub Environment
secrets instead of a file.

Scope boundary: **mise owns tools and env, npm scripts own tasks.** No
`[tasks]` block — two task runners is a tax with no payoff at this size.
`wrangler`, `astro`, and `vitest` stay npm devDependencies pinned by
`package-lock.json`, which is the lockfile that actually reproduces builds.

## wrangler.template.toml

```toml
name = "blogstack"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[observability]
enabled = true

# main is deliberately NOT top-level. Assets-only workers must omit it,
# and there is no way to un-inherit a key, so each cms_* env declares it.

# ---------- local dev CMS ----------
[env.dev]
name = "blogstack-cms-dev"
main = "apps/cms/src/index.ts"
workers_dev = true
vars = { ENVIRONMENT = "development", SITE_ID = "dev", CORS_ORIGINS = "http://localhost:4321,http://localhost:4322,http://localhost:4323" }
d1_databases = [{ binding = "DB", database_name = "blogstack-dev-db", database_id = "<uuid>", migrations_dir = "./node_modules/@sonicjs-cms/core/migrations" }]
r2_buckets = [{ binding = "MEDIA_BUCKET", bucket_name = "blogstack-dev-media" }]

[env.web_dev]
name = "blogstack-web-dev"
workers_dev = true
assets = { directory = "apps/web-dev/dist" }

# ---------- terminal ----------
[env.cms_terminal]
name = "blogstack-cms-terminal"
main = "apps/cms/src/index.ts"
workers_dev = false
routes = [{ pattern = "${TERMINAL_CMS_HOST}", custom_domain = true }]
vars = { ENVIRONMENT = "production", SITE_ID = "terminal", CORS_ORIGINS = "${TERMINAL_WEB_ORIGIN}", GITHUB_REPO = "cjfinnell/blogstack" }
d1_databases = [{ binding = "DB", database_name = "blogstack-terminal-db", database_id = "<uuid>", migrations_dir = "./node_modules/@sonicjs-cms/core/migrations" }]
r2_buckets = [{ binding = "MEDIA_BUCKET", bucket_name = "blogstack-terminal-media" }]

[env.web_terminal]
name = "blogstack-web-terminal"
workers_dev = false
preview_urls = true
assets = { directory = "apps/web-terminal/dist" }
routes = [{ pattern = "${TERMINAL_WEB_HOST}", custom_domain = true }]

# ---------- folio ---------- (same shape)
```

Two wrangler constraints shape this file:

- **Bindings are not inherited by environments.** `vars`, `d1_databases`,
  `r2_buckets`, `assets`, and `routes` must be redeclared in full in every
  block. That repetition is wrangler's, not a design choice — hence the drift
  check.
- **`main` stays out of the top level.** Assets-only workers must have no
  `main`, and a key cannot be un-inherited. Consequence: wrangler is never
  invoked without `--env`, and `release.ts` enforces it.

`gen-wrangler.ts` is a ~30-line `${VAR}` substitution over the template,
sourcing from `process.env`, failing hard if any `${` survives.
`wrangler.toml` is gitignored and regenerated before every wrangler call.

## packages/blog-client

One seam, chosen so an SSG→SSR flip is an adapter swap rather than a rewrite:

```ts
// transport.ts
export interface Transport {
  fetch(path: string, init?: RequestInit): Promise<Response>;
}

export function httpTransport(baseUrl: string): Transport {
  const base = baseUrl.replace(/\/$/, '');
  return { fetch: (path, init) => fetch(`${base}${path}`, init) };
}

// unused in v1; exists so SSR is a one-line change at the call site
export function serviceTransport(binding: Fetcher): Transport {
  return { fetch: (path, init) => binding.fetch(`https://cms.internal${path}`, init) };
}
```

```ts
// client.ts
export function createBlogClient(transport: Transport) {
  return { getPublishedPosts, getPostBySlug };
}
```

Each app wires its own instance:

```ts
// apps/web-terminal/src/lib/blog.ts
import { createBlogClient, httpTransport } from '@blogstack/blog-client';
export const blog = createBlogClient(httpTransport(import.meta.env.CMS_URL));
```

`types.ts` and `lexical.ts` port over from `sonicjs-blog-web` unchanged, plus
tests they currently lack.

**Preserve one existing finding:** reads go to `/api/blog_post`, *not* the
documented `/api/collections/blog-posts/content`. That documented path serves
from a registry cache that does not see newly published rows. The explanatory
comment stays and a test asserts the request path, so nobody "fixes" it back
to the broken one.

## Publish webhook

CMS-side plugin at `apps/cms/src/plugins/publish-hook/`, registered on
`blog_post` publish:

```
POST https://api.github.com/repos/{GITHUB_REPO}/dispatches
  Authorization: Bearer <GITHUB_DISPATCH_TOKEN>
  { "event_type": "cms-publish", "client_payload": { "site": env.SITE_ID } }
```

Fired inside `ctx.waitUntil` so a slow GitHub call never blocks the admin
save; failures land in Workers observability rather than surfacing as a save
error.

### Token security

`repository_dispatch` requires a fine-grained PAT with **Contents: write**.
That is a token which can push commits to `blogstack`, stored as a secret
inside a CMS Worker running beta software behind a public admin login.

- Scope it to the `blogstack` repository only.
- Set the shortest expiry you will tolerate re-issuing.
- Rotate on any suspected CMS compromise.
- The workflow validates `client_payload.site` against the allowed site list
  before using it. That does not contain a stolen token, but it stops a
  malformed or spoofed payload from steering the deploy matrix.

### Unverified assumption

**Whether `@sonicjs-cms/core@3.0.0-beta.26` exposes a content-lifecycle hook
is unconfirmed.** The example plugin's docstring claims hooks exist, which is
suggestive, not proof. Task 0 is a spike into
`node_modules/@sonicjs-cms/core`. If no usable hook exists, the fallback is
running `npm run release -- --site terminal` by hand, and every other part of
this design stands unchanged.

## GitHub Actions

Two workflows split on whether they need secrets, plus previews.

**`ci.yml`** — `pull_request` + `push`. Fully hermetic, zero secrets, so fork
PRs run clean. checkout → `mise-action` → `npm ci` → typecheck → vitest →
build `web-dev` against fixtures. Never touches Cloudflare.

**`deploy.yml`** — `push: [main]`, `repository_dispatch: [cms-publish]`,
`workflow_dispatch`.

```yaml
jobs:
  resolve:      # -> matrix JSON
    # dispatch  -> [client_payload.site], validated against vars.SITES
    # push main -> sites whose app changed; all sites if
    #              packages/** or wrangler.template.toml changed
    # manual    -> chosen site
  deploy-cms:   # only when apps/cms/** or template changed
    environment: ${{ matrix.site }}
    # gen-wrangler -> d1 migrations apply --remote
    #              -> wrangler deploy --env cms_${{ matrix.site }}
  deploy-web:
    environment: ${{ matrix.site }}
    # gen-wrangler -> astro build (CMS_URL, SITE_URL from env secrets)
    #              -> wrangler deploy --env web_${{ matrix.site }}
```

Migrations run before the code deploy — additive schema first, then the
worker that uses it.

**`preview.yml`** — `pull_request` from same-repo branches only
(`head.repo.full_name == github.repository`, since fork PRs get no secrets).
Builds sites in `vars.PREVIEW_SITES` against the **dev** CMS, then
`wrangler versions upload --env web_terminal` — which uploads a version
without shifting production traffic — and comments the preview URL. Requires
`preview_urls = true`. Preview content is dev content, not production
content; that is the tradeoff for not exposing prod data on PR builds.

Repo variables: `SITES=["terminal","folio"]`, `PREVIEW_SITES=["terminal"]`
(JSON, for `fromJSON`).

## Local development

```
mise install && npm ci
cp .env.example .env.local     # fill in real hostnames, gitignored
npm run dev:cms                # gen-wrangler + wrangler dev --env dev, :8787
npm run db:migrate:local && npm run seed
npm run dev:web terminal       # astro dev :4322, CMS_URL=http://localhost:8787
```

`npm run release -- --site terminal` runs the exact gen → build → deploy
sequence CI does. Deliberate: the manual escape hatch and the automated path
cannot drift, and it is the fallback if the hook spike fails.

## Testing

`vitest` at the workspace root, three layers.

**`blog-client` units** — mock `Transport`, no network. Cover `where` filter
encoding, the exact request path (guarding the registry-cache trap), empty
result sets, non-2xx handling, and `lexical.ts` against captured fixtures.

**Config drift check, run as a test** — the highest-value test here, because
7 hand-authored env blocks with duplicated names are this design's main
failure mode. Parses the rendered `wrangler.toml` with `smol-toml` and
asserts:

- every `deployed` site has both `cms_<site>` and `web_<site>` blocks
- `assets.directory` equals `sites[site].app + '/dist'`
- D1 name is `blogstack-<site>-db`, bucket is `blogstack-<site>-media`
- **no unrendered `${` survives** — catches a missing GitHub Environment
  secret before deploy rather than after
- the `mise.toml` node version satisfies every workspace's `engines.node`
- `[env.dev]` `CORS_ORIGINS` lists exactly the `devPort`s in `sites.ts`

On PRs it renders against `.env.example` dummies, so it needs no secrets and
fork PRs still run it.

**Build smoke** — `web-dev` builds in CI against a fixture HTTP server
serving canned `/api/blog_post` JSON. Hermetic, no live CMS. Themed apps
build only in the deploy path, where a real CMS exists.

## Provisioning runbook (one-time, per site)

Cloudflare: create D1 `blogstack-<site>-db` and R2
`blogstack-<site>-media`. The zone must already be in the account for
`custom_domain = true` to attach DNS.

Worker secrets, per CMS env:

```
wrangler secret put BETTER_AUTH_SECRET    --env cms_terminal
wrangler secret put GITHUB_DISPATCH_TOKEN --env cms_terminal
```

GitHub Environment `terminal` (and `folio`): `CF_API_TOKEN`,
`CF_ACCOUNT_ID`, `CMS_HOST`, `WEB_HOST`, `WEB_ORIGIN`.
Repo variables: `SITES`, `PREVIEW_SITES`.

The CF API token needs roughly Workers Scripts:Edit, D1:Edit, and R2
Storage:Edit at account scope, plus Workers Routes:Edit on each zone.
**Confirm the exact set against Cloudflare's UI at provisioning time** rather
than trusting this list — token scopes shift between dashboard revisions.

## Out of scope for v1

SSR and draft previews (the seam exists, unused). Comments, search,
tags/categories. Image optimization. A shared UI package. Cross-posting
between sites. Turbo/Nx. A third domain — though adding one should be: a new
`sites.ts` entry, a copy of `web-dev`, two template blocks, and one GitHub
Environment.

## Build sequence

Each step is one commit on the implementation branch.

0. **Spike:** does `@sonicjs-cms/core` expose a content-lifecycle hook?
   Gates the publish webhook only.
1. Scaffold: `mise.toml`, npm workspaces, `.env.example`, `.gitignore`.
2. CMS in; D1/R2 renamed; template + `gen-wrangler.ts`; deploy `env.dev`.
3. Extract `blog-client` from `sonicjs-blog-web`; add tests.
4. `web-dev` on top of it; CI green.
5. `web-terminal`: theme, provision its domain, deploy.
6. `web-folio`: theme, provision its domain, deploy.
7. Publish hook, `deploy.yml`, `preview.yml`.
8. Archive the two source repos.

## Source repos

Both stay untouched on disk and are archived only at step 8.

- /Users/cfin/repos/sonicjs-blog-base — SonicJS CMS, D1 + R2, one commit.
- /Users/cfin/repos/sonicjs-blog-web — Astro 7 SSG frontend, two commits.

`sonicjs-blog-base/PLAN-astro-frontend.md` is superseded by this document and
is not carried over.
