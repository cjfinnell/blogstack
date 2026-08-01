import { createBlogClient, httpTransport } from '@blogstack/blog-client';

export const blog = createBlogClient(httpTransport(import.meta.env.CMS_URL ?? 'http://localhost:8787'));
