// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL is set per-deploy target; local dev and CI fixture builds fall
// back to localhost. See PLAN.md#anonymity — no hostname is hardcoded here.
export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4324',
});
