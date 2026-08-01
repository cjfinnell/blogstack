import { createSonicJSApp, registerCollections } from '@sonicjs-cms/core';
import type { SonicJSConfig } from '@sonicjs-cms/core';

import blogPostsCollection from './collections/blog-posts.collection';
import { publishHookPlugin } from './plugins/publish-hook';

registerCollections([blogPostsCollection]);

const config: SonicJSConfig = {
  plugins: {
    // @sonicjs-cms/core@3.0.0-beta.26: DefinedPlugin's `routes[].handler`
    // type (unknown) doesn't structurally satisfy Plugin's (Hono) under this
    // package's own declarations — a pre-existing gap in the beta's types,
    // not a runtime issue (the core example plugin hits the identical
    // error). Confirmed by typechecking sonicjs-blog-base unmodified.
    register: [publishHookPlugin] as NonNullable<SonicJSConfig['plugins']>['register'],
  },
};

export default createSonicJSApp(config);
