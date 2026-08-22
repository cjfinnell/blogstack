import type { CollectionConfig } from '@sonicjs-cms/core';

/**
 * The site chrome's copy — one document per string.
 *
 * This used to live in the `global-variables` core plugin, which was the wrong
 * home for it. That plugin exists to substitute `{key}` tokens *inside* prose:
 * an editor writes `{site_name}` in a post, its `content:read` hook replaces it
 * on the way out, and a "Var" button in the rich-text editor inserts the chips.
 * Nothing in it is built to be a settings store read wholesale by a frontend.
 * Using it as one meant a value edited there was substituted, unescaped, into
 * every post body the CMS served — and post bodies are rendered with `set:html`
 * — while its own write routes carried no authentication and its API sat on a
 * path core's `/api/:collection` wildcard swallows.
 *
 * A collection has none of those problems. Reads come from `/api/site_copy`,
 * the same route family as `/api/blog_post`; writes go through core's content
 * routes behind `requireAuth()` + `requireRole()` and the document ACL; the
 * admin gets a working editor for it; and nothing here is ever spliced into
 * someone else's prose.
 *
 * Flat key/value rather than one document with sixty fields, because
 * packages/blog-client/src/placeholders.ts is data-driven: adding `nav_5_label`
 * and `nav_5_href` adds a fifth nav item with no code change, and that property
 * is worth more than a tidier form. `key` carries the same `^[a-z0-9_]+$`
 * convention the old store enforced — the frontend looks strings up by it.
 *
 * Documents must be *published* to be readable: core forces `is_published = 1`
 * for anonymous reads, and the build reads anonymously. A draft edit to a
 * string is therefore invisible to a production build until it is published,
 * which is the same lifecycle posts have.
 */
export default {
  name: 'site_copy',
  displayName: 'Site Copy',
  slug: 'site-copy',
  description: 'Every readable string in the site chrome — masthead, navigation, footer, forms',
  icon: '🪧',

  schema: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        title: 'Key',
        required: true,
        maxLength: 64,
        helpText:
          'Lowercase, digits and underscores. The frontend looks this string up by key, so renaming one here unfills it on the site until the code that reads it changes too. See packages/blog-client/src/placeholders.ts for the full list.',
      },
      value: {
        type: 'textarea',
        title: 'Value',
        maxLength: 2000,
        helpText:
          'The words a reader sees. Left unedited, the site ships the seeded default — an upper-cased version of the key, e.g. SITE_NAME — so an unfilled string is obvious on the live page.',
      },
      description: {
        type: 'textarea',
        title: 'What this is for',
        maxLength: 500,
        helpText: 'A note to whoever edits this next. Says where the string appears.',
      },
      category: {
        type: 'string',
        title: 'Category',
        maxLength: 40,
        helpText:
          'Groups the list: identity, navigation, search, tags, philosophy, pledge, tip-jar, footer. Free text, so a new group needs no code change.',
      },
    },
  },

  searchFields: ['key', 'value', 'description'],
  defaultSort: 'title',
  defaultSortOrder: 'asc',

  managed: true,
  isActive: true,

  // The build reads these anonymously, exactly as it reads posts. Without this
  // every string in the chrome would need a credential to fetch.
  access: {
    public: ['read'],
  },

  // Read once per build and edited by hand a few times a year, so a short TTL
  // costs nothing and means an edit shows up in the next build rather than five
  // minutes later.
  cache: {
    enabled: true,
    ttl: 5,
  },
} satisfies CollectionConfig;
