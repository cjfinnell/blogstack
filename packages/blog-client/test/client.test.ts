import { describe, expect, it, vi } from 'vitest';
import { createBlogClient } from '../src/client';
import type { Transport } from '../src/transport';
import type { Post } from '../src/types';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: '1',
    slug: 'hello',
    title: 'Hello',
    status: 'published',
    collectionId: 'blog-posts',
    created_at: 0,
    updated_at: 0,
    data: {
      title: 'Hello',
      slug: 'hello',
      content: '{}',
      author: 'me',
      publishedAt: '2024-01-01T00:00:00.000Z',
    },
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe('createBlogClient', () => {
  it('requests the direct blog_post collection path, not the cached content endpoint', async () => {
    const fetchSpy = vi.fn(async (_path: string) => jsonResponse({ data: [], meta: { count: 0 } }));
    const transport: Transport = { fetch: fetchSpy };
    const client = createBlogClient(transport);

    await client.getPublishedPosts();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [path] = fetchSpy.mock.calls[0];
    expect(path.startsWith('/api/blog_post?')).toBe(true);
    expect(path).not.toContain('/api/collections/blog-posts/content');
  });

  it('encodes the published-status where filter', async () => {
    const fetchSpy = vi.fn(async (_path: string) => jsonResponse({ data: [], meta: { count: 0 } }));
    const client = createBlogClient({ fetch: fetchSpy });

    await client.getPublishedPosts();

    const [path] = fetchSpy.mock.calls[0];
    const where: unknown = JSON.parse(new URL(path, 'http://x').searchParams.get('where')!);
    expect(where).toEqual({ and: [{ field: 'status', operator: 'equals', value: 'published' }] });
  });

  it('adds a slug filter for getPostBySlug', async () => {
    const fetchSpy = vi.fn(async (_path: string) => jsonResponse({ data: [], meta: { count: 0 } }));
    const client = createBlogClient({ fetch: fetchSpy });

    await client.getPostBySlug('my-post');

    const [path] = fetchSpy.mock.calls[0];
    const url = new URL(path, 'http://x');
    const where: unknown = JSON.parse(url.searchParams.get('where')!);
    expect(where).toEqual({
      and: [
        { field: 'status', operator: 'equals', value: 'published' },
        { field: 'data.slug', operator: 'equals', value: 'my-post' },
      ],
    });
    expect(url.searchParams.get('limit')).toBe('1');
  });

  it('returns an empty array for an empty result set', async () => {
    const client = createBlogClient({
      fetch: async () => jsonResponse({ data: [], meta: { count: 0 } }),
    });
    expect(await client.getPublishedPosts()).toEqual([]);
  });

  it('returns null from getPostBySlug when no post matches', async () => {
    const client = createBlogClient({
      fetch: async () => jsonResponse({ data: [], meta: { count: 0 } }),
    });
    expect(await client.getPostBySlug('missing')).toBeNull();
  });

  it('returns posts as-is on success', async () => {
    const post = makePost();
    const client = createBlogClient({
      fetch: async () => jsonResponse({ data: [post], meta: { count: 1 } }),
    });
    expect(await client.getPublishedPosts()).toEqual([post]);
  });

  it('throws on a non-2xx response from getPublishedPosts', async () => {
    const client = createBlogClient({ fetch: async () => jsonResponse({ error: 'nope' }, 500) });
    await expect(client.getPublishedPosts()).rejects.toThrow(/500/);
  });

  it('throws on a non-2xx response from getPostBySlug', async () => {
    const client = createBlogClient({ fetch: async () => jsonResponse({ error: 'nope' }, 404) });
    await expect(client.getPostBySlug('x')).rejects.toThrow(/404/);
  });
});
