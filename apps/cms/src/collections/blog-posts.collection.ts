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
          bestDishes: {
            type: 'string',
            title: 'Best Dishes (legacy)',
            maxLength: 300,
            helpText:
              'Superseded by "What we ordered" below. Kept so older reviews still render; leave it alone on anything new.',
          },
          cuisineTags: {
            type: 'array',
            title: 'Cuisine Tags',
            items: { type: 'string' },
          },

          heroPhoto: {
            type: 'object',
            title: 'Lead Photograph',
            objectLayout: 'nested',
            helpText: 'The one image at the top. It loads eagerly, so give it the best shot.',
            properties: {
              src: { type: 'media', title: 'Image' },
              alt: {
                type: 'string',
                title: 'Alt Text',
                maxLength: 300,
                helpText:
                  'What is in the photograph, for anyone who cannot see it. Required — nobody can write this for you.',
              },
              caption: { type: 'string', title: 'Caption', maxLength: 300 },
              credit: { type: 'string', title: 'Photograph Credit', maxLength: 160 },
            },
          },
          photos: {
            type: 'array',
            title: 'Photos',
            helpText: 'Everything else. Each needs its own alt text.',
            items: {
              type: 'object',
              properties: {
                src: { type: 'media', title: 'Image' },
                alt: { type: 'string', title: 'Alt Text', maxLength: 300 },
                caption: { type: 'string', title: 'Caption', maxLength: 300 },
                credit: { type: 'string', title: 'Photograph Credit', maxLength: 160 },
              },
            },
          },

          // The highest-value field on the whole review: dish, photograph and a
          // verdict each. This was one free-text line before.
          dishes: {
            type: 'array',
            title: 'What We Ordered',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', title: 'Dish', required: true, maxLength: 200 },
                note: { type: 'textarea', title: 'What it was like', maxLength: 600 },
                verdict: {
                  type: 'select',
                  title: 'Verdict',
                  enum: ['', 'must', 'skip'],
                  enumLabels: ['No flag', 'Must order', 'Skip'],
                },
                photo: {
                  type: 'object',
                  title: 'Photograph',
                  objectLayout: 'nested',
                  properties: {
                    src: { type: 'media', title: 'Image' },
                    alt: { type: 'string', title: 'Alt Text', maxLength: 300 },
                  },
                },
              },
            },
          },

          // Seven axes, the same seven every time, so two reviews can be
          // compared without reading both. The composite is derived at render
          // time and never stored — storing it would let the two drift.
          axes: {
            type: 'object',
            title: 'The Seven Axes',
            objectLayout: 'nested',
            collapsed: false,
            helpText:
              'Scored out of 10. The composite is the unweighted mean, so a beautiful room cannot buy its way out of an opaque supply chain.',
            properties: {
              food: { type: 'number', title: 'Food quality', min: 0, max: 10 },
              vegan: { type: 'number', title: 'Vegan-friendliness', min: 0, max: 10 },
              service: { type: 'number', title: 'Service', min: 0, max: 10 },
              ambiance: { type: 'number', title: 'Ambiance', min: 0, max: 10 },
              value: { type: 'number', title: 'Value', min: 0, max: 10 },
              ethics: { type: 'number', title: 'Ownership & ethics', min: 0, max: 10 },
              supply: { type: 'number', title: 'Supply transparency', min: 0, max: 10 },
            },
          },
          scoreState: {
            type: 'select',
            title: 'Scored?',
            enum: ['scored', 'unrated'],
            enumLabels: ['Scored', 'Unrated — not enough visits'],
            default: 'scored',
            helpText:
              'Unrated is a real answer, and it shows as one rather than as a missing number.',
          },

          // A review is not finished when it is published; it is updated when
          // the restaurant changes.
          revisits: {
            type: 'array',
            title: 'Living Updates',
            items: {
              type: 'object',
              properties: {
                date: { type: 'date', title: 'Date', required: true },
                visitNumber: { type: 'number', title: 'Visit number', min: 1 },
                note: {
                  type: 'textarea',
                  title: 'What changed',
                  required: true,
                  maxLength: 600,
                  helpText: 'Including which scores moved, and from what to what.',
                },
              },
            },
          },
          updatedAt: { type: 'datetime', title: 'Last Updated' },
          nextRevisit: { type: 'date', title: 'Next Scheduled Revisit' },

          address: { type: 'string', title: 'Address', maxLength: 300 },
          neighbourhood: { type: 'string', title: 'Neighbourhood', maxLength: 120 },
          geo: {
            type: 'object',
            title: 'Coordinates',
            objectLayout: 'nested',
            helpText: 'Five decimal places or more, or it is not worth publishing.',
            properties: {
              lat: { type: 'number', title: 'Latitude' },
              lng: { type: 'number', title: 'Longitude' },
            },
          },
          placeId: {
            type: 'string',
            title: 'Google Place ID',
            maxLength: 200,
            helpText: 'Disambiguates chains far better than a name does.',
          },
          gettingIn: { type: 'textarea', title: 'Getting In', maxLength: 400 },
          damage: {
            type: 'string',
            title: 'The Damage',
            maxLength: 200,
            helpText:
              'What dinner actually cost, in a sentence. The price band scans; this is the use.',
          },
          badges: {
            type: 'array',
            title: 'Badges',
            items: { type: 'string' },
          },

          disclosures: {
            type: 'object',
            title: 'Disclosures',
            objectLayout: 'nested',
            properties: {
              howWeAte: { type: 'textarea', title: 'How we ate', maxLength: 600 },
              ownership: { type: 'textarea', title: 'Ownership', maxLength: 600 },
              supplyChain: { type: 'textarea', title: 'Supply chain', maxLength: 600 },
              interview: { type: 'textarea', title: 'Interview', maxLength: 600 },
            },
          },

          // No opening hours field, on purpose. She will not keep them updated,
          // and a wrong opening time is worse than none.
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
