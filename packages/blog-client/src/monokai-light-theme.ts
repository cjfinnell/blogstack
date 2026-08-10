import type { ThemeRegistration } from 'shiki';

// Shiki ships only the classic dark Monokai. The `terminal` site theme's
// light-mode chrome (packages/astro-shared/src/themes.ts) was hand-derived
// from this same palette — same accent hues, swapped bg/fg/muted — so
// codeblocks match the page instead of falling back to an unrelated theme.
// Token scopes below are Monokai's own, verbatim; only bg/fg/comment change.
export const monokaiLight: ThemeRegistration = {
  name: 'monokai-light',
  type: 'light',
  fg: '#272822',
  bg: '#fafaf8',
  colors: {
    'editor.background': '#fafaf8',
    'editor.foreground': '#272822',
  },
  tokenColors: [
    { settings: { foreground: '#272822' } },
    {
      scope: [
        'meta.embedded',
        'source.groovy.embedded',
        'string meta.image.inline.markdown',
        'variable.legacy.builtin.python',
      ],
      settings: { foreground: '#272822' },
    },
    { scope: 'comment', settings: { foreground: '#75715e' } },
    { scope: 'string', settings: { foreground: '#e6db74' } },
    {
      scope: ['punctuation.definition.template-expression', 'punctuation.section.embedded'],
      settings: { foreground: '#f92672' },
    },
    { scope: ['meta.template.expression'], settings: { foreground: '#272822' } },
    { scope: 'constant.numeric', settings: { foreground: '#ae81ff' } },
    { scope: 'constant.language', settings: { foreground: '#ae81ff' } },
    { scope: 'constant.character, constant.other', settings: { foreground: '#ae81ff' } },
    { scope: 'variable', settings: { fontStyle: '', foreground: '#272822' } },
    { scope: 'keyword', settings: { foreground: '#f92672' } },
    { scope: 'storage', settings: { fontStyle: '', foreground: '#f92672' } },
    { scope: 'storage.type', settings: { fontStyle: 'italic', foreground: '#66d9ef' } },
    {
      scope:
        'entity.name.type, entity.name.class, entity.name.namespace, entity.name.scope-resolution',
      settings: { fontStyle: 'underline', foreground: '#a6e22e' },
    },
    {
      scope: ['entity.other.inherited-class', 'punctuation.separator.namespace.ruby'],
      settings: { fontStyle: 'italic underline', foreground: '#a6e22e' },
    },
    { scope: 'entity.name.function', settings: { fontStyle: '', foreground: '#a6e22e' } },
    { scope: 'variable.parameter', settings: { fontStyle: 'italic', foreground: '#fd971f' } },
    { scope: 'entity.name.tag', settings: { fontStyle: '', foreground: '#f92672' } },
    { scope: 'entity.other.attribute-name', settings: { fontStyle: '', foreground: '#a6e22e' } },
    { scope: 'support.function', settings: { fontStyle: '', foreground: '#66d9ef' } },
    { scope: 'support.constant', settings: { fontStyle: '', foreground: '#66d9ef' } },
    {
      scope: 'support.type, support.class',
      settings: { fontStyle: 'italic', foreground: '#66d9ef' },
    },
    { scope: 'support.other.variable', settings: { fontStyle: '' } },
    { scope: 'invalid', settings: { fontStyle: '', foreground: '#f44747' } },
    { scope: 'invalid.deprecated', settings: { foreground: '#f44747' } },
    {
      scope: 'meta.structure.dictionary.json string.quoted.double.json',
      settings: { foreground: '#75715e' },
    },
    { scope: 'meta.diff, meta.diff.header', settings: { foreground: '#75715e' } },
    { scope: 'markup.deleted', settings: { foreground: '#f92672' } },
    { scope: 'markup.inserted', settings: { foreground: '#a6e22e' } },
    { scope: 'markup.changed', settings: { foreground: '#e6db74' } },
    {
      scope: 'constant.numeric.line-number.find-in-files - match',
      settings: { foreground: '#ae81ffa0' },
    },
    { scope: 'entity.name.filename.find-in-files', settings: { foreground: '#e6db74' } },
    { scope: 'markup.quote', settings: { foreground: '#f92672' } },
    { scope: 'markup.list', settings: { foreground: '#e6db74' } },
    { scope: 'markup.bold, markup.italic', settings: { foreground: '#66d9ef' } },
    { scope: 'markup.inline.raw', settings: { fontStyle: '', foreground: '#fd971f' } },
    { scope: 'markup.heading', settings: { foreground: '#a6e22e' } },
    { scope: 'markup.heading.setext', settings: { fontStyle: 'bold', foreground: '#a6e22e' } },
    { scope: 'markup.heading.markdown', settings: { fontStyle: 'bold' } },
    { scope: 'markup.quote.markdown', settings: { fontStyle: 'italic', foreground: '#75715e' } },
    { scope: 'markup.bold.markdown', settings: { fontStyle: 'bold' } },
    {
      scope: 'string.other.link.title.markdown,string.other.link.description.markdown',
      settings: { foreground: '#ae81ff' },
    },
    {
      scope: 'markup.underline.link.markdown,markup.underline.link.image.markdown',
      settings: { foreground: '#e6db74' },
    },
    { scope: 'markup.italic.markdown', settings: { fontStyle: 'italic' } },
    { scope: 'markup.strikethrough', settings: { fontStyle: 'strikethrough' } },
    {
      scope: 'markup.list.unnumbered.markdown, markup.list.numbered.markdown',
      settings: { foreground: '#272822' },
    },
    {
      scope: ['punctuation.definition.list.begin.markdown'],
      settings: { foreground: '#a6e22e' },
    },
    { scope: 'token.info-token', settings: { foreground: '#6796e6' } },
    { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
    { scope: 'token.error-token', settings: { foreground: '#f44747' } },
    { scope: 'token.debug-token', settings: { foreground: '#b267e6' } },
    { scope: 'variable.language', settings: { foreground: '#fd971f' } },
  ],
};
