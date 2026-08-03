# blogstack

A monorepo hosting one [SonicJS](https://sonicjs.com) CMS codebase deployed
once per domain, plus a per-domain [Astro](https://astro.build) frontend,
driven by a single wrangler config entrypoint. Static output only — readers
never hit a Worker or a database.

No committed file maps a theme to a domain. Sites are referred to by
codename (`dev`, `terminal`, `folio`, `olive`); the codename-to-hostname
mapping lives in `.env.local` (gitignored) and GitHub Environment secrets,
not in this repo.

## Layout

```
apps/
  cms/               SonicJS CMS — one codebase, deployed per site
  web-dev/            unbranded baseline frontend, CI fixture target
  web-terminal/        developer-blog theme
  web-folio/            portfolio theme
  web-olive/            restaurant-review + essay theme
packages/
  blog-client/       shared data client (fetch + lexical rendering), no UI
  astro-shared/      shared Astro layouts/components + per-site theme presets
config/sites.ts      theme registry, see config/README.md
scripts/             gen-wrangler, config-drift check, release, CI helpers, see scripts/README.md
wrangler.template.toml  single wrangler config, one env block per deploy target
```

## Getting started

Requires [mise](https://mise.jdx.dev) for the pinned Node version.

```
mise install && make install
cp .env.example .env.local     # fill in real hostnames, gitignored
npm run dev:cms                # wrangler dev --env dev, :8787
npm run db:migrate:local && npm run seed
npm run dev:web -- terminal    # astro dev, :4322
```

Full script reference: [`scripts/README.md`](scripts/README.md). Full CI/CD
and preview reference: [`.github/workflows/README.md`](.github/workflows/README.md).

## Testing

`vitest` at the workspace root: `blog-client` unit tests (mocked transport,
no network) and a config-drift check that renders `wrangler.template.toml`
against `.env.example` dummies and asserts the hand-authored env blocks stay
consistent with `config/sites.ts`. Both run with no secrets, so fork PRs get
full CI. Details: [`scripts/README.md`](scripts/README.md).

## Deploying & previews

`deploy.yml` deploys on push to `main`; `preview.yml` builds a per-PR Worker
per site against the dev CMS. Full reference, including required secrets:
[`.github/workflows/README.md`](.github/workflows/README.md).

Manual deploy escape hatch:

```
npm run release -- --site terminal
```

## License

[MIT](LICENSE)
