// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// SITE_URL is set per-deploy target; local dev and CI fixture builds fall
// back to localhost. See PLAN.md#anonymity — no hostname is hardcoded here.
//
// RENDER_MODE=ssr is the admin-draft build: dynamic per-request rendering
// against the Cloudflare adapter, so newly published/drafted CMS content
// shows without a redeploy. Every other deploy target stays the default
// static build — same app, same components, one build-time switch.
const ssr = process.env.RENDER_MODE === 'ssr';

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4324',
  output: ssr ? 'server' : 'static',
  ...(ssr ? { adapter: cloudflare() } : {}),
});
