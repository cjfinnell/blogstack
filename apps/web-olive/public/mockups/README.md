# Olive mockup gallery — temporary

Design mockups for the olive theme, reviewable at `/mockups/` on any olive
deploy (dev, PR preview, or production until removed). Each page is a
self-contained, verbatim static HTML file with one inline `<style>` block, no
scripts, no images (CSS-drawn placeholder art), and one Google Fonts
stylesheet request. `notes/` holds the supporting docs.

This gallery is not part of the olive product. It exists only so a reviewer
can flip between pages from one URL instead of being handed several file
paths, and it is `noindex, nofollow` (per-page meta tag plus `robots.txt`) so
it never shows up in search.

## Round 2 — one direction, three pages

Round 1 offered seven competing concepts, A through G. Maria reviewed all
seven and picked D outright. The other concepts were rejected for their type
and colour, not their structure, so round 2 is not a narrower set of
competitors — it is D's design system applied across the three page types,
absorbing the structures she liked from the others.

| | |
| --- | --- |
| `1-home.html` | The homepage. D refined against her notes, plus C's standing columns and a rankings module pointing at page 2. |
| `2-map.html` | Map and lists. F's structure in D's skin, with B's rankings ledger under the map. |
| `3-review.html` | A review page. A's article structure with D's seven-axis rubric and C's rubric explainer. |

`notes/round-1-feedback.md` records what she said about each of the seven,
what changed in D as a result, and what is still open.

## When this dies

It should be deleted in the same PR that lands the real implementation
against the CMS-backed olive frontend — or after 30 days from that decision
if none is made, whichever comes first. The decision that ends its life is:
**does this direction become the real olive theme.**

## What to delete

- `apps/web-olive/public/mockups/` (this whole directory)
- `apps/web-olive/src/pages/mockups/`
- The `apps/web-olive/public/mockups/` line in the repo's `.prettierignore`
- The `Disallow: /mockups/` line in `apps/web-olive/public/robots.txt`
  (remove the whole file if that's the only line left in it)
