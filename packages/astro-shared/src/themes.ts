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
  };
}

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
      contentCss: `
        .content :global(p) { margin: 1em 0; }
        .content :global(blockquote) {
          border-left: 3px solid var(--border);
          margin: 1em 0;
          padding-left: 1em;
          color: var(--muted);
        }
        .content :global(code) {
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
      contentCss: `
        .content :global(p) { margin: 1.25em 0; }
        .content :global(blockquote) {
          border-left: 2px solid var(--accent);
          margin: 1.5em 0;
          padding-left: 1.25em;
          color: var(--muted);
          font-style: italic;
        }
        .content :global(code) {
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
        fg: '#0d1a0d',
        bg: '#f4faf4',
        muted: '#4a684a',
        border: '#ccdccc',
        accent: '#0f8a34',
      },
      dark: {
        fg: '#d8f5d8',
        bg: '#0a0e0a',
        muted: '#6f9b6f',
        border: '#1e2e1e',
        accent: '#39ff6a',
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
      contentCss: `
        .content :global(p) { margin: 1em 0; }
        .content :global(blockquote) {
          border-left: 3px solid var(--accent);
          margin: 1em 0;
          padding-left: 1em;
          color: var(--muted);
        }
        .content :global(code) {
          background: var(--border);
          padding: 0.15em 0.4em;
          border-radius: 2px;
          font-size: 0.9em;
        }
      `,
    },
  },
};
