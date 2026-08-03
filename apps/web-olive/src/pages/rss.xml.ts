import type { APIRoute } from 'astro';
import { postPublishedAt, postSlug, postTitle } from '@blogstack/blog-client';
import { blog } from '../lib/blog';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const posts = await blog.getPublishedPosts(50);
  const siteUrl = (site?.toString() ?? 'http://localhost:4321').replace(/\/$/, '');

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/posts/${postSlug(post)}/`;
      const publishedAt = postPublishedAt(post);
      return `
    <item>
      <title>${escapeXml(postTitle(post))}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      ${publishedAt ? `<pubDate>${new Date(publishedAt).toUTCString()}</pubDate>` : ''}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog</title>
    <link>${siteUrl}</link>
    <description>Latest posts</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
