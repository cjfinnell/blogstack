/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly CMS_URL?: string;
  readonly RENDER_MODE?: string;

  /**
   * Set by the CI fixture build only. Lets that one build render the
   * placeholder settings row; every other build refuses to.
   */
  readonly ALLOW_PLACEHOLDER_COPY?: string;

  /**
   * The design decisions that are Maria's to make. See src/brand.config.ts and
   * DESIGN-SPEC.md §1 — each has a default, so none of them blocks a build, and
   * a preview deploy can compare two variants without a commit.
   */
  readonly PUBLIC_WORDMARK_FACE?: string;
  readonly PUBLIC_BOW_FINISH?: string;
  readonly PUBLIC_BOW_SOURCE?: string;
  readonly PUBLIC_DISPLAY_FACE?: string;
  readonly PUBLIC_RANKING_SCOPE?: string;
  readonly PUBLIC_REVIEW_PHOTO_TREATMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
