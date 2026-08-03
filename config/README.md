# config

`sites.ts` is the single theme registry: codename, app path, local dev port,
and whether the site is actually deployed (`dev` is a CI fixture target,
not deployed).

No committed file maps a codename to a hostname. That mapping lives in
`.env.local` (gitignored) and GitHub Environment secrets, not in this repo —
see [`.github/workflows/README.md`](../.github/workflows/README.md) for how
those secrets flow into a deploy.
