import type { APIRoute } from 'astro';
import { buildRssFeed } from '@blogstack/blog-client';
import { blog } from '@blogstack/astro-shared/blog';
import { siteTitle, basePath } from '../site';

export const prerender = import.meta.env.RENDER_MODE !== 'ssr';

export const GET: APIRoute = async ({ site }) => {
  const posts = await blog.getPublishedPosts(50);
  const siteUrl = site?.toString() ?? 'http://localhost:4322';

  const xml = buildRssFeed({ posts, siteUrl, title: siteTitle, basePath });

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
