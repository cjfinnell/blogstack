/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly CMS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
