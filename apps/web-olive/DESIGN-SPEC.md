# Olive — design specification

**Status:** the direction is settled. This is the build contract.

This document supersedes the mockup gallery under `public/mockups/`. The mockups are
frozen artefacts of three review rounds; where they and this document disagree, this
document wins, because it folds in the round 2 and round 3 corrections that were
deliberately never patched back into the static files.

Provenance in one paragraph: round 1 offered seven concepts, Maria picked concept D
outright and vetoed G, and the other five lost on type and colour rather than on
structure — so round 2 became one design system (D's) applied across three page types,
absorbing the structures she liked from the losers. Round 2 came back with no
structural objections, a list of mechanical corrections, and one decision worth its
own sheet. Round 3 approved the palette outright, chose Pinyon Script for the wordmark
and bow B1, and asked for three corrections to the mark.

Source documents: `public/mockups/notes/round-{1,2,3}-feedback.md`,
`public/mockups/notes/olive-design-proposal.md`,
`public/mockups/notes/maria-inspo-notes.md`,
`public/mockups/notes/source-essences.md`.

---

## 1. What is settled, what is open

### Settled — build against these without further review

The palette (four colours, approved verbatim). The nav (Food, Wine, About, Tip jar,
Search) and a single persistent global header on every page. The featured article
block, the category tags, the "Lately" list, the open letter as its own designed page,
the most-read rail, the tip jar and its close. The facet rows (neighbourhoods, cuisine,
price, good for, values). Map-left, content-right. The short version, pull quotes, and
the scorecard — _"I really like kind of this scorecard that's colourful and very easy
to read."_ The "If you liked this" rail. Published and updated dates. Pinyon Script as
the wordmark direction. Bow B1 as the bow direction.

### Open — blocked on a decision or on content

| #   | Question                                                                                                                  | Owner                                | Blocks                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| 1   | Wordmark: F1 Monsieur La Doulaise, F2 Miss Fajardose, or F3 Pinyon + drawn flourish                                       | Maria                                | Header component, favicon, OG image         |
| 2   | Bow finish: W1 painted, or W2 painted with grain                                                                          | Maria                                | Same                                        |
| 3   | Will she paint a bow for scanning?                                                                                        | Maria                                | Whether the SVG is the mark or the fallback |
| 4   | Rankings taxonomy — "best Thai worldwide" vs "best Thai in Colorado", and how to signal that more than one ranking exists | Maria                                | Rankings module, `/rankings/` routes        |
| 5   | "Food Ed" / "Wine Ed" naming — _"it's not really clear what that is"_                                                     | Maria                                | Tag taxonomy, nav                           |
| 6   | How photographs sit against the score on a review page                                                                    | Maria, needs real photos             | Review template's photo treatment only      |
| 7   | Google Maps list ingestion (see §10)                                                                                      | Connor to recommend, Maria to accept | The entire map section                      |
| 8   | Display face: serif (Cormorant) or all-sans (see §5.4)                                                                    | Connor to prototype, Maria to pick   | Type scale only, not layout                 |

Items 4 and 6 cannot be resolved against placeholder art. She said so three times. They
resolve against real posts in the CMS, not against another mockup.

### None of these block the build

Every open question above is wired as a **build-time configuration key**, not as a
hardcoded value waiting on an answer. Each ships with a sensible default, and her answer
becomes a one-line change rather than a refactor. Nothing waits on her, and nothing has
to be rebuilt when she replies.

The whole set lives in one typed module, `src/brand.config.ts`:

```ts
export interface BrandConfig {
  /** Q1 — the wordmark face. Only the selected face is ever fetched. */
  wordmarkFace: 'monsieur-la-doulaise' | 'miss-fajardose' | 'pinyon-flourish';
  /** Q2 — the bow finish. #bowFlat is always used for favicon sizes regardless. */
  bowFinish: 'painted' | 'painted-grain';
  /** Q3 — 'scan' swaps her painting in at large sizes; the SVG stays for small ones. */
  bowSource: 'drawn' | 'scan';
  /** Q8 — the D-serif / D-sans test. A token swap, not a redesign. */
  displayFace: 'serif' | 'sans';
  /** Q5 — renaming only. Taxonomy keys stay stable so no content migrates. */
  tagLabels: Record<TagKey, string>;
  /** Q4 — how rankings are scoped, once she decides. */
  rankingScope: 'worldwide' | 'region' | 'both';
  /** Q6 — how photographs sit against the score. Resolves against real photos. */
  reviewPhotoTreatment: 'beside-score' | 'above-score' | 'full-bleed';
}

export const brand: BrandConfig = {
  wordmarkFace: 'monsieur-la-doulaise', // F1, the sheet's recommendation
  bowFinish: 'painted-grain', // W2, closest to her photograph
  bowSource: 'drawn',
  displayFace: 'serif',
  rankingScope: 'region',
  reviewPhotoTreatment: 'above-score',
  tagLabels: {/* … */},
};
```

Two rules that make this worth doing rather than merely tidy:

- **Every key takes a `PUBLIC_`-prefixed env override, read at build time.** A preview
  deploy can then show her F1 beside F3, or serif beside sans, without a commit — which
  is the only way she can actually judge Q1, Q3 and Q8, since all three are questions
  about how something _looks at real size on a real page_.
- **Font loading follows the config.** Only the selected script face is fetched. The
  identity sheet loads all three because it is a comparison sheet; the product must not.

Q7 is the exception: it is an architecture decision, not a preference, so it is not a
config key. See §10.

---

## 2. Identity

### 2.1 The wordmark

Script, centred, navy, set at `clamp()` sizes that shrink by page type (see §5.3). One
of three candidates, all from the engraved copperplate lineage:

- **F1 — Monsieur La Doulaise.** The capital carries a long looping entry stroke as
  part of the glyph, and the E answers it. Nothing is drawn on top, so it stays a real
  typeface: any size, any word, no redrawing.
- **F2 — Miss Fajardose.** Same flourished capital, drawn finer and set tighter. More
  delicate, a little crowded between the two words.
- **F3 — Pinyon Script with a drawn flourish** swept under the whole name.

Pinyon has no swash alternate for its capitals, so "more dramatic tails on the M"
cannot be turned on with an OpenType feature. Fusing a drawn swash into the M itself
was built and thrown away: at masthead size the join never lands, and because the swash
is an absolutely positioned SVG while the M is a glyph, the two drift apart across
screen widths and font-loading states. **Do not re-attempt this.** If F3 wins, the
flourish sweeps under the whole name, as on the identity sheet.

Implementation notes for whichever wins:

- Self-host through Astro's Fonts API (`fontProviders.google()`), one file, `display: swap`.
- The wordmark is the only place the script appears. It never sets a heading, a label,
  or body copy.
- The wordmark is a link to `/`, marked up as text with the script face applied — not
  an image and not an SVG path — so it stays selectable, searchable and scalable. The
  one exception is the OG image (§12), which is rasterised at build time.
- Reserve vertical space for it (`line-height` fixed, `size-adjust` fallback metrics)
  so a slow script font does not shift the page. This is the single largest CLS risk in
  the design.

### 2.2 The bow

One inline SVG, defined once in a `<defs>` block and `<use>`d at every size. No script,
no image request. Three symbols:

| Symbol           | Filter                                                                       | Used at                                                         |
| ---------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `#bowPaint` (W1) | `#paint` — `feTurbulence` + `feDisplacementMap`, scale 9                     | Masthead, footer, inline                                        |
| `#bowGrain` (W2) | `#paintGrain` — the above plus a second turbulence composited as paper grain | Masthead, footer, inline                                        |
| `#bowFlat`       | none                                                                         | Favicon and anything under ~32px, where the filters turn to mud |

The drawing itself (`#bowBody`) is built to Maria's round 3 note — _"I want the tails
also to be wavy like the picture. I also want it to have contrast, for it to look silky
and watercolor-y and you can see how the knot was tied"_ — and the four things that
brief translated into are load-bearing:

1. **Constant-width band, not a tapering blade.** Her photograph shows even width
   throughout. Round 2's tapering shape is why it read as a bowtie rather than silk.
2. **Undulating tails**, two inflections each, no left-right symmetry.
3. **Per-band gradients**, and the two sides use _different_ gradients, so the loops
   read as sitting at different angles to the light.
4. **A knot drawn as an actual wrap**: a rounded band over the centre, a seam curving
   across it, a highlight along its top edge, and the loops darkening where they tuck
   underneath.

The eight ribbon and knot colours live as tokens (`--rib-a1..a3`, `--rib-b1..b3`,
`--knot-1..3`, `--seam`) with light and dark values, so the bow re-lights in dark mode
instead of being punched out.

`feTurbulence` + `feDisplacementMap` is not free. Render the bow at a **fixed set of
sizes**, do not animate it, and measure once on a mid-range phone. If the filter costs
more than ~2ms of paint, ship `#bowFlat` below the masthead and keep the filtered
version for the one hero instance.

### 2.3 The reference photograph — do not ship it

Maria asked, of the close-up she sent: _"this one is the perfect example if we can
basically just use that?"_

**No.** It is printed artwork on a product from a stationery brand — the wider shot from
round 2 has the maker's mark visible in the corner. Putting it on a masthead is putting
someone else's illustration on a logo.

The _style_ is not ownable — painted ribbon, periwinkle on cream, wavy tails, a visible
knot. Only that specific painting is. Three routes, in order of preference:

1. **She paints one and we scan it.** Best answer. Real paint has pooling and wobble
   that SVG only approximates, and it makes the mark genuinely hers.
2. **The drawn SVG on the identity sheet.** Original, no licensing question, scales to
   any size, zero image requests.
3. **Commission an illustrator.**

1 and 2 combine well: a scan on the homepage and in the OG image, the drawn version for
the favicon and every small size. If a scan lands, it needs the same treatment as any
content photograph (§11) plus a transparent background, and the SVG stays as the
fallback — do not delete it.

### 2.4 Favicon and app icons

`#bowFlat` only, on `--cream`, exported at 16/32/180/512. The wordmark does not
survive at favicon size and must not be attempted there.

---

## 3. Colour

### 3.1 The four

Approved outright in round 3. These are not up for revision.

| Role      | Value     | Use                                         |
| --------- | --------- | ------------------------------------------- |
| Cream     | `#FBF9F4` | The page ground                             |
| Baby blue | `#A8C6DE` | The bow, dividers, decorative accents       |
| Navy      | `#16263F` | Headings, rules, structure, primary buttons |
| Dark grey | `#33383F` | Body text                                   |

The rule that came out of round 1 and must be held: **navy is for headings, rules and
structure; body copy is dark grey.** Concept D originally set body copy in navy and she
corrected it.

### 3.2 Token block

Authored with `light-dark()` and `color-scheme: light dark`. Ships as-is; three values
are corrected from the mockups for contrast (marked ⚠, see §3.3).

```css
:root {
  color-scheme: light dark;

  /* her four */
  --cream: light-dark(#fbf9f4, #0e1826);
  --baby: light-dark(#a8c6de, #7fa9cc);
  --navy: light-dark(#16263f, #edf2f7);
  --ink: light-dark(#33383f, #dce3eb);

  /* supporting */
  --surface: light-dark(#f1f5f9, #16263f);
  --blue-wash: light-dark(#dce9f2, #1b2e4a);
  --muted: light-dark(#606877, #a7b6c9); /* ⚠ was #6A7280 */
  --accent: light-dark(#2e5c8a, #9cc4e4);
  --accent-hover: light-dark(#1d3f63, #c2dbef);
  --on-accent: light-dark(#fbf9f4, #0e1826);
  --rule: light-dark(#e2e6ec, #23364f); /* hairlines only, never text */
  --rule-strong: light-dark(#7f8b9b, #7793b0); /* ⚠ was #8C99A9 / #5C7A96 */

  /* the painted ribbon */
  --rib-a1: light-dark(#c6d6ee, #8fa9d2);
  --rib-a2: light-dark(#7b95c9, #5e79ae);
  --rib-a3: light-dark(#aac0e2, #7c97c6);
  --rib-b1: light-dark(#9cb4df, #7a94c4);
  --rib-b2: light-dark(#6e88c0, #536ea4);
  --rib-b3: light-dark(#bacae9, #8aa3ce);
  --knot-1: light-dark(#93abd8, #7b93c4);
  --knot-2: light-dark(#617ab4, #4c6499);
  --knot-3: light-dark(#4c6398, #3d5382);
  --seam: light-dark(#3f5183, #2b3c64);
}
```

Use `color-mix(in oklab, …)` for every derived colour. sRGB mixing through these blues
goes grey.

### 3.3 Contrast — measured, with three corrections

Every ratio below was computed against the actual token values, not estimated.

**Passing as authored (light mode, on `--cream` unless noted):**

| Pair                                   | Ratio |
| -------------------------------------- | ----- |
| `--ink` on `--cream`                   | 11.22 |
| `--navy` on `--cream`                  | 14.43 |
| `--accent` on `--cream`                | 6.62  |
| `--accent` on `--surface`              | 6.36  |
| `--cream` on `--navy` (primary button) | 14.43 |
| `--cream` on `--accent` (button hover) | 6.62  |

**Dark mode passes everywhere it matters:** `--ink` 13.79, `--navy` 15.84,
`--accent` 9.71, `--muted` 8.64 on `--cream`; `--muted` 7.36 and `--accent` 8.26 on
`--surface`.

**The three corrections, and why:**

1. **`--muted` was `#6A7280`.** 4.61 on cream (marginal), **4.43 on `--surface`** and
   **3.92 on `--blue-wash`** — both fail AA for normal text, and the mockups set muted
   text on both grounds constantly (`.facets` counts, `.verdict` body, `.teaser p`,
   footer links). `#606877` gives 5.33 / 5.12 / 4.54. Same hue, passes on all three
   grounds.
2. **`--rule-strong` was `#8C99A9`.** 2.75 on cream — fails WCAG 1.4.11 for a border
   that conveys state, and it is used as exactly that on `.btn`, `.tip`, `.signup
input`, and the search field. `#7F8B9B` gives 3.29. Dark-mode `#5C7A96` was 3.38 on
   `--surface`; `#7793B0` gives 4.76.
3. **`--rule-strong` is never a text colour.** The mockups set it as text on `.attrib`,
   `.mrow .save`, and — worse — on the `.facets a b` counts, which are content. At
   2.65–2.75 that is unreadable. Every one of those becomes `--muted`.

**Two standing rules:**

- **Baby blue never carries meaning alone.** 1.69 on cream. The mockups set rank
  numerals in it (`.rrow .n`, `.lrow .n`, `.popular li::before`) — those are content, not
  ornament, and they move to `--muted` or `--navy`. Baby blue is legal as: the bow, a
  hairline, a divider glyph, a wash background, a decorative border. Never as a number,
  a label, or a state.
- **`--rule` is a hairline colour only.** 1.19 on cream. It exists for borders and grid
  gaps and for nothing else.

### 3.4 Dark mode

Authored, not an afterthought — every token has a dark value and the bow re-lights.
It was **never verified visually**: the headless renders in round 3 came out dark, and
`--force-prefers-color-scheme` did not take. Before launch, both modes get a manual
pass on the three page types. Treat that as a required gate, not a nicety.

---

## 4. Typography

### 4.1 Families

| Token       | Family                              | Role                                                     |
| ----------- | ----------------------------------- | -------------------------------------------------------- |
| `--script`  | The chosen wordmark face (F1/F2/F3) | The wordmark. Nothing else. Ever.                        |
| `--display` | Cormorant Garamond                  | Headings, section labels, scores, numerals, rank numbers |
| `--body`    | Karla                               | Body copy, UI labels, metadata, buttons, inputs          |

All three self-hosted via Astro's Fonts API, `display: swap`, metric-adjusted fallbacks
generated by Astro (the largest free CLS win available here). Preload the **body** font
only.

Note the mockups load Parisienne for the wordmark on pages 1–3 — that was round 1's
answer and is superseded by round 3's Pinyon-lineage decision. Pages 1–3 were
deliberately left as reviewed.

### 4.2 Scale

Display (Cormorant, weight 400–500, `text-wrap: balance`):

| Element                         | Size                                        |
| ------------------------------- | ------------------------------------------- |
| Review `h1`                     | `clamp(2.25rem, 5.5vw, 3.5rem)` / 1.06      |
| Home hero `h1`                  | `clamp(2rem, 5vw, 3.25rem)` / 1.08          |
| Section head `h2`               | `2rem`                                      |
| Section label (in-article `h2`) | `2rem`                                      |
| Module header `h3`              | `1.5rem`–`1.75rem`                          |
| List item / card title          | `1.25rem`–`1.5rem`                          |
| Pull quote                      | `1.75rem` / 1.28, italic, `max-width: 38ch` |
| Composite score, margin         | `5rem` / .9                                 |
| Composite score, in rubric      | `3rem`                                      |

Body (Karla):

| Element                      | Size                                                    |
| ---------------------------- | ------------------------------------------------------- |
| Base                         | `1.0625rem` / 1.65                                      |
| Lede paragraph               | `1.1875rem` / 1.6                                       |
| Secondary / summary          | `0.9375rem`                                             |
| Small metadata               | `0.875rem`                                              |
| Uppercase labels             | `0.6875rem`, `letter-spacing: .14em`–`.2em`, weight 600 |
| Micro labels (badges, pills) | `0.625rem`, `letter-spacing: .12em`–`.14em`             |

### 4.3 Rules

- `text-wrap: balance` on `h1, h2, h3, h4, blockquote, figcaption`.
- `text-wrap: pretty` scoped to `.prose p` — not `*`, the algorithm is slower.
- `font-variant-numeric: tabular-nums` on every score, count, and price.
- Prose measure `64ch`; summaries `52–56ch`; pull quotes `38ch`.
- Uppercase letterspaced labels are the structural device borrowed from Rosewood. They
  are always `--muted` or `--navy`, always Karla, never Cormorant.
- Drop cap on the review lede only: `::first-letter`, Cormorant, `3.6rem`, `--accent`.

### 4.4 The one open type question

Six of Maria's seven reference sites are sans-serif with black-on-white and let the
photography carry all the colour. Concept D leads with a display serif. She said she
liked D's font better than the alternatives, so Cormorant stays as the default — but
the argument for a **D-sans** variant is real and cheap to test: script wordmark for
the mark only, then an all-Karla page with uppercase letterspaced section labels. The
contrast between a florid script mark and an otherwise quiet page may hit harder than
serif-everywhere.

This is a token swap (`--display: var(--body)` plus a weight/tracking pass on headings),
not a redesign. Build it as a switchable variant, show her both against real posts, and
let her pick. It does not block anything else.

---

## 5. Layout

### 5.1 Widths

| Container          | Max width | Used by                           |
| ------------------ | --------- | --------------------------------- |
| `.wrap`            | `64rem`   | Home, review chrome, most content |
| `.wrap.narrow`     | `64rem`   | Map page masthead                 |
| `.wrap` (map page) | `82rem`   | Facets, ledger, lists — wide data |
| `.stage`           | `74rem`   | Review article shell              |
| Gutter             | `1.5rem`  | All                               |

### 5.2 Breakpoints

Content-driven, expressed in `rem`, no device names:

| Width   | What changes                                                                          |
| ------- | ------------------------------------------------------------------------------------- |
| `64rem` | Review stage collapses to one column; map stage stacks; facets go 5→2 columns         |
| `56rem` | Ledger rows drop `where`/`price`; teaser stacks; related grid stacks; bow grid stacks |
| `48rem` | Post rows stack; tip tiers 3→2; footer 4→2; rubric axes reflow                        |
| `44rem` | Dish rows stack                                                                       |

### 5.3 The masthead, and why it is identical everywhere

Maria asked whether the same header on every page is right. It is, and her own reason
is the correct one: _"it makes things less confusing, especially for people who are less
tech savvy."_ A single persistent global header, same furniture, three size steps:

| Page   | Wordmark                      | Bow    | Search field                  |
| ------ | ----------------------------- | ------ | ----------------------------- |
| Home   | `clamp(3.5rem, 10vw, 6rem)`   | 168×72 | `34rem`, with example queries |
| Map    | `clamp(3rem, 8vw, 4.75rem)`   | 140×60 | `34rem`                       |
| Review | `clamp(2.5rem, 6vw, 3.75rem)` | 112×48 | `30rem`                       |

Order top to bottom: hamburger (absolute, top right) → wordmark (centred) → bow
(centred) → nav (centred, pipe-separated, with the Tip jar as a pill) → search →
tagline (home only) → full-bleed navy rule.

Search is promoted to the masthead on every page. It was her one explicit gap:
_"I want people to immediately find a search bar."_

Current-page nav item gets `color: var(--accent)` plus a `1.5px` accent underline, and
`aria-current="page"`.

### 5.4 The review stage — the layout bug, and the fix

**The bug reproduces.** Maria reported _"the text also goes over the what to order
section."_ Rendering `3-review.html` headless confirms it: above about 1024px the
article's left gutter is dead for the entire scroll, the score block strands at the top
of the column, roughly a thousand pixels of empty column run beside the prose, and then
"What we ordered" starts back at column one. Below `64rem` it collapses to a full-width
score strip and reads correctly.

Cause: `.stage` is `grid-template-columns: 14rem minmax(0,1fr)`, `.marginalia` is pinned
to column 1 and therefore occupies exactly one auto-placed row; `position: sticky` can
only travel inside its own grid area, which is that one row. Every subsequent item sits
in column 2 or spans `1 / -1`, so column 1 is empty from row 3 down.

**The fix: delete the margin column.** The wide layout is the broken one and the narrow
layout is already correct, so the target is the narrow layout at every width:

- One centred article column, `64ch` measure, inside a `74rem` stage.
- The score becomes a **full-width scorecard strip** directly under the identity card
  and above the hero photograph — horizontal, ruled top and bottom, composite numeral
  on the left, the three or four headline axis notes beside it.
- No `position: sticky` anywhere in the article.
- Full-bleed elements (hero, "What we ordered", the rubric, "Where it is", "If you liked
  this", credits) span the stage; prose blocks and pull quotes sit in the measure.

This also serves the thing she actually praised — _"I really like kind of this scorecard
that's colourful and very easy to read"_ — better than parking the number in a margin
where it strands.

### 5.5 Spacing

Section rhythm `3.5rem` between major blocks, `1.5rem` from a section head to its
content, `1.25rem`–`1.75rem` of internal padding in bordered modules, `2.5rem` for the
philosophy block. Module grids use `gap: 1px` over a `--rule` background to draw
hairline dividers without doubled borders.

No shadows anywhere except the pin's baby-blue halo. No rounded corners except pills
(`999px`) and pins. Everything else is a 1px rule.

---

## 6. Components

### 6.1 Chrome

**Masthead** — §5.3. **Hamburger** — three 22×1.5px navy bars, top right, opens the
full nav drawer; it is the only place the secondary nav lives, so it must work without
JS as a `<details>` or a focus-trapped dialog with a no-JS fallback.

**Search field.** Pill, `1.5px` navy border, magnifier glyph, visually hidden label,
navy submit pill. `:focus-within` swaps the border to accent and adds a `3px`
`--blue-wash` ring. On the homepage, four example queries sit underneath as dotted-underline
links ("best Thai in Colorado", "vegan brunch, Denver", "under $25", "orange wine") —
they teach the corpus in one line.

**Footer.** Four columns (`1.4fr 1fr 1fr 1fr`), `--surface` ground: bow + one-line
mission, then Read / Values / Elsewhere link stacks. Collapses to 2 columns at `48rem`.

### 6.2 Content units

**Chip.** Pill, `--blue-wash` fill, `--baby` border, navy uppercase text at `.6875rem`.
`.plain` variant drops the fill. Used for tags, categories, filters, list membership.

**Section head.** Flex, baseline-aligned: Cormorant `h2` on the left, an uppercase
`.75rem` "more" link on the right. This is the named-rail device — every homepage row
is a heading with a door, so browsing reads as a table of contents rather than a feed.

**Post row.** `14rem | 1fr | auto` — thumb, then date stamp + Cormorant title +
summary, then a category chip. Stacks at `48rem`.

**Ranked ledger row.** `2.5rem | 1fr | 8rem | 5rem | 4rem` — rank numeral, name +
qualifier line, neighbourhood, price band + literal cost, score. Whole row is the link;
hover floods it with `--blue-wash`. Drops `where`/`price` at `56rem`. `Unrated` is a
**first-class value**, rendered in Karla small-caps rather than as a missing number —
never a null, never a zero.

**Map row.** `1.9rem | 1fr | auto` — numbered circular badge matching the pin, name +
qualifier line, membership tag. Pans get an outlined badge instead of a filled one.

**List card.** Cormorant title, one-sentence description, an accent uppercase count.
Four across, two at `64rem`.

**Dish row.** `11rem | 1fr` — square photo, Cormorant name with an optional `Must order`
(navy fill) or `Skip` (outlined) pill, then a `0.9375rem` note. Stacks at `44rem`.

**Related card.** 4:3 framed photo, then a metadata line whose first element is the
score in Cormorant accent, then title and one line. Showing the number on the card is
what drives the click.

### 6.3 The scorecard

The most-praised element in the whole review. Requirements:

- **Visible numerals always.** Never colour-only encoding. Survives colourblindness,
  CSS failure, and zoom.
- Bars are `6px`, `--rule` track, `--accent` fill, `999px` radius, `role="img"` with an
  `aria-label` reading the number.
- Bar graphics need ≥3:1 against their track (WCAG 1.4.11) — `--accent` on `--rule`
  clears this comfortably in both modes.
- Seven axes, in this order: Food quality, Vegan-friendliness, Service, Ambiance, Value,
  Ownership & ethics, Supply transparency.
- Composite is the **unweighted mean**, and the page says so: _"which means a beautiful
  room cannot buy its way out of an opaque supply chain."_
- The rubric explainer sits inside the card, dashed `--baby` border, and links to the
  full rubric page. This is what turns a number from an opinion into a measurement.
- Badges row (Independently owned / Vegan menu printed / awards). Award badges get the
  accent border-and-weight treatment.
- Disclosures block: How we ate, Ownership, Supply chain, Interview.
- **Living updates** — the revisit log, newest first, each with a date, a visit number,
  and what changed including the score delta. _"A review is not finished when it is
  published; it is updated when the restaurant changes."_

The open question from round 1 stands: vegan-friendliness and supply transparency do not
average cleanly against food quality. Current answer is the unweighted mean with the
reasoning printed. The alternative — publish seven numbers and no composite — remains
available and is a one-component change if she wants it.

### 6.4 The map

CSS-drawn at mockup stage; the real thing is a **build-time static map**, not a live
tile map, on the review page, and a lazily-mounted Leaflet instance (~42KB gzipped) on
the map page only, fed a build-time `/data/places.geojson`.

Hard constraints:

- **Never** point tiles at `tile.openstreetmap.org`. OSMF policy prohibits it and they
  can block without notice. Use MapTiler / Geoapify / Stadia.
- **No Google Maps iframe.** It is free, but it ships third-party cookies and the
  visitor's IP to Google, which in the EU means a click-to-load consent placeholder —
  more engineering than a static image, for worse UX. She has also already ruled out
  embeds as slow.
- **The list beside the map is required, not optional.** An interactive map is not
  keyboard-navigable in any useful sense. The mockup states this on the page itself:
  _"the map and this list are the same data — the list is the one that works with a
  keyboard."_ Hold that.
- Pins: `1.9rem` circle with a `50% 50% 50% 2px` radius, navy fill, `--on-accent`
  numeral, `3px` baby-blue halo. Pans render as outlined pins. Pin number matches the
  list row number exactly.
- Map filter chips are **her twelve real lists** (§9.3), not invented facets.

---

## 7. Page templates

### 7.1 Home

1. Masthead (largest step) + tagline
2. Hero: 16:9 framed cover photo of the latest post with a category chip overlaid
   top-left, then title (decoupled from the restaurant name), summary, category chip
3. Tag rail — the eight-tag taxonomy, centred, cutting across Food and Wine
4. **Lately** → "Everything, oldest to newest" links to a **filterable archive**, not a
   flat list _(round 2 correction)_
5. **Maps and lists** — moved onto the homepage, above rankings, replacing the standing-columns
   slot, and realigned to her twelve actual Google Maps lists _(round 2 correction)_
6. **Rankings** — a doorway module pointing at the map page, where the full ledger lives
7. **Philosophy** — the open letter, given its own designed block and its own page.
   Charity Morgan's `/plegan` is the model: philosophy gets a landing page, not an
   About paragraph.
8. Most-read rail, numbered with `decimal-leading-zero`
9. Tip jar tiers
10. Pledge + inline newsletter — _never_ a popup, never an interstitial
11. Footer

The standing-columns module ("One dish worth the trip", "Revisits", "After eleven",
"The pans") is **cut from the homepage** — those columns do not exist yet. Named
recurring series remain a good idea and can return as a real taxonomy once there is
content to fill them.

### 7.2 Map & lists

1. Masthead (medium step), `82rem` wrap
2. Facet bar on `--surface`: five columns — Neighbourhoods, Cuisine, Price, Good for,
   Values — each a text link with a count. Counts sell depth: "Thai 31" tells a reader
   more than any photograph. These must be **crawlable links to generated pages**, not
   JS filters.
3. **Map stage** — `1.25fr | 1fr`, map left, list right, both `36rem` tall, list
   scrolls. Stacks at `64rem`.
4. **Rankings ledger**, directly under the map — where she put it: _"I could see this
   living under a map as opposed to something on the homepage."_ Mode tabs: Top rated,
   Latest, Most discussed, The pans, Unrated. Cuisine chips above the rows.
5. **Her lists** — _not_ "Your lists". There are no accounts and nothing is savable, so
   the reader-saved framing is wrong. These are her twelve curated lists, with her own
   introduction copy. _(round 2 correction)_
6. **Newest on the map** — three across, not one _(round 2 correction)_
7. Footer

### 7.3 Review

1. Masthead (smallest step)
2. **Identity card**, full width: kicker (`Restaurant review · City · No. NNN`), the
   editorial headline, then the restaurant name and address as a secondary line, then
   the facts list (cuisine, dietary, neighbourhood, price band + literal cost, visit
   count and dates), then the byline with published and updated dates.
   **The headline is not the restaurant name.** Render both; the name is metadata and
   the headline is where the writer gets a voice.
   Actions: **"See it on the map" only.** Reserve, Directions and Save to a list are
   removed — _"I don't want to be in charge of telling people how to make reservations."_
   _(round 2 correction)_
3. **Scorecard strip**, full width (§5.4)
4. Hero photograph, 3:2, framed, with a caption _and_ a credit. Eager, `fetchpriority="high"`.
5. **The short version** — 4–6 bullets in a `--blue-wash` box before the essay. Serves
   skimmers without flattening the prose.
6. Prose with a drop cap on the lede, pull quotes breaking the rhythm (she asked for
   these twice)
7. **What we ordered** — renamed from "What to order" _(round 2 correction)_. Dish rows
   with photo, name, must/skip pill, and a verdict sentence.
8. **How this scored** — the full rubric card (§6.3)
9. **Where it is** — map + address block. **Opening hours are dropped**: _"I'm not going
   to keep that part updated."_ _(round 2 correction)_. Keep address, getting in, damage,
   nearby pins, and the two directions deep links.
10. **If you liked this** — three related cards with scores shown
11. **Credits** — words, photographs, visit dates, bills, next scheduled revisit
12. Footer

### 7.4 Pages the mockups imply but never drew

These are part of the overhaul and need building:

- `/about` and `/start-here` — philosophy-first, then 4–6 curated buckets
- `/rubric` — the full seven-axis explainer with what each number means. This is the
  artefact that makes the scores trustworthy; it must be a linked page, not fine print.
- `/disclosure` — how we ate, who paid, how ownership is checked
- `/archive` — the filterable "everything, oldest to newest" index with counts
- Facet routes: `/cuisine/[tag]`, `/city/[city]`, `/neighbourhood/[hood]`,
  `/occasion/[occasion]`, `/values/[value]`, generated via `getStaticPaths`
- `/rankings/[ranking]` — blocked on open question 4
- `/lists/[list]` — the twelve Maps lists
- Pagination on every index. Numbered or "load more". **Not infinite scroll** — it
  breaks URLs, the back button, and crawling, and none of the reference sites use it.
- `/404`, RSS + JSON feed, both autodiscovered in `<head>`

---

## 8. Corrections carried forward from round 2

Every one of these is decided and needs no further review. They land in components,
which is why pages 1–3 were left alone.

| Page   | Correction                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| All    | Wordmark and bow per the identity sheet                                                                               |
| All    | Body copy dark grey, navy reserved for headings, rules and structure                                                  |
| Home   | Maps and lists move onto the homepage, above rankings, replacing the standing-columns slot                            |
| Home   | Standing columns cut — they do not exist yet; realign to her real Maps lists                                          |
| Home   | "Everything, oldest to newest" opens a filterable archive, not a flat list                                            |
| Map    | Filter chips become her real pin lists, not invented ones                                                             |
| Map    | "Newest on the map" goes from one item to three across                                                                |
| Map    | "Your lists" → her lists, with her own introduction copy. No accounts, nothing savable                                |
| Review | Remove Reserve, Directions, Save to a list. Keep "See it on the map"                                                  |
| Review | "What to order" → "What we ordered"                                                                                   |
| Review | Drop opening hours                                                                                                    |
| Review | Fix the dead left gutter (§5.4)                                                                                       |
| All    | `--muted` and `--rule-strong` corrected; `--rule-strong` never used as text; baby blue never used for numerals (§3.3) |

---

## 9. Data model

### 9.1 What exists today

`ReviewMeta` in `@blogstack/blog-client` already models more than the current theme
renders:

```ts
export interface ReviewMeta {
  restaurant?: string;
  city?: string;
  visitedAt?: string;
  rating?: number;
  ratingScaleMax?: number;
  pricePerPerson?: number;
  verdictSummary?: string;
  recommendation?: string;
  bestOccasion?: string;
  bestDishes?: string;
  cuisineTags?: string[];
  photos?: string[];
}
```

The bone structure is good. Almost none of it is used to its potential, and three
fields are the wrong shape for this design.

### 9.2 Required changes

**Highest-value single change: `bestDishes` becomes a repeater.** The dish rundown is
the most reusable and most shareable block in food writing, and it is currently one
free-text string.

```ts
dishes?: { name: string; photo?: Photo; note: string; verdict?: 'must' | 'skip' }[];
```

**`photos: string[]` becomes objects.** Every gallery image currently renders with
`alt=""`, which is wrong for content photography, and there is no caption or credit
anywhere.

```ts
type Photo = { src: string; alt: string; caption?: string; credit?: string; width: number; height: number };
heroPhoto?: Photo;
photos?: Photo[];
```

**The seven axes become structured, and the composite is derived, not stored:**

```ts
axes?: {
  food?: number; vegan?: number; service?: number; ambiance?: number;
  value?: number; ethics?: number; supply?: number;
};
// composite = unweighted mean of the present axes; `unrated` is a state, not a null
scoreState?: 'scored' | 'unrated';
```

**Living updates:**

```ts
revisits?: { date: string; visitNumber: number; note: string; deltas?: string[] }[];
updatedAt?: string;
nextRevisit?: string;
```

**Location and trust furniture:**

```ts
address?: string;
geo?: { lat: number; lng: number };       // ≥5 decimals for JSON-LD
placeId?: string;                          // disambiguates chains far better than a name
neighbourhood?: string;
gettingIn?: string;
damage?: string;                           // the literal cost sentence
badges?: string[];
disclosures?: { howWeAte: string; ownership?: string; supplyChain?: string; interview?: string };
```

Note what is **not** here: `openingHours`. Deliberate — she will not maintain them.

Also fix the identity collision while in here: `Header.astro` renders two links both
labelled "Blog", `pages/index.astro` titles the site "Maria Eleni", and
`pages/posts/index.astro` titles it "Blog | All posts" — three identities in three
files. One name, in `src/site.ts`, used everywhere.

### 9.3 The places schema — this is not a restaurant list

`maps-pins-context.txt` turned out to be twelve Google Maps lists maintained since 2019,
global rather than Colorado:

> Want to go · Reviews · Vegan options · Drinks · Cafés & coworking · Wineries+ ·
> Walks & recs · Nature & wildlife · Attractions · Shopping · Retailers · Stays & spas

Two consequences, both structural:

1. **The map section is not a restaurant map.** It spans food, nature, shopping and
   hotels. The schema must carry a `Place` that is not a `Restaurant`.
2. **"Make a night of it" is already possible from her own data** — Drinks plus
   Attractions plus the review. That is her idea, and it needs no new content, only a
   join.

```ts
interface Place {
  id: string;
  name: string;
  kind:
    | 'restaurant'
    | 'bar'
    | 'cafe'
    | 'winery'
    | 'walk'
    | 'nature'
    | 'attraction'
    | 'shop'
    | 'retailer'
    | 'stay'
    | 'spa';
  lists: string[]; // membership in the twelve
  geo: { lat: number; lng: number };
  placeId?: string;
  address?: string;
  city?: string;
  country?: string;
  neighbourhood?: string;
  priceBand?: 1 | 2 | 3 | 4;
  note?: string; // her line about it
  reviewSlug?: string; // the join to a full review, when one exists
  status: 'been' | 'want-to-go';
}
```

A review links to a place; a place does not require a review. The ledger, the facets,
the map, the lists and the itinerary feature all read from this one collection.

---

## 10. The Google Maps ingestion problem

**Flagged early because it blocks the entire map section: Google Maps _saved lists_
have no public API.** The Places API can look up a place; it cannot read her lists.
Three options:

| Option                                         | Cost                                                     | Freshness             | Verdict                                                                                                      |
| ---------------------------------------------- | -------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Periodic Takeout / KML export, parsed at build | One import script, then a manual export every few months | Stale between exports | **Recommended.** Preserves her existing workflow — she keeps pinning in Google Maps and the site catches up. |
| Manual curation into the CMS                   | High and permanent                                       | Live                  | Only for places that get a real review or a written note                                                     |
| Iframe embeds                                  | Low                                                      | Live                  | **Ruled out.** She has already rejected embeds as ugly and slow, and they carry the consent problem in §6.4. |

Recommendation: **Takeout/KML as the pipeline, CMS as the override.** Import produces
`Place` records with geometry and list membership; the CMS carries the note, the
`reviewSlug`, and any correction. An import must never clobber a CMS-authored field.

This needs her yes before the map section is built.

---

## 11. Images

- Hero: `<Picture formats={['avif','webp']} widths={[480,800,1200,1600]} loading="eager"
fetchpriority="high" quality={72}>`. **Never `loading="lazy"` on the LCP image.**
  Astro's `<Image>` defaults to lazy, so this must be overridden explicitly. It is the
  most common self-inflicted wound on food blogs and costs 500ms+.
- Everything else lazy, with explicit `width`/`height`.
- CMS rich-text `<img>` has no dimensions today — the `renderLexicalToHtml` path is
  exactly this leak. Inject dimensions at build time or it will guarantee CLS.
- Build with Sharp, ship static assets, let the CDN cache them. Do not put this workload
  on Cloudflare Images: a few hundred posts × ~8 photos × 5 widths × 2 formats is
  25–50K deterministic variants, well past the free tier, for no benefit. Cap source
  photos at ~2500px on ingest and only generate widths actually referenced in `sizes`.
- Every content image needs real `alt`. A photo credit renders inline on every image.

**Privacy — verify, do not assume.** Phone-shot food photos carry GPS EXIF, often of
home if the leftovers get photographed. Sharp drops metadata unless `withMetadata()` is
called, so build-processed images _should_ come out clean — **verify once with
`exiftool dist/_astro/*.jpg` and re-verify after Astro major upgrades.** Anything in
`public/` is served byte-for-byte with EXIF intact. A pre-commit
`exiftool -all= -overwrite_original` hook is the belt-and-braces answer.

---

## 12. SEO, structured data, social

- **JSON-LD per review**, one `@graph`: `BlogPosting` + `Review` (with
  `reviewRating.bestRating` / `worstRating` explicit) + `Restaurant`/`Place`
  (`address`, `geo` at ≥5 decimals, `servesCuisine`, `priceRange`) + `Person` +
  `Organization` + `BreadcrumbList`. Emit only the **composite** as `reviewRating`.
  A third-party reviewer is exactly the case Google's review-snippet carve-out preserves.
- **Skip `FAQPage` entirely** — Google killed FAQ rich results for all sites on
  2026-05-07.
- **Open Graph + Twitter card**, neither of which exists today. `og:image` at 1200×630
  with declared `og:image:width`/`height`, `og:image:alt`, and
  `twitter:card=summary_large_image` — without it you get the small square card even
  with a large image. Food photos crop badly at 1.91:1, so generate a dedicated OG crop
  rather than reusing a vertical hero. The wordmark and bow appear in the OG template,
  rasterised at build time.
- Canonical URLs, sitemap, RSS + JSON feed autodiscovered in `<head>` and linked in the
  footer.
- **Explicit freshness contract.** "Rechecked every quarter" printed in the ledger
  footer, plus a machine-readable `updatedAt`. Show published _and_ updated dates. It
  converts staleness from a liability into an editorial promise.

---

## 13. Motion, accessibility, performance

**Motion.** Effectively none. `@media (prefers-reduced-motion: reduce)` guard is already
in every mockup and stays. Optional: the CSS `@view-transition { navigation: auto; }`
at-rule for cross-document transitions — **not** Astro's `<ClientRouter />`, which turns
a static blog into an SPA and costs JS and script-reinit bugs for nothing. Set a unique
`view-transition-name` per hero from the slug; duplicate names silently abort the
transition. No scroll-jacking, no smooth-scroll libraries, no carousels, no video hero.
Her words: _"no super interactive = slow loading bullshit."_

**Accessibility gates (all blocking):**

- Contrast per §3.3, in both modes, verified — dark mode has never been looked at.
- Visible numerals on every rating; never colour-only.
- The map always ships an equivalent keyboard-navigable list.
- Facets are real links to real pages, never JS-only filters.
- One `<h1>` per page; the identity card's headline is it.
- Focus visible on every interactive element, including the pins and the ledger rows.
- Skip link to main content.
- The hamburger drawer works without JS.

**Performance budget — treat a miss as a bug and gate it in CI (`lighthouse-ci` or
`unlighthouse` against `dist/`):**

| Metric     | Target                                                           |
| ---------- | ---------------------------------------------------------------- |
| LCP        | ≤ 1.8s (p75)                                                     |
| INP        | ≤ 100ms                                                          |
| CLS        | ≤ 0.02                                                           |
| Lighthouse | Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100 |

The five things most likely to break it here, in order: (1) a lazy-loaded hero — Astro's
default; (2) CMS rich-text images with no dimensions; (3) oversized originals with a
wrong `sizes`; (4) an eagerly-mounted map; (5) the script wordmark shifting the masthead
on font load.

---

## 14. Explicit non-goals

Do not build these. Each was considered and rejected for a reason.

- **Ads, sponsored posts, affiliate links, popups, interstitials.** The pledge is the
  product: _"What that buys you is the only thing worth having from a review: the
  freedom to say a place is not good."_
- **Reservation integration.** Not a link, not a widget. _"I don't want to be in charge
  of telling people how to make reservations."_
- **Opening hours.** She will not maintain them.
- **Accounts, saved state, reader-built lists.** No backend, and the lists are hers.
- **Infinite scroll.** Breaks URLs, the back button, and crawling.
- **JS-only category filters.** Not crawlable. Generate real pages.
- **Google Maps iframes / any third-party embed** in the critical path.
- **Disqus.** If comments ever ship, a Giscus-class service, and only with a commitment
  to moderate.
- **Fusing a drawn swash into the wordmark's M.** Tried, failed, documented in §2.1.

---

## 15. Sequencing

**Slice 0 — brand config, then identity.** `src/brand.config.ts` lands first (§1), so no
open question blocks anything. Then the wordmark and bow into components, the favicon
set, and the OG template, all reading from the config. Everything downstream renders the
header, so this goes before the rest.

**Slice 1 — the design system.** Tokens (with the §3.3 corrections), fonts, the three
type roles, masthead, footer, chips, section heads, buttons. Fix the three-different-site-names
bug. Both colour modes verified.

**Slice 2 — the review page.** Identity card, scorecard strip (§5.4 layout fix),
short version, prose, dish rundown, rubric with disclosures and living updates,
location without hours, related rail, credits. Plus the `ReviewMeta` changes in §9.2 and
the CMS repeater fields they need. This is where the round 2 corrections land.

**Slice 3 — the homepage and the archive.** Hero, tag rail, Lately, maps-and-lists
module, rankings doorway, philosophy block, most-read, tip jar, pledge. Filterable
archive with counts, facet routes, pagination, Pagefind search.

**Slice 4 — map and lists.** Blocked on question 7. `Place` schema, the ingestion
pipeline, the map stage, the ledger, her twelve lists, "make a night of it".

**Slice 5 — editorial depth.** Rankings taxonomy (question 4), named series if they
have content by then, guides that reference reviews rather than duplicating them, and
the reverse "included in" index.

Questions 4 and 6 resolve against real posts during slices 2–3, not before. Iterating in
components is cheaper than hand-editing static files, and it puts the actual thing in
front of her.

---

## 16. Retiring the mockups

Per `public/mockups/README.md`, the gallery dies in the same PR that lands the real
implementation, or 30 days after that decision, whichever comes first. Delete:

- `apps/web-olive/public/mockups/` (the whole directory)
- `apps/web-olive/src/pages/mockups/`
- The `apps/web-olive/public/mockups/` line in `.prettierignore`
- The `Disallow: /mockups/` line in `apps/web-olive/public/robots.txt` (remove the file
  if that is the only line left)

Move `notes/round-{1,2,3}-feedback.md` somewhere durable before deleting the directory —
they are the record of why the design is what it is, and this spec cites them.
