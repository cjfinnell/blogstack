// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// SITE_URL is set per-deploy target; local dev and CI fixture builds fall
// back to localhost. See PLAN.md#anonymity — no hostname is hardcoded here.
//
// RENDER_MODE=ssr is the admin-draft build: dynamic per-request rendering
// against the Cloudflare adapter, so newly published/drafted CMS content
// shows without a redeploy. Every other deploy target stays the default
// static build — same app, same components, one build-time switch.
const ssr = process.env.RENDER_MODE === 'ssr';

// The wordmark face is Maria's decision (DESIGN-SPEC.md §1, Q1) and is read
// from the same environment variable that `src/brand.config.ts` reads, so a
// preview deploy can compare two faces without a commit. Only the selected
// face is fetched — the identity sheet loaded all three because it was a
// comparison sheet, and the product must not.
//
// This map is duplicated from brand.config.ts on purpose: astro.config runs in
// Node before the Astro module graph exists, so it cannot import from src/.
/** @type {Record<string, string>} */
const WORDMARK_FAMILY = {
  'monsieur-la-doulaise': 'Monsieur La Doulaise',
  'miss-fajardose': 'Miss Fajardose',
  'pinyon-flourish': 'Pinyon Script',
};
const DEFAULT_WORDMARK = 'Monsieur La Doulaise';
const wordmarkFace = process.env.PUBLIC_WORDMARK_FACE ?? '';
const wordmarkFamily = WORDMARK_FAMILY[wordmarkFace] ?? DEFAULT_WORDMARK;

// Post bodies embed images uploaded to the CMS. The static build optimizes
// them with getImage() (see optimizePostImages), which only fetches remote
// hosts listed here. Read from CMS_URL, never hardcoded, for the same
// anonymity reason as SITE_URL.
const cmsHost = process.env.CMS_URL ? new URL(process.env.CMS_URL).hostname : null;

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4324',
  output: ssr ? 'server' : 'static',
  // `compile` keeps the draft Worker off the Cloudflare Images binding the
  // adapter otherwise defaults to: drafts render body images as the CMS
  // originals, and only the static build resizes them.
  ...(ssr ? { adapter: cloudflare({ imageService: 'compile' }) } : {}),
  image: { domains: cmsHost ? [cmsHost] : [] },
  // The workspace packages ship raw TypeScript with extensionless imports.
  // Externalized, `astro dev` hands them to Node's resolver, which cannot
  // follow `./client` to `client.ts`; Vite has to transform them instead.
  vite: { ssr: { noExternal: [/^@blogstack\//] } },
  fonts: [
    {
      // The script mark. One weight, one style — it sets two words and nothing
      // else, ever.
      provider: fontProviders.google(),
      name: wordmarkFamily,
      cssVariable: '--font-script',
      weights: [400],
      styles: ['normal'],
      fallbacks: ['Snell Roundhand', 'cursive'],
      // A cursive fallback cannot be metric-matched to a copperplate script
      // without making the swap worse than the shift. The masthead reserves
      // its own height instead — see Wordmark.astro.
      optimizedFallbacks: false,
    },
    {
      provider: fontProviders.google(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-display',
      weights: ['300 700'],
      styles: ['normal', 'italic'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Karla',
      cssVariable: '--font-body',
      weights: ['300 700'],
      styles: ['normal', 'italic'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
  ],
});
