# Mockup audit — differentiation and source coverage

> **Round 1, superseded.** This audited the original A–G concepts, which no
> longer exist in the gallery. It is kept because the source coverage matrix
> below still records which reference site each surviving pattern came from.
> For what Maria actually said and what shipped as a result, see
> `round-1-feedback.md`.

Audited all four mockups against every reference gathered this session. Two problems found and fixed.

---

## Problem 1: the four were not comparable

| | Before | After |
| --- | --- | --- |
| A — Table d'Olive | Review page only | Homepage + review page |
| B — Brine & Ink | Ledger index + facets + review page | unchanged (already both) |
| C — Service | Review page only | Homepage + review page |
| D — Maria Eleni | Homepage only | Homepage + article body |

You could not compare index treatments across A, C and D, or article treatments across B and D. All four now show both halves, separated by a labelled rule.

## Problem 2: unclaimed sources

Sixteen references were researched but showed up in no mockup. Each has now been assigned to the concept it actually suits, rather than sprinkled everywhere.

---

## Coverage matrix

| Source | Distinctive contribution | Lands in |
| --- | --- | --- |
| **The Infatuation** | Identity card above hero; headline decoupled from restaurant name; Food Rundown; "Perfect For" occasion facet; related rail showing sibling ratings; published ratings explainer | **A, B, C** (all three review pages) |
| **Eater** | No-leaderboard stance; unranked guide; explicit freshness contract ("rechecked quarterly" + machine timestamp) | **B** (freshness bar, `Unrated` as a first-class ledger row), **C** (unranked seasonal list teaser) |
| **Michelin** | Deep faceting; save/visited/favourite as distinct verbs; symbol system as glyphs; comfort decoupled from food | **B** (glyph legend + per-row marks `◆ ● ★ ▲ ▽ ◇`, faceted archive with counts) |
| **Time Out** | "Time Out says" label; published 1–5 scale; literal cost line alongside the price band | **C** ("Olive says" before the essay), **A/B** (cost line: "$$ · about $55 a head") |
| **Bon Appétit** | Unranked regional lists; credits masthead; photographer credit per image | **A** (credits masthead: words, visits, bills, next revisit), **C** (unranked list) |
| **Serious Eats** | "Why It Works" — verdict bullets before the narrative | **A, B, C** (all carry "The short version") |
| **Smitten Kitchen** | Faceted text archive with counts; "Surprise me!" in top-level nav; "Previously" same-week-prior-years block | **B** (counts, "Surprise me" nav item), **A** ("From the archives" marginalia module) |
| **Pinch of Yum** | "Start Here" page, philosophy-first not bio-first | **D** (philosophy block linking the open letter), footer links in A/B/C |
| **David Lebovitz** | Serif body; drop cap; pull quote; comment count promoted into the byline | **A** (byline reads "By Maria Eleni · 41 comments · Published … · Updated …", drop cap, margin-breaking pull quote), **C** (drop cap, centred pull quote) |
| **101 Cookbooks** | Homepage opens with a personal welcome message | **C** (welcome paragraph above the hero) |
| **Half Baked Harvest** | Per-card save button; essentials/building-blocks rail | **B** (`◆ saved` per row) |
| **Cup of Jo** | Comment counts as the primary social-proof unit; archive-resurfacing sidebar (Most Popular / Most Commented / From the Archives) | **A** (marginalia rail: Recently, From the archives, Most discussed) |
| **Vittles / Alicia Kennedy** | Archive with Latest / Top / Discussions modes; named recurring sections | **B** (mode tabs: Latest, Top rated, Most discussed, The pans, Unrated), **C** (standing columns) |
| **Chef Chloe** *(Maria's #1)* | Personality in copy not chrome; near-invisible nav; recipe index as a curated list with no filters | **D** (three-item nav, "Lately" list, zero filter UI) |
| **Charity Morgan** | Coined-term philosophy given its own page; gold/black/rose luxe | **D** (philosophy block as a designed unit, not an About paragraph) |
| **Zacchary Bird** | Tagline does the whole personality job; persona-named nav | **D** ("Vegan eater, wine drinker, and a menace to anyone who says 'Mediterranean'") |
| **Miyoko's** | Category tag positioned over the card image | **D** (overlay chip top-left on the hero, matching Miyoko's rather than the sketch's right-hand placement — both are now shown, chip on hero and chip on list rows) |
| **CN Traveler** | Award badges; price tier symbols; numbered best-of lists; named homepage rails | **D** (badge row incl. "2026 Fair Kitchen Award", numbered "Most-read this year" rail) |
| **Jetset Christina** | First-person voice; "Most Popular Must-Reads" rail | **D** (first-person article lede, most-read rail) |
| **Rosewood Hong Kong** | Hamburger + centred wordmark; uppercase letterspaced section labels; large padding; restraint | **D** (hamburger right + centred script wordmark, `.rail-label` at 0.2em tracking) |
| **Maria's sketch** | Script wordmark, bow, centred nav, cover photo of latest post, title + summary + tag chip | **D** (built directly to it) |
| **Maria's brief** | Food \| Wine \| About; 8-tag taxonomy; 7-axis rubric; living updates; tip-jar tiers; no ads/popups | **D** (all present) |
| **Technical research** (schema, ratings a11y, Pagefind, images, CWV) | Not visual — applies to whichever concept ships | All four: `role="img"` + visible numerals on every rating, no JS, `light-dark()`, reduced-motion guards |

### Deliberately mapped to nothing

Three source behaviours are represented in **no** mockup, on purpose, because Maria's brief rules them out:

- CN Traveler's four subscription CTAs and ticker banner — she banned popups.
- Jetset Christina's affiliate Shop nav and partner footer — she banned ads and affiliates.
- Rosewood's full-viewport video hero and rotating carousels — "no super interactive = slow loading bullshit".

Their *editorial* patterns were taken; their business model and motion were not.

---

## Differentiation check

The four now differ structurally, not just in fonts and colour:

| | Index model | Review model | Rating display | Photography role |
| --- | --- | --- | --- | --- |
| **A** | Feature + marginalia rails (archive resurfacing) | Asymmetric 12-col, sticky oversized numeral in the margin | One big numeral + four margin sub-scores | Matted, ruled, large |
| **B** | Ruled ledger table, whole row is the link | Dense mono metadata, ruled everything | Mono numeral + sub-score bars, `Unrated` allowed | Small, hard-cropped 4:5, three-up |
| **C** | Welcome + full-bleed hero + standing columns | Single 60ch centred column, all-serif | Inline in a hairline strip; sub-scores as a quiet 4-up | Full-bleed, cinematic, dark |
| **D** | Cover photo + list + rails + philosophy block | Ivory/navy, script mark carries identity | 7-axis rubric card with composite | Framed 16:9 with overlay chip |

No two share an index model, a rating display, or a photography treatment. A and C both use a drop cap and a pull quote, which is the only real overlap — justified, since one is asymmetric-light and the other centred-dark.

## Still open

1. **D leads with a display serif (Cormorant)** while six of seven of Maria's references are sans. A "D-sans" variant would test whether the script wordmark alone carries the personality.
2. **Composite score vs axes-only** in D's rubric — vegan-friendliness and supply transparency do not average cleanly with food quality.
3. **B's faceting may be premature** — Chef Chloe and Zacchary Bird both ship indexes with zero filtering, and the archive is small.
