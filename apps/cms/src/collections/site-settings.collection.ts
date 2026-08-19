import type { CollectionConfig } from '@sonicjs-cms/core';

/**
 * Every readable string in the site chrome.
 *
 * The design constraint is that no user-visible copy lives in frontend source.
 * A label she cannot change from the CMS is a label she has to ask an engineer
 * to change, which is the failure mode this collection exists to prevent.
 *
 * What stays in code is structure, not copy: route paths, taxonomy keys, and
 * the design toggles in the frontend's brand.config.ts, which select between
 * built assets and typefaces rather than saying anything. Renaming a tag here
 * therefore never migrates content — the key is stable, only the label moves.
 *
 * This is a one-row collection. The frontend reads the most recently updated
 * published row and fails the build if there is none, rather than silently
 * shipping placeholder English that nobody can edit.
 */
export default {
  name: 'site_settings',
  displayName: 'Site Settings',
  slug: 'site-settings',
  description: 'Site-wide names, navigation labels and standing copy',
  icon: '⚙️',

  schema: {
    type: 'object',
    properties: {
      siteName: {
        type: 'string',
        title: 'Site Name',
        required: true,
        maxLength: 120,
        helpText: 'The wordmark, the page titles, and every link preview.',
      },
      tagline: {
        type: 'string',
        title: 'Tagline',
        maxLength: 200,
        helpText: 'One line under the homepage masthead. Seven words can do the whole job.',
      },
      missionLine: {
        type: 'string',
        title: 'Footer Mission Line',
        maxLength: 200,
        helpText: 'Sits beside the bow in the footer, on every page.',
      },

      primaryNav: {
        type: 'array',
        title: 'Primary Navigation',
        helpText: 'The centred nav. Deliberately short — four items is the design.',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', title: 'Label', required: true, maxLength: 40 },
            href: { type: 'string', title: 'Path', required: true, maxLength: 200 },
          },
        },
      },
      tipJarLabel: {
        type: 'string',
        title: 'Tip Jar Label',
        maxLength: 40,
        helpText: 'The pill at the end of the nav.',
      },
      tipJarHref: { type: 'string', title: 'Tip Jar Path', maxLength: 200 },

      searchPlaceholder: {
        type: 'string',
        title: 'Search Placeholder',
        maxLength: 160,
      },
      searchPlaceholderMap: {
        type: 'string',
        title: 'Search Placeholder (map page)',
        maxLength: 160,
      },
      searchHints: {
        type: 'array',
        title: 'Example Searches',
        helpText: 'Shown under the homepage search. These teach the archive in one line.',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', title: 'Query', required: true, maxLength: 80 },
            href: { type: 'string', title: 'Path', required: true, maxLength: 200 },
          },
        },
      },

      tagLabels: {
        type: 'array',
        title: 'Tag Labels',
        helpText:
          'Display names only. The key is what the content is stored against and never changes, so renaming "Food Ed" here migrates nothing.',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string', title: 'Key', required: true, maxLength: 40 },
            label: { type: 'string', title: 'Label', required: true, maxLength: 60 },
          },
        },
      },

      philosophy: {
        type: 'object',
        title: 'Philosophy Block',
        objectLayout: 'nested',
        collapsed: false,
        properties: {
          railLabel: { type: 'string', title: 'Rail Label', maxLength: 40 },
          heading: { type: 'string', title: 'Heading', maxLength: 200 },
          body: { type: 'textarea', title: 'Body', maxLength: 800 },
          ctaLabel: { type: 'string', title: 'Link Label', maxLength: 80 },
          ctaHref: { type: 'string', title: 'Link Path', maxLength: 200 },
        },
      },

      pledge: {
        type: 'object',
        title: 'The Pledge',
        objectLayout: 'nested',
        collapsed: false,
        properties: {
          statement: { type: 'textarea', title: 'Statement', maxLength: 600 },
          byline: { type: 'string', title: 'Byline', maxLength: 300 },
          newsletterLabel: { type: 'string', title: 'Newsletter Button', maxLength: 80 },
          newsletterPlaceholder: { type: 'string', title: 'Email Placeholder', maxLength: 80 },
        },
      },

      tipTiers: {
        type: 'array',
        title: 'Tip Jar Tiers',
        items: {
          type: 'object',
          properties: {
            amount: { type: 'string', title: 'Amount', required: true, maxLength: 40 },
            description: { type: 'string', title: 'Description', required: true, maxLength: 160 },
            href: { type: 'string', title: 'Path', maxLength: 200 },
          },
        },
      },

      footerColumns: {
        type: 'array',
        title: 'Footer Columns',
        items: {
          type: 'object',
          properties: {
            heading: { type: 'string', title: 'Heading', required: true, maxLength: 40 },
            links: {
              type: 'array',
              title: 'Links',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string', title: 'Label', required: true, maxLength: 60 },
                  href: { type: 'string', title: 'Path', required: true, maxLength: 200 },
                },
              },
            },
          },
        },
      },
    },
    required: ['siteName'],
  },

  listFields: ['siteName', 'status', 'updatedAt'],
  searchFields: ['siteName', 'tagline'],
  defaultSort: 'updatedAt',
  defaultSortOrder: 'desc',

  managed: true,
  isActive: true,

  // Same rationale as blog_post: without this, only authenticated users can
  // read it, and a static build has no session. See docs/authentication.md.
  access: {
    public: ['read'],
  },

  cache: {
    enabled: true,
    ttl: 5,
  },
} satisfies CollectionConfig;
