import type { Transport } from './transport';
import type { ContentResponse, Post, PostType, ReviewMeta } from './types';

// Reads go to /api/blog_post, *not* the documented
// /api/collections/blog-posts/content. That documented path serves from a
// registry cache that does not see newly published rows; this one hits the
// database directly. See test/client.test.ts, which asserts the request path
// so nobody "fixes" this back to the broken one.
const COLLECTION_PATH = 'blog_post';

function postsFilter(includeDrafts: boolean, extra: Record<string, unknown>[] = []) {
  const clauses = includeDrafts
    ? extra
    : [{ field: 'status', operator: 'equals', value: 'published' }, ...extra];
  return encodeURIComponent(JSON.stringify({ and: clauses }));
}

export interface BlogClientOptions {
  // Baked in at construction, not threaded through per-call args or per-page
  // code — which client a deploy target builds decides whether drafts show,
  // not a flag callers have to remember to pass. See astro-shared/blog.ts,
  // the one place that reads the build-time RENDER_MODE env var.
  includeDrafts?: boolean;
}

export function createBlogClient(transport: Transport, opts: BlogClientOptions = {}) {
  const includeDrafts = opts.includeDrafts ?? false;

  async function getPublishedPosts(limit = 10, offset = 0): Promise<Post[]> {
    const where = postsFilter(includeDrafts);
    const res = await transport.fetch(
      `/api/${COLLECTION_PATH}?where=${where}&limit=${String(limit)}&offset=${String(offset)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch posts: ${String(res.status)}`);
    const { data } = (await res.json()) as ContentResponse;
    return data;
  }

  async function getPostBySlug(slug: string): Promise<Post | null> {
    const where = postsFilter(includeDrafts, [
      { field: 'data.slug', operator: 'equals', value: slug },
    ]);
    const res = await transport.fetch(`/api/${COLLECTION_PATH}?where=${where}&limit=1`);
    if (!res.ok) throw new Error(`Failed to fetch post: ${String(res.status)}`);
    const { data } = (await res.json()) as ContentResponse;
    return data[0] ?? null;
  }

  return { getPublishedPosts, getPostBySlug };
}

export type BlogClient = ReturnType<typeof createBlogClient>;

export function postSlug(post: Post): string {
  return post.data.slug ?? post.slug;
}

export function postTitle(post: Post): string {
  return post.data.title ?? post.title;
}

export function postPublishedAt(post: Post): string | null {
  return post.data.publishedAt ?? null;
}

const POST_TYPES: PostType[] = ['essay', 'review'];

// Rows written before the review post type existed have no postType at all,
// and a future CMS-side value could reach a frontend that predates it. Both
// read as an essay rather than rendering nothing.
export function postType(post: Post): PostType {
  const value = post.data.postType;
  return value && POST_TYPES.includes(value) ? value : 'essay';
}

// SonicJS can persist the review object with every key present but empty
// (e.g. the author flips postType to Review and saves before filling
// anything in) — an object with keys but no real values is still "no
// review" to the reader, same as a genuinely absent group.
function hasReviewContent(review: ReviewMeta): boolean {
  return Object.values(review).some(
    (v) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0),
  );
}

export function reviewMeta(post: Post): ReviewMeta | null {
  if (postType(post) !== 'review') return null;
  const review = post.data.review;
  if (!review || !hasReviewContent(review)) return null;
  return review;
}
