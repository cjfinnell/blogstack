import type { APIRoute } from 'astro';
import { buildRssFeed } from '@blogstack/blog-client';
import { blog } from '@blogstack/astro-shared/blog';
import { getSettings } from '../lib/settings';

// The feed title is the site name, which is copy and therefore comes from the
// CMS like everything else a reader sees. The base path is structure, so it
// stays here.
const BASE_PATH = '/posts';

export const prerender = import.meta.env.RENDER_MODE !== 'ssr';

export const GET: APIRoute = async ({ site }) => {
  const [posts, settings] = await Promise.all([blog.getPublishedPosts(50), getSettings()]);
  const siteUrl = site?.toString() ?? 'http://localhost:4324';

  const xml = buildRssFeed({
    posts,
    siteUrl,
    title: settings.siteName,
    basePath: BASE_PATH,
  });

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
