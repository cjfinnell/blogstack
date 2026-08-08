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
  // Plain-JS recommended rule set (no type information required).
  js.configs.recommended,
  // Highest type-aware tiers typescript-eslint ships:
  // - strictTypeChecked: every recommendedTypeChecked rule plus the rules
  //   that catch likely bugs but aren't "safe enough" for recommended
  //   (no-unnecessary-condition, no-non-null-assertion, prefer-nullish-coalescing, ...).
  // - stylisticTypeChecked: consistency rules (consistent-type-imports,
  //   prefer-optional-chain, etc.) that need type info to apply correctly.
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // Astro-specific correctness rules (unused CSS selectors, invalid
  // frontmatter, etc.) plus the strict a11y rule set bundled with the
  // plugin, since our .astro templates render markup by hand with no
  // framework-level a11y linting elsewhere in the pipeline.
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-strict'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      // Error (not warn) so `npm run lint` fails the build on dead code;
      // `_`-prefixed args stay exempt for intentionally-unused callback params.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
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
    // Plain JS config/script files aren't part of any tsconfig `include`,
    // so type-aware rules would error with "not found in project" instead
    // of linting anything useful; fall back to the non-type-checked rules.
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
  // Must stay last: turns off every ESLint stylistic rule that would
  // conflict with Prettier, which owns formatting instead.
  eslintConfigPrettier,
);
