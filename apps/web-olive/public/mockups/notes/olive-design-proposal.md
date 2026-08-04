# Olive — design & feature proposal

Research basis: The Infatuation, Eater, Michelin Guide, Time Out, Bon Appétit, Serious Eats (professional review publications); Smitten Kitchen, Pinch of Yum, David Lebovitz, 101 Cookbooks, Half Baked Harvest, Cup of Jo, Vittles, Alicia Kennedy (independent food/lifestyle blogs); plus current Google structured-data docs, Baymard/NN-g rating research, and 2026 editorial design surveys.

---

## 1. Where olive stands today

`apps/web-olive` is 638 lines across 14 files. It renders correctly and has a genuinely good bone structure — `ReviewMeta` already models rating, scale, city, visit date, price per person, verdict summary, recommendation, best occasion, best dishes, cuisine tags, and photos. Almost none of that data is used to its potential.

Concrete gaps found in the current code:

| Area | Current state |
| --- | --- |
| Identity | `BaseLayout` uses `system-ui` and a generic blue accent `#3b5bdb`. Nothing about the page says "food". |
| Branding consistency | `Header.astro` renders two links both labelled "Blog"; `pages/index.astro` titles the site "Maria Eleni"; `pages/posts/index.astro` titles it "Blog \| All posts". Three different identities in three files. |
| Routing | Reviews live at `/posts/[slug]`. No `/reviews/`, no cuisine/city/occasion pages, no tag pages at all. `cuisineTags` renders as inert `<li>` chips that link nowhere. |
| Images | `review.photos` renders as raw `<img src loading="lazy">` with `alt=""` on every image. No hero image, no `<Image>`/`<Picture>`, no AVIF/WebP, no width/height (guaranteed CLS), no captions, no credits. |
| Discovery | No search, no related reviews, no prev/next, no pagination (`getPublishedPosts(100)` is a hard cap on both index pages). |
| SEO/social | No JSON-LD, no Open Graph, no Twitter card, no canonical, no sitemap. RSS exists but isn't autodiscovered in `<head>`. |
| Location | No address, no map, no directions link, no hours, no reservation link. `city` is the only geography. |
| Trust furniture | No About page, no ratings-explainer, no disclosure of who paid, no updated-date. |
| Structure | `bestDishes` is a single free-text string — the highest-value block on every professional review site (Infatuation's "Food Rundown") is flattened into one line. |

---

## 2. Three art-direction options

Pick one. They are mutually exclusive as identities, but every feature in §3 works under any of them.

### Option A — "Table d'Olive" (warm print revival)

The safe excellent outcome. Reads as a well-printed food quarterly.

- **Type:** Fraunces display (`opsz 144, WONK 1, SOFT 40`) + Hanken Grotesk body. Metadata in uppercase Hanken at 0.8125rem, `letter-spacing: 0.06em`.
- **Palette "Brine":** bg `#FBF7EF` / surface `#F2EBDD` / ink `#1B1D14` / muted `#5B5F4C` / accent `#4C6B23` / accent-hover `#3A5219`. Dark: bg `#12140D` / ink `#EDE8D9` / accent `#B4CC6E`. All tokens verified ≥4.5:1 in both modes.
- **Layout signature:** 12-column grid, 7-column text measure offset to column 3. The persistent left margin holds only the date, the rating, and occasional sidenotes. Images break out to full width; pull quotes break left into the margin.
- **Signature flourish:** the rating as an oversized numeral — `clamp(6rem, 18vw, 14rem)` in accent, sitting in the left margin, baseline-aligned to the review's first line.
- **Texture:** SVG `feTurbulence` grain at `opacity: .04`.

### Option B — "Brine & Ink" (editorial brutalism)

The most distinctive, and the cheapest to build well — it barely depends on photography quality.

- **Type:** Instrument Serif display (huge, `letter-spacing: -0.02em`) + DM Sans body + **DM Mono for all metadata** — date, neighborhood, price band, score. The mono is the signature, not the serif.
- **Palette "Oil & Ink":** bg `#F7F6F1` / ink `#101010` / accent `#5D6B00` (acid olive). Dark mode accent goes chartreuse `#C4D64A` at 12:1.
- **Layout signature:** visible hairline-ruled grid; no rounded corners, no shadows, no gradients. The review index is a **table, not cards**: `| 001 | Restaurant | Neighborhood | 8.4 |` in tabular-nums mono, whole row is the link, `:has(:hover)` floods the row with `--accent-wash`. Photography is sparse and deliberately small, cropped 4:5 with hard borders.
- **Signature flourish:** the index as a numbered ledger — `001`, `002`, `003` never resetting. Issue-number logic on a blog.
- **Texture:** none. Warmth comes from the paper ground and the olive.

### Option C — "Service" (dark-first, dinner-lit)

Highest ceiling, but it collapses with mediocre phone photos. Only pick this if the photography is genuinely good and moody.

- **Type:** Young Serif display + Newsreader body. All-serif, no sans anywhere. Young Serif is single-weight, so hierarchy is pure scale: `4rem → 1.5rem → 1.0625rem`.
- **Palette "Night Service":** dark authored as the default — bg `#131110` / ink `#F1EAE0` / accent amber `#E0A544` (8.64:1). Light mode as the courtesy fallback. `color-scheme: dark light`.
- **Layout signature:** single centered 60ch column — restraint as the statement. Images full-bleed edge-to-edge via `grid-template-columns: 1fr min(60ch, 100%) 1fr` with `.full-bleed { grid-column: 1 / -1 }`. Rhythm is: text → full-bleed photograph → text. Nothing else.
- **Signature flourish:** `view-transition-name` on the hero so the plate morphs from index into article. On a dark ground this is the most cinematic thing available for ~15 lines of CSS.

**Recommendation:** Option B. It is the most memorable, has the lowest photography dependency (relevant while the review archive is small), and the mono-ledger index solves the "minimal blog looks unfinished" problem by making sparseness look deliberate.

### Shared foundation regardless of choice

```css
:root {
  color-scheme: light dark;
  --bg:           light-dark(#F7F6F1, #0D0D0B);
  --surface:      light-dark(#EDEBE2, #171814);
  --ink:          light-dark(#101010, #F2F1EA);
  --muted:        light-dark(#585850, #94958A);
  --accent:       light-dark(#5D6B00, #C4D64A);
  --accent-hover: light-dark(#454F00, #D8E876);
  --rule:         light-dark(#D8D6CA, #26271F);
  --rule-strong:  light-dark(#8A8E79, #616257);   /* anything conveying state: ≥3:1 */
  --accent-wash:  color-mix(in oklab, var(--accent) 8%, var(--bg));
}
```

Use `oklab` in `color-mix` — sRGB mixing through olive/brown muddies badly. Fonts via Astro's stable Fonts API (`fontProviders.google()`), self-hosted, one variable file per family, `display: swap`, preload body font only. Astro's auto-generated metric-adjusted fallbacks are the biggest free CLS win.

---

## 3. Features, tiered

### Tier 1 — high impact, low effort (do these first)

1. **Fix the identity collision.** `Header.astro` has two links labelled "Blog"; the site name differs across three files. Pick one name, put it in a shared config, use it everywhere. This is a ~15-line fix and it is currently the most visible defect.

2. **Identity card above the hero.** The single highest-signal layout decision found across all six professional sites: rating, restaurant name, address, price band, cuisine, neighborhood, and action buttons rendered as one dense block *before* the lead image. Answers "should I go, and can I get in" without scrolling. `ReviewHeader.astro` already does a partial version — promote it above the `<h1>`, add address/price band, and give it the design weight it deserves.

3. **Decouple the headline from the restaurant name.** Infatuation's move: the restaurant name is metadata, the headline is editorial voice ("At Le Veau d'Or, everything old is new again"). `ReviewLayout` currently renders `review.restaurant ?? title` as the `<h1>`, discarding whichever one it didn't pick. Render both.

4. **Verdict box before the narrative.** Serious Eats' "Why It Works" pattern: 3–4 bullets above the essay. `verdictSummary` exists but is one line buried in the header card. Serve skimmers without flattening the prose.

5. **Hero image, done right.** Currently there is no hero at all — photos are a dumped stack at the bottom. Add a `heroPhoto` to `ReviewMeta`, render with `<Picture formats={['avif','webp']} widths={[480,800,1200,1600]} loading="eager" fetchpriority="high" quality={72}>`. Everything else stays lazy. **Never `loading="lazy"` on the LCP image** — Astro's `<Image>` defaults to lazy, so this must be overridden explicitly. It is the single most common self-inflicted wound on food blogs (16% of the web still does it; costs 500ms+).

6. **Real alt text and captions.** Every gallery image currently has `alt=""`, which is wrong for content photography. Extend `photos` from `string[]` to `{ src, alt, caption?, credit? }[]`. Inline photo credit on every image is both professionalism and correct practice.

7. **JSON-LD per review.** A third-party restaurant reviewer is the exact case Google's review-snippet carve-out was designed to preserve — "sites that capture reviews about other local businesses" remain eligible where the businesses themselves are not. Emit a single `@graph` with `BlogPosting` + `Review` (`reviewRating` with explicit `bestRating`/`worstRating`) + `Restaurant` (`address`, `geo` at ≥5 decimals, `servesCuisine`, `priceRange`, `openingHoursSpecification`) + `Person` + `Organization` + `BreadcrumbList`. Skip `FAQPage` entirely — Google killed FAQ rich results for all sites on 2026-05-07.

8. **Open Graph + Twitter card.** Nonexistent today. `og:image` at 1200×630 with declared `og:image:width`/`height`, `twitter:card=summary_large_image` (without it you get the small square card even with a large image), `og:image:alt`. Food photos crop badly at 1.91:1 — generate a dedicated OG crop, don't reuse a vertical hero.

9. **Explicit freshness contract.** Eater states "updated quarterly" in the guide header *and* stamps a machine-readable timestamp. Add `updatedAt` and show published + updated dates. Converts staleness from a liability into an editorial promise.

10. **Methodology + disclosure, rendered as design.** "We visit unannounced and pay our own bill" (Time Out publishes exactly this). A `/ratings` explainer page naming each band is what makes a numeric score trustworthy — Infatuation's ratings-explainer is a linked artifact, not fine print. Cheapest credibility available to a small publication.

11. **Directions deep links.** Two buttons, no maps SDK:
    ```html
    <a href="https://www.google.com/maps/dir/?api=1&destination=NAME%2C+ADDRESS">Google Maps</a>
    <a href="https://maps.apple.com/?daddr=NAME,+ADDRESS&dirflg=d">Apple Maps</a>
    ```
    Google requires `api=1`. For Apple, pass name + full address string, not bare coordinates (there are known `daddr=lat,long` regressions). Store a Google `place_id` in the CMS if possible — it disambiguates chains far better than a name.

12. **Price band glyph *and* a literal cost line.** `$$$` scans; "$550 per person, beverage pairing $295–500" is the actual utility. Do both. `pricePerPerson` already exists; add a derived band.

13. **RSS autodiscovery + JSON feed.** `rss.xml.ts` exists but isn't linked from `<head>` or the footer. Near-zero cost, and it's the readership that survives platform churn.

14. **`text-wrap: balance`** on `h1, h2, h3, blockquote, figcaption`; `text-wrap: pretty` scoped to `.content p` (not `*` — the algorithm is slower).

### Tier 2 — medium effort, structural payoff

15. **Structured "what to order" rundown.** The Infatuation's Food Rundown is the most reusable and most share-worthy component on any review site: dish name, photo, and a short verdict, repeated. Today `bestDishes` is a single string. Change to `dishes: { name, photo?, note, mustOrder? }[]`. Requires a CMS repeater field. **This is the highest-value change on the entire list.**

16. **Facet routes via `getStaticPaths`.** Generate `/cuisine/[tag]`, `/city/[city]`, `/occasion/[occasion]` from the existing `cuisineTags` / `city` / `bestOccasion` fields. Zero runtime cost, large SEO surface, and it makes the tag chips actually clickable. Time Out proves three parallel browse axes beat one search box. Critically: these must be **crawlable links, not JS-only filters**.

17. **Faceted archive index with counts.** Smitten Kitchen's `/recipes/` page — no photo grid, just text links with counts: "Italian 24", "Under $25 18", "Rated 4+ 11". Counts do enormous work; they signal depth before the click. Cheap to derive at build time and consistently the highest-leverage page on the indie blogs studied.

18. **Pagefind search.** Indexes built HTML after `astro build`, so the index can never drift from the CMS, and it shards so users download only matching chunks (~50KB for a search vs ~600KB for Orama on the same corpus). Built-in faceting and sorting via `data-pagefind-filter` / `data-pagefind-sort` attributes — which is free, since the metadata is already rendered. Build command becomes `astro build && npx pagefind --site dist`.
    - Gotcha: a page missing a `data-pagefind-sort` key is *silently dropped* from results sorted by that key. Emit `0`, never a sentinel string — one stray `"n/a"` flips the whole key to alphabetical sorting.
    - Weakness: no true fuzzy matching, so "izikaya" won't find "izakaya". Mitigate with a hidden alias field.

19. **Related reviews rail, with ratings shown.** Same city + same cuisine, three cards. Build-time computation, no recommender. Showing the *number* on the related card is what drives the click.

20. **Archive-resurfacing modules.** "From the archives" (same week, prior years — Smitten Kitchen's "Previously" block), "Recently popular", "Most commented". Pure static computation from frontmatter dates. Turns a small archive into ongoing inventory.

21. **A "Start Here" page.** Pinch of Yum's model, and it is philosophy-first, not bio-first: a short statement of what this blog is for, then 4–6 hand-curated buckets of four reviews each (Best overall / Cheap eats / Worth the trip / Recent obsessions). Converts first-time search arrivals into browsers.

22. **Pagination.** `getPublishedPosts(100)` is a hard ceiling on both index pages today. Use numbered pagination or a "load more" button — **not** infinite scroll. None of the sites studied use infinite scroll; Smitten Kitchen uses "Older posts", Cup of Jo "Load previous articles", Half Baked Harvest "View All".

23. **Guides / lists that reference reviews rather than duplicating prose.** "The 12 best places to eat in X" where each entry is a reference plus a short blurb override. Single source of truth for address/hours/rating, and it unlocks #24 for free.

24. **"Included in" reverse links.** From a review back to every guide containing it. A build-time reverse index — cheap in a static build, impossible to maintain by hand.

25. **Named recurring series as first-class taxonomy.** Cup of Jo's Motherhood Mondays, Vittles' Columns, Half Baked Harvest's Nine Favorite Things. Something like "One Dish Worth the Trip" or "Revisits", surfaced in nav with its own index. Series create appointment reading, which is the core repeat-visit mechanic.

26. **Rating system decision.** Currently a 4-point scale with a progress bar, no explainer. Two defensible directions:
    - **Keep a number** (recommended for a small blog): 5-point with halves. NN/g puts the comprehension sweet spot at 5–7 points; a 10-point scale forces you to defend 7.2 vs 7.4, which nobody can. Add optional sub-scores (food / service / room / value) rendered as an expanded-by-default bar breakdown — Baymard found distribution UIs are the *most-used* element of a reviews section, used more than the review text itself, and collapsing them drops engagement to 7%. Emit only the headline number as `reviewRating` in JSON-LD.
    - **Drop ratings entirely** (Eater's and Bon Appétit's position): stars are "a blunt instrument" that anchor the writer and let the reader skip the prose. Valid for a brand with an audience; it costs a new blog the review rich result, index scannability, and archive sortability.
    - Either way: **make `unrated` a first-class state, not a null**, and publish the score distribution. Consumers trust 4.2–4.5 more than 5.0; only ~20.5% trust a perfect score, and >80% actively seek out a negative review. If the archive has no low scores, the high ones are worthless. Publish the pans.

27. **Accessibility of the rating display.** Current `role="img"` + `aria-label` on the bar is correct — keep it. Add: visible numerals always (survives colorblindness, CSS failure, zoom), never color-only encoding, and ≥3:1 contrast for the bar graphic itself (WCAG 1.4.11, non-text contrast).

28. **View transitions, natively.** Use the CSS `@view-transition { navigation: auto; }` at-rule, **not** Astro's `<ClientRouter />` — the router converts a static blog into an SPA, costing JS and script-reinit bugs for nothing, and Astro's own docs now say it "will increasingly become unnecessary". 88% support for same-document, 82% cross-document (no Firefox yet); Firefox users get instant navigation, which is a perfectly good blog. Set `--vt-hero` per card from the slug — duplicate `view-transition-name` values silently abort the transition.

### Tier 3 — larger, defer until the archive justifies it

29. **Map index page.** One interactive map over all reviews. **Leaflet (~42KB gzipped) over MapLibre (~290KB)** for pins-and-popups; MapLibre only if a themed vector basemap matters. Lazy-mount behind `IntersectionObserver`, feed it a build-time `/data/reviews.geojson` from the content collection. Per-review pages get a **static map image** instead — build-time PNG/WebP from MapTiler/Geoapify/Stadia, zero JS, zero third-party request, zero consent banner.
    - Do **not** point tiles at `tile.openstreetmap.org` — OSMF policy prohibits it for this use and they can block without notice.
    - Skip the Google Maps iframe. It's free (Embed API is unlimited at no charge), but it transfers third-party cookies and the visitor's IP to Google, which in the EU means a click-to-load consent placeholder — more engineering than the static image, for worse UX.
    - Always provide the same data as an accessible list of links below the map. An interactive map is not keyboard-navigable in any useful sense.
    - Note: Infatuation ships no map at all and is still the best-organized site studied.

30. **Comments.** This is the big fork. Cup of Jo's entire identity is "come for the blog, stay for the comments"; Smitten Kitchen and David Lebovitz both promote comment counts to the byline line as social proof. On static Astro, use a lightweight hosted service (Giscus-class), not Disqus (heavy and ad-laden). Highest-maintenance item on this list — only ship it with a commitment to moderate.

31. **Newsletter with a real lead magnet.** Email is the retention asset that AI Overviews can't intercept (68% of US Google searches ended without a click in early 2026, up from 60% in 2024). Food & beverage signup popups average 7.18% conversion versus a 3–5% general benchmark, but only when paired with strong imagery and a genuine offer — "Get my 20 favourite dishes in the city, as a PDF", not a bare "subscribe". Place inline mid-post and after the post. **Do not** ship a full-screen interstitial before the first read (Substack's default, and Vittles serves one) — wrong trade for a small personal blog.

32. **Save / visited / favourite state.** Michelin uses four distinct verbs. `localStorage` gets 80% of the value with zero backend; accounts defeat the static architecture entirely. Only if cross-device is a real requirement.

33. **Reservation embeds.** Start with a plain link field (Resy/OpenTable/Tock). An embedded widget is third-party JS, CLS, and consent — much larger than it looks.

### Explicit non-recommendations

- Infinite scroll — nobody serious uses it; it breaks URLs, back-button, and crawl.
- JS-only category filters — not crawlable. Use real generated category pages.
- Disqus.
- Account-gated "save" features.
- Cloudflare Images for this workload — a few hundred posts × ~8 photos × 5 widths × 2 formats is 25–50K variants, past the 5,000/month free tier, but they're deterministic static outputs. Build once with Sharp, ship as static assets, let the CDN cache them free. (Watch build time: cap source photos at ~2500px on ingest and only generate widths actually referenced in `sizes`.)
- Scroll-jacking / smooth-scroll libraries — now explicitly flagged as an accessibility failure; they break assistive tech and find-in-page. An editorial blog's entire value proposition is reading.
- `FAQPage` schema for rich results — fully deprecated May 2026.

---

## 4. Suggested sequencing

**Slice 1 — identity + credibility (no new infra).** Items 1–14, plus the chosen art direction from §2. This alone reproduces most of the structural advantage the professional review pages have, and fixes the three-different-site-names bug.

**Slice 2 — structure + discovery.** Items 15–22: dish rundown, facet routes, archive index with counts, Pagefind, related reviews, pagination.

**Slice 3 — editorial depth.** Items 23–28: guides, reverse links, series, rating-system decision, view transitions.

**Defer** 29–33 until there are enough reviews for a map to be interesting and enough readers for comments to be worth moderating.

---

## 5. Privacy note

Phone-shot food photos carry GPS EXIF — often of home, if the leftovers get photographed. Sharp doesn't preserve metadata unless `withMetadata()` is called, so build-time-processed images should come out clean, but **verify once with `exiftool dist/_astro/*.jpg` rather than trusting it**, and re-verify after Astro major upgrades. Anything in `public/` is served byte-for-byte with EXIF intact. Cloudflare Polish removes most metadata but explicitly does not guarantee it. A pre-commit `exiftool -all= -overwrite_original` hook is the belt-and-braces answer.

---

## 6. Performance targets to hold

Static Astro on Cloudflare should hit these; treat a miss as a bug and gate it in CI (`lighthouse-ci` or `unlighthouse` against `dist/`).

| Metric | Target |
| --- | --- |
| LCP | ≤ 1.8s (p75) |
| INP | ≤ 100ms |
| CLS | ≤ 0.02 |
| Lighthouse | Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100 |

The five things that will break it, in likelihood order for this codebase: (1) lazy-loaded hero image — Astro's default, must be overridden; (2) CMS rich-text `<img>` with no width/height — the current `renderLexicalToHtml` path is exactly this leak, so inject dimensions at build time; (3) oversized originals plus a wrong `sizes` attribute; (4) eager third-party embeds — map, comments, reservation widget; (5) an LCP image the preload scanner can't discover (CSS `background-image`, client-rendered island, or cross-origin host).
