import { createBlogClient, httpTransport } from '@blogstack/blog-client';

// RENDER_MODE=ssr is the one signal that flips a deploy target from the
// published-only static build to the drafts-included admin-draft one — set
// per wrangler env, not passed as an argument at any call site. Every page
// keeps calling blog.getPublishedPosts()/getPostBySlug() verbatim either way.
export const blog = createBlogClient(
  httpTransport(import.meta.env.CMS_URL ?? 'http://localhost:8787'),
  { includeDrafts: import.meta.env.RENDER_MODE === 'ssr' },
);
