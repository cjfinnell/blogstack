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
