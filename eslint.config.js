// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.astro/**',
      '**/.wrangler/**',
      '**/.mf/**',
      '**/coverage/**',
      '**/node_modules/**',
      'wrangler.toml',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...astro.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        // astro-eslint-parser doesn't support projectService; fall back to
        // the plain `project: true` form it does support, to silence its warning.
        projectService: false,
        project: true,
      },
    },
    rules: {
      // Astro components frequently use top-level await and untyped frontmatter;
      // type-aware TS rules don't apply cleanly inside .astro frontmatter blocks.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: globals.node,
    },
  },
  {
    files: ['**/test/**/*.ts', '**/*.test.ts'],
    rules: {
      // Mocks commonly return a plain value where the mocked type expects a
      // Promise; wrapping in `async` is the idiomatic way to satisfy that
      // shape without a real await.
      '@typescript-eslint/require-await': 'off',
    },
  },
  eslintConfigPrettier,
);
