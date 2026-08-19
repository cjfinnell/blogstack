import { describe, expect, it } from 'vitest';

import siteCopyCollection from '../src/collections/site-copy.collection';

describe('site_copy collection', () => {
  // Three places hardcode this name: the collection, the path blog-client reads
  // (`/api/site_copy`), and the typeId scripts/seed-site-copy.ts writes. Renaming
  // it in one place alone seeds orphan documents and leaves the site unfilled.
  it('is named site_copy', () => {
    expect(siteCopyCollection.name).toBe('site_copy');
  });

  it('carries the fields the frontend reads by', () => {
    const properties = siteCopyCollection.schema.properties;
    expect(Object.keys(properties)).toEqual(['key', 'value', 'description', 'category']);
    expect(properties.key.required).toBe(true);
  });

  // The build fetches these with no credentials. Without public read the chrome
  // would come back 403 and every production build would fail.
  it('allows public reads', () => {
    expect(siteCopyCollection.access.public).toContain('read');
  });
});
