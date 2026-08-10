import type { ThemeRegistration } from 'shiki';

// Shiki ships only the classic dark Monokai. The `terminal` site theme's
// light-mode chrome (packages/astro-shared/src/themes.ts) was hand-derived
// from this same palette — same accent hues, swapped bg/fg/muted — so
// codeblocks match the page instead of falling back to an unrelated theme.
// Token scopes below mirror Monokai's own, but each accent is darkened to
// clear ~4.5:1 contrast against the #fafaf8 background: Monokai's yellow,
// green and cyan are tuned for a near-black editor and read as barely-there
// pastel on white. Keyword/tag reuses the theme's own accent (#c4265e).
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
    { scope: 'string', settings: { foreground: '#7a6300' } },
    {
      scope: ['punctuation.definition.template-expression', 'punctuation.section.embedded'],
      settings: { foreground: '#c4265e' },
    },
    { scope: ['meta.template.expression'], settings: { foreground: '#272822' } },
    { scope: 'constant.numeric', settings: { foreground: '#6b3fd6' } },
    { scope: 'constant.language', settings: { foreground: '#6b3fd6' } },
    { scope: 'constant.character, constant.other', settings: { foreground: '#6b3fd6' } },
    { scope: 'variable', settings: { fontStyle: '', foreground: '#272822' } },
    { scope: 'keyword', settings: { foreground: '#c4265e' } },
    { scope: 'storage', settings: { fontStyle: '', foreground: '#c4265e' } },
    { scope: 'storage.type', settings: { fontStyle: 'italic', foreground: '#0c7075' } },
    {
      scope:
        'entity.name.type, entity.name.class, entity.name.namespace, entity.name.scope-resolution',
      settings: { fontStyle: 'underline', foreground: '#427000' },
    },
    {
      scope: ['entity.other.inherited-class', 'punctuation.separator.namespace.ruby'],
      settings: { fontStyle: 'italic underline', foreground: '#427000' },
    },
    { scope: 'entity.name.function', settings: { fontStyle: '', foreground: '#427000' } },
    { scope: 'variable.parameter', settings: { fontStyle: 'italic', foreground: '#8c5c00' } },
    { scope: 'entity.name.tag', settings: { fontStyle: '', foreground: '#c4265e' } },
    { scope: 'entity.other.attribute-name', settings: { fontStyle: '', foreground: '#427000' } },
    { scope: 'support.function', settings: { fontStyle: '', foreground: '#0c7075' } },
    { scope: 'support.constant', settings: { fontStyle: '', foreground: '#0c7075' } },
    {
      scope: 'support.type, support.class',
      settings: { fontStyle: 'italic', foreground: '#0c7075' },
    },
    { scope: 'support.other.variable', settings: { fontStyle: '' } },
    { scope: 'invalid', settings: { fontStyle: '', foreground: '#cf222e' } },
    { scope: 'invalid.deprecated', settings: { foreground: '#cf222e' } },
    {
      scope: 'meta.structure.dictionary.json string.quoted.double.json',
      settings: { foreground: '#75715e' },
    },
    { scope: 'meta.diff, meta.diff.header', settings: { foreground: '#75715e' } },
    { scope: 'markup.deleted', settings: { foreground: '#c4265e' } },
    { scope: 'markup.inserted', settings: { foreground: '#427000' } },
    { scope: 'markup.changed', settings: { foreground: '#7a6300' } },
    {
      scope: 'constant.numeric.line-number.find-in-files - match',
      settings: { foreground: '#6b3fd6a0' },
    },
    { scope: 'entity.name.filename.find-in-files', settings: { foreground: '#7a6300' } },
    { scope: 'markup.quote', settings: { foreground: '#c4265e' } },
    { scope: 'markup.list', settings: { foreground: '#7a6300' } },
    { scope: 'markup.bold, markup.italic', settings: { foreground: '#0c7075' } },
    { scope: 'markup.inline.raw', settings: { fontStyle: '', foreground: '#8c5c00' } },
    { scope: 'markup.heading', settings: { foreground: '#427000' } },
    { scope: 'markup.heading.setext', settings: { fontStyle: 'bold', foreground: '#427000' } },
    { scope: 'markup.heading.markdown', settings: { fontStyle: 'bold' } },
    { scope: 'markup.quote.markdown', settings: { fontStyle: 'italic', foreground: '#75715e' } },
    { scope: 'markup.bold.markdown', settings: { fontStyle: 'bold' } },
    {
      scope: 'string.other.link.title.markdown,string.other.link.description.markdown',
      settings: { foreground: '#6b3fd6' },
    },
    {
      scope: 'markup.underline.link.markdown,markup.underline.link.image.markdown',
      settings: { foreground: '#7a6300' },
    },
    { scope: 'markup.italic.markdown', settings: { fontStyle: 'italic' } },
    { scope: 'markup.strikethrough', settings: { fontStyle: 'strikethrough' } },
    {
      scope: 'markup.list.unnumbered.markdown, markup.list.numbered.markdown',
      settings: { foreground: '#272822' },
    },
    {
      scope: ['punctuation.definition.list.begin.markdown'],
      settings: { foreground: '#427000' },
    },
    { scope: 'token.info-token', settings: { foreground: '#2f5fb3' } },
    { scope: 'token.warn-token', settings: { foreground: '#8a5f00' } },
    { scope: 'token.error-token', settings: { foreground: '#cf222e' } },
    { scope: 'token.debug-token', settings: { foreground: '#7a3fc7' } },
    { scope: 'variable.language', settings: { foreground: '#8c5c00' } },
  ],
};
