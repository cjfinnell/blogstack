import type { CollectionConfig } from '@sonicjs-cms/core';

export default {
  name: 'blog_post',
  displayName: 'Blog Post',
  slug: 'blog-posts',
  description: 'Manage your blog posts',
  icon: '📝',

  schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        title: 'Title',
        required: true,
        maxLength: 200,
      },
      slug: {
        type: 'slug',
        title: 'URL Slug',
        required: true,
        maxLength: 200,
      },
      content: {
        type: 'lexical',
        title: 'Content',
        required: true,
        // This description is the only thing standing between an API client and
        // an unrenderable post. @sonicjs-cms/core's MCP schema converter has no
        // case for `lexical`, so the field is advertised to agents as a plain
        // string with no hint of what belongs in it, and nothing on the write
        // path validates the value. `description` is one of the two FieldConfig
        // keys the converter copies into the emitted JSON Schema, so it reaches
        // the client verbatim. Keep it exact.
        description:
          'Serialized HTML, NOT prose and NOT markdown — the same markup the admin editor writes, so that ' +
          'a post created through the API can still be opened and amended in the editor. Supported tags: p, ' +
          'h1–h6, ul, ol, li, blockquote, figure, figcaption, img, br, a, strong, em, s, u, code, span. Code ' +
          'blocks are an authoring convention rather than markup: put ``` fences and `backticks` in as ' +
          'literal text inside a <p>, with lines joined by <br>, and the frontend lifts them out. Footnotes ' +
          'likewise: [^1] markers inline, and a trailing <h2>Notes</h2> followed by an <ol> — both must be ' +
          'bare tags with no attributes or the footnote pass will not match. Build this with ' +
          'markdownToEditorHtml() from @blogstack/blog-client rather than by hand, and check it with ' +
          'assertContentShape(); plain text written here is stored as-is and rendered as raw markup, so it ' +
          'will look correct while being wrong.',
      },
      author: {
        type: 'user',
        title: 'Author',
        required: true,
      },
      publishedAt: {
        type: 'datetime',
        title: 'Published Date',
      },
      postType: {
        type: 'select',
        title: 'Post Type',
        enum: ['essay', 'review'],
        enumLabels: ['Essay', 'Restaurant Review'],
        default: 'essay',
        helpText: 'Reviews get a structured header. Everything else is an essay.',
      },
      review: {
        type: 'object',
        title: 'Review Details',
        dependsOn: 'postType',
        showWhen: 'review',
        collapsed: false,
        objectLayout: 'nested',
        properties: {
          restaurant: { type: 'string', title: 'Restaurant', maxLength: 200 },
          city: { type: 'string', title: 'City', maxLength: 120 },
          visitedAt: { type: 'date', title: 'Visited On' },
          rating: { type: 'number', title: 'Rating', min: 1, max: 4 },
          ratingScaleMax: { type: 'number', title: 'Rating Scale Max', default: 4 },
          pricePerPerson: { type: 'number', title: 'Price Per Person' },
          verdictSummary: {
            type: 'textarea',
            title: 'Verdict Summary',
            maxLength: 400,
            helpText: 'One or two sentences. Used on cards and as the meta description.',
          },
          recommendation: { type: 'textarea', title: 'Recommendation', maxLength: 1000 },
          bestOccasion: { type: 'string', title: 'Best Occasion', maxLength: 200 },
          bestDishes: { type: 'string', title: 'Best Dishes', maxLength: 300 },
          cuisineTags: {
            type: 'array',
            title: 'Cuisine Tags',
            items: { type: 'string' },
          },
          photos: {
            type: 'array',
            title: 'Photos',
            items: { type: 'media' },
          },
        },
      },
    },
    required: ['title', 'slug', 'content', 'author'],
  },

  listFields: ['title', 'postType', 'author', 'status', 'publishedAt'],
  searchFields: ['title', 'content', 'author'],
  defaultSort: 'createdAt',
  defaultSortOrder: 'desc',

  managed: true,
  isActive: true,

  // Opt in to public read access. Without this, only authenticated users
  // (admin/editor) can read content via the API. See docs/authentication.md.
  access: {
    public: ['read'],
  },

  // Per-collection cache override. TTL in seconds; falls back to the cache plugin
  // default (CACHE_CONFIGS.api.ttl, currently 300s) if unset.
  cache: {
    enabled: true,
    ttl: 5,
  },
} satisfies CollectionConfig;
