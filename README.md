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

| Command | Does |
|---|---|
| `npm run dev:cms` | Local CMS dev server |
| `npm run dev:web -- <site>` | Local Astro dev server for a site |
| `npm run gen-wrangler` | Renders `wrangler.toml` from the template |
| `npm run db:migrate:local` | Applies D1 migrations to the local dev DB |
| `npm run seed` | Creates the local admin user (`ADMIN_PASSWORD=...`) |
| `npm run typecheck` | Typechecks every workspace |
| `npm run test` | Runs the vitest suite, including the config-drift check |
| `npm run build:web-dev` | Builds `web-dev` against a fixture CMS (what CI runs) |
| `npm run release -- --site <site>` | Full gen → migrate → deploy sequence for one site |

## Testing

`vitest` at the workspace root: `blog-client` unit tests (mocked transport,
no network) and a config-drift check that renders `wrangler.template.toml`
against `.env.example` dummies and asserts the hand-authored env blocks stay
consistent with `config/sites.ts`. Both run with no secrets, so fork PRs get
full CI.

## Deploying

`.github/workflows/deploy.yml` deploys on push to `main`, on a CMS publish
webhook (`repository_dispatch`), or manually (`workflow_dispatch`). The same
sequence is available locally as the manual escape hatch:

```
npm run release -- --site terminal
```

## License

[MIT](LICENSE)
