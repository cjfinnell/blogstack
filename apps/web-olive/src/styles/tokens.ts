import { brand } from '../brand.config';

/**
 * The olive design tokens. See DESIGN-SPEC.md §3 and §4.
 *
 * Authored with `light-dark()`, which resolves against the element's
 * `color-scheme` — so the theme toggle works by flipping `color-scheme` on
 * `:root` and every token follows, with no duplicate rule sets.
 *
 * Three values differ from the mockups, and deliberately. Each was measured,
 * not eyeballed:
 *
 *   --muted was #6A7280. That is 4.43 on --surface and 3.92 on --blue-wash,
 *   both of which fail AA for normal text, and the design sets muted text on
 *   both grounds constantly. #606877 gives 5.33 / 5.12 / 4.54.
 *
 *   --rule-strong was #8C99A9 (2.75 on cream), used as the border of buttons,
 *   pills and the search field — all of which convey state, so WCAG 1.4.11
 *   applies. #7F8B9B gives 3.29. Dark mode's #5C7A96 was 3.38 on --surface;
 *   #7793B0 gives 4.76.
 *
 *   --rule-strong is never a text colour. The mockups set it as text on the
 *   facet counts, which are content, at 2.65.
 *
 * Two standing rules that no component may break:
 *
 *   Baby blue never carries meaning alone (1.69 on cream). It is legal as the
 *   bow, a hairline, a divider glyph, a wash, a decorative border. It is not
 *   legal as a numeral, a label, or a state — the mockups set every rank
 *   number in it.
 *
 *   --rule is a hairline colour only (1.19 on cream).
 */
export const tokenCss = `
  :root {
    color-scheme: light dark;

    /* her four, approved verbatim in round 3 */
    --cream:        light-dark(#FBF9F4, #0E1826);
    --baby:         light-dark(#A8C6DE, #7FA9CC);
    --navy:         light-dark(#16263F, #EDF2F7);
    --ink:          light-dark(#33383F, #DCE3EB);

    /* supporting */
    --surface:      light-dark(#F1F5F9, #16263F);
    --blue-wash:    light-dark(#DCE9F2, #1B2E4A);
    --muted:        light-dark(#606877, #A7B6C9);
    --accent:       light-dark(#2E5C8A, #9CC4E4);
    --accent-hover: light-dark(#1D3F63, #C2DBEF);
    --on-accent:    light-dark(#FBF9F4, #0E1826);
    --rule:         light-dark(#E2E6EC, #23364F);
    --rule-strong:  light-dark(#7F8B9B, #7793B0);

    /* the painted ribbon, lit for each mode rather than punched out */
    --rib-a1: light-dark(#C6D6EE, #8FA9D2);
    --rib-a2: light-dark(#7B95C9, #5E79AE);
    --rib-a3: light-dark(#AAC0E2, #7C97C6);
    --rib-b1: light-dark(#9CB4DF, #7A94C4);
    --rib-b2: light-dark(#6E88C0, #536EA4);
    --rib-b3: light-dark(#BACAE9, #8AA3CE);
    --knot-1: light-dark(#93ABD8, #7B93C4);
    --knot-2: light-dark(#617AB4, #4C6499);
    --knot-3: light-dark(#4C6398, #3D5382);
    --seam:   light-dark(#3F5183, #2B3C64);

    /* type. --font-script, --font-display and --font-body come from Astro's
       Fonts API; see astro.config.mjs. */
    --script:  var(--font-script);
    --display: ${brand.displayFace === 'sans' ? 'var(--font-body)' : 'var(--font-display)'};
    --body:    var(--font-body);

    /* Q8: the all-sans variant leans on weight and tracking for the hierarchy
       the serif gets from its shapes. */
    --display-weight: ${brand.displayFace === 'sans' ? '600' : '400'};
    --display-tracking: ${brand.displayFace === 'sans' ? '-0.015em' : '0.01em'};

    --wrap: 64rem;
    --wrap-wide: 82rem;
    --stage: 74rem;
    --gutter: 1.5rem;
  }

  /* The toggle sets color-scheme directly, so every light-dark() token follows. */
  :root[data-theme='light'] { color-scheme: light; }
  :root[data-theme='dark']  { color-scheme: dark; }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--cream);
    color: var(--ink);
    font-family: var(--body);
    font-size: 1.0625rem;
    line-height: 1.65;
  }

  h1, h2, h3, h4, blockquote {
    color: var(--navy);
    text-wrap: balance;
    font-family: var(--display);
    font-weight: var(--display-weight);
    letter-spacing: var(--display-tracking);
    line-height: 1.15;
  }
  figcaption { text-wrap: balance; }

  a { color: var(--accent); text-underline-offset: 0.18em; }
  a:hover { color: var(--accent-hover); }

  :where(a, button, input, summary):focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  /* Scores, counts and prices must never wobble as digits change. */
  .tnum { font-variant-numeric: tabular-nums; }

  .wrap { max-width: var(--wrap); margin: 0 auto; padding: 0 var(--gutter); }
  .wrap-wide { max-width: var(--wrap-wide); margin: 0 auto; padding: 0 var(--gutter); }

  /* The uppercase letterspaced label is the structural device of the design.
     Always the body face, never the display face. */
  .rail-label {
    font-family: var(--body);
    font-size: 0.6875rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 600;
    margin: 0 0 0.75rem;
  }

  .skip-link {
    position: absolute;
    left: -9999px;
    top: 0;
    background: var(--navy);
    color: var(--cream);
    padding: 0.75rem 1.25rem;
    z-index: 10;
  }
  .skip-link:focus {
    left: 0;
    color: var(--cream);
  }

  hr.rule-full { border: none; border-top: 1px solid var(--navy); margin: 0; }

  img { max-width: 100%; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
