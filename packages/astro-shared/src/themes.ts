import { monokaiLight, type HighlightOptions } from '@blogstack/blog-client';

export type ThemeName = 'default' | 'journal' | 'terminal';

interface ColorSet {
  fg: string;
  bg: string;
  muted: string;
  border: string;
  accent: string;
}

export interface Theme {
  defaultMode: 'light' | 'dark';
  colors: { light: ColorSet; dark: ColorSet };
  maxWidth: string;
  fontFamily: string;
  fontSize?: string;
  lineHeight: string;
  letterSpacing?: string;
  mainPadding: string;
  extraGlobalCss?: string;
  header: {
    padding: string;
    alignItems: string;
    gap: string;
    brandColor: 'fg' | 'accent';
    brandFontWeight?: string;
    brandFontSize?: string;
    brandLetterSpacing?: string;
    linkFontSize?: string;
    linkPrefix?: string;
  };
  footer: {
    padding: string;
    fontSize: string;
  };
  post: {
    dateFormat: 'long' | 'iso';
    dateStyle: string;
    contentCss: string;
    shiki: HighlightOptions;
  };
}

// Shiki emits per-token --shiki-light/--shiki-dark variables, so one rule set
// serves every theme; only the theme pair in `post.shiki` differs. `default`
// and `journal` keep monokai in both slots — a dark code block on a light
// page is the intended look there — while `terminal` pairs it with
// `monokaiLight` since its own light-mode chrome is a monokai derivative.
export const codeBlockCss = `
  .content pre.shiki {
    margin: 1.5em 0;
    padding: 1em 1.15em;
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.85em;
    line-height: 1.55;
    color: var(--shiki-light);
    background-color: var(--shiki-light-bg);
  }
  .content pre.shiki code {
    background: none;
    padding: 0;
    font-size: inherit;
  }
  .content pre.shiki span {
    color: var(--shiki-light);
  }
  @media (prefers-color-scheme: dark) {
    .content pre.shiki {
      color: var(--shiki-dark);
      background-color: var(--shiki-dark-bg);
    }
    .content pre.shiki span {
      color: var(--shiki-dark);
    }
  }
  :root[data-theme='light'] .content pre.shiki {
    color: var(--shiki-light);
    background-color: var(--shiki-light-bg);
  }
  :root[data-theme='light'] .content pre.shiki span {
    color: var(--shiki-light);
  }
  :root[data-theme='dark'] .content pre.shiki {
    color: var(--shiki-dark);
    background-color: var(--shiki-dark-bg);
  }
  :root[data-theme='dark'] .content pre.shiki span {
    color: var(--shiki-dark);
  }
`;

export const themes: Record<ThemeName, Theme> = {
  default: {
    defaultMode: 'light',
    colors: {
      light: {
        fg: '#1a1a1a',
        bg: '#ffffff',
        muted: '#666666',
        border: '#e2e2e2',
        accent: '#3b5bdb',
      },
      dark: {
        fg: '#e8e8e8',
        bg: '#14161a',
        muted: '#9a9a9a',
        border: '#2a2d33',
        accent: '#7c9bff',
      },
    },
    maxWidth: '42rem',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    lineHeight: '1.6',
    mainPadding: '2rem 1.25rem 4rem',
    header: {
      padding: '1.25rem',
      alignItems: 'center',
      gap: '1.5rem',
      brandColor: 'fg',
      brandFontWeight: '700',
    },
    footer: { padding: '1.5rem 1.25rem', fontSize: '0.85rem' },
    post: {
      dateFormat: 'long',
      dateStyle: 'color: var(--muted); font-size: 0.9rem;',
      shiki: { light: 'monokai', dark: 'monokai' },
      contentCss: `
        .content p { margin: 1em 0; }
        .content blockquote {
          border-left: 3px solid var(--border);
          margin: 1em 0;
          padding-left: 1em;
          color: var(--muted);
        }
        .content code {
          background: var(--border);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
        }
      `,
    },
  },
  journal: {
    defaultMode: 'light',
    colors: {
      light: {
        fg: '#23201c',
        bg: '#fbf9f6',
        muted: '#837a6d',
        border: '#e6e0d6',
        accent: '#8a5a3b',
      },
      dark: {
        fg: '#ece7de',
        bg: '#1a1815',
        muted: '#9a8f7d',
        border: '#322e28',
        accent: '#cc9166',
      },
    },
    maxWidth: '40rem',
    fontFamily: "'Iowan Old Style', 'Palatino Linotype', Georgia, Cambria, serif",
    lineHeight: '1.7',
    letterSpacing: '0.01em',
    mainPadding: '3rem 1.5rem 5rem',
    extraGlobalCss: `
      h1, h2, h3 { line-height: 1.3; font-weight: 400; letter-spacing: 0.01em; }
      h1 { font-size: 2.25rem; }
    `,
    header: {
      padding: '1.75rem 1.5rem',
      alignItems: 'baseline',
      gap: '2rem',
      brandColor: 'fg',
      brandFontSize: '1.15rem',
      brandLetterSpacing: '0.02em',
      linkFontSize: '0.9rem',
    },

    footer: { padding: '2rem 1.5rem', fontSize: '0.85rem' },
    post: {
      dateFormat: 'long',
      dateStyle: 'color: var(--muted); font-size: 0.9rem; font-style: italic;',
      shiki: { light: 'monokai', dark: 'monokai' },
      contentCss: `
        .content p { margin: 1.25em 0; }
        .content blockquote {
          border-left: 2px solid var(--accent);
          margin: 1.5em 0;
          padding-left: 1.25em;
          color: var(--muted);
          font-style: italic;
        }
        .content code {
          background: var(--border);
          padding: 0.15em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
          font-family: ui-monospace, monospace;
        }
      `,
    },
  },
  terminal: {
    defaultMode: 'dark',
    colors: {
      light: {
        fg: '#272822',
        bg: '#fafaf8',
        muted: '#75715e',
        border: '#e5e2d9',
        accent: '#c4265e',
      },
      dark: {
        fg: '#f8f8f2',
        bg: '#272822',
        muted: '#90908a',
        border: '#3e3d32',
        accent: '#f92672',
      },
    },
    maxWidth: '46rem',
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    fontSize: '15px',
    lineHeight: '1.6',
    mainPadding: '2rem 1.25rem 4rem',
    extraGlobalCss: `
      h1::before { content: '# '; color: var(--muted); }
      pre, code { font-family: inherit; }
    `,
    header: {
      padding: '1.25rem',
      alignItems: 'center',
      gap: '1.5rem',
      brandColor: 'accent',
      brandFontWeight: '700',
      linkPrefix: '$ ',
    },
    footer: { padding: '1.5rem 1.25rem', fontSize: '0.8rem' },
    post: {
      dateFormat: 'iso',
      dateStyle: 'color: var(--muted); font-size: 0.85rem;',
      shiki: { light: monokaiLight, dark: 'monokai' },
      contentCss: `
        .content p { margin: 1em 0; }
        .content blockquote {
          border-left: 3px solid var(--accent);
          margin: 1em 0;
          padding-left: 1em;
          color: var(--muted);
        }
        .content code {
          background: var(--border);
          padding: 0.15em 0.4em;
          border-radius: 2px;
          font-size: 0.9em;
        }
      `,
    },
  },
};
