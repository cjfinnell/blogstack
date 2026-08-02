import type { Transport } from './transport';
import type { ContentResponse, Post, PostType, ReviewMeta } from './types';

// Reads go to /api/blog_post, *not* the documented
// /api/collections/blog-posts/content. That documented path serves from a
// registry cache that does not see newly published rows; this one hits the
// database directly. See test/client.test.ts, which asserts the request path
// so nobody "fixes" this back to the broken one.
const COLLECTION_PATH = 'blog_post';

function publishedFilter(extra: Record<string, unknown>[] = []) {
  return encodeURIComponent(
    JSON.stringify({
      and: [{ field: 'status', operator: 'equals', value: 'published' }, ...extra],
    }),
  );
}

export function createBlogClient(transport: Transport) {
  async function getPublishedPosts(limit = 10, offset = 0): Promise<Post[]> {
    const where = publishedFilter();
    const res = await transport.fetch(
      `/api/${COLLECTION_PATH}?where=${where}&limit=${limit}&offset=${offset}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
    const { data } = (await res.json()) as ContentResponse;
    return data;
  }

  async function getPostBySlug(slug: string): Promise<Post | null> {
    const where = publishedFilter([{ field: 'data.slug', operator: 'equals', value: slug }]);
    const res = await transport.fetch(`/api/${COLLECTION_PATH}?where=${where}&limit=1`);
    if (!res.ok) throw new Error(`Failed to fetch post: ${res.status}`);
    const { data } = (await res.json()) as ContentResponse;
    return data[0] ?? null;
  }

  return { getPublishedPosts, getPostBySlug };
}

export type BlogClient = ReturnType<typeof createBlogClient>;

export function postSlug(post: Post): string {
  return post.data?.slug ?? post.slug;
}

export function postTitle(post: Post): string {
  return post.data?.title ?? post.title;
}

export function postPublishedAt(post: Post): string | null {
  return post.data?.publishedAt || null;
}

const POST_TYPES: PostType[] = ['essay', 'review'];

// Rows written before the review post type existed have no postType at all,
// and a future CMS-side value could reach a frontend that predates it. Both
// read as an essay rather than rendering nothing.
export function postType(post: Post): PostType {
  const value = post.data?.postType;
  return value && POST_TYPES.includes(value) ? value : 'essay';
}

export function reviewMeta(post: Post): ReviewMeta | null {
  if (postType(post) !== 'review') return null;
  const review = post.data?.review;
  if (!review || Object.keys(review).length === 0) return null;
  return review;
}
