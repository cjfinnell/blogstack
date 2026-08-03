import { postPublishedAt, postSlug, postTitle } from './client';
import type { Post } from './types';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface RssFeedOptions {
  posts: Post[];
  siteUrl: string;
  title: string;
  basePath: string;
}

export function buildRssFeed({ posts, siteUrl, title, basePath }: RssFeedOptions): string {
  const cleanSiteUrl = siteUrl.replace(/\/$/, '');

  const items = posts
    .map((post) => {
      const url = `${cleanSiteUrl}${basePath}/${postSlug(post)}/`;
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${cleanSiteUrl}</link>
    <description>Latest posts</description>
    ${items}
  </channel>
</rss>`;
}
