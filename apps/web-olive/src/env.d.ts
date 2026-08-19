/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly CMS_URL?: string;
  readonly RENDER_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
