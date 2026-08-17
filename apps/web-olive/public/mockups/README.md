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

## Round 3 — one decision sheet

Round 2 came back with no structural objections. What was left was a set of
mechanical corrections, one identity decision, and several questions that are
waiting on real content rather than on design. So round 3 is a single sheet
rather than another set of pages:

| | |
| --- | --- |
| `0-identity.html` | The wordmark and the bow. These end up in every header, the favicon and every link preview, so they are settled before anything is built for real. |

Round 3 approved the palette outright, picked Pinyon Script and bow B1, and
asked for three things: a more dramatic M, wavy tails, and a bow with contrast
and a knot you can see was tied. The sheet is now that pass — three wordmark
options and two bow finishes — plus a note explaining why the reference
photograph itself cannot be used and what to do instead.
`notes/round-3-feedback.md` has the detail.

`notes/round-2-feedback.md` records the rest: what is already decided, what is
blocked on content, the reproduced layout bug on the review page, and the fact
that her map corpus is twelve Google Maps lists spanning far more than
restaurants — which the CMS schema has to carry.

Pages 1 through 3 are deliberately left as they were reviewed. They are not
being patched piecemeal; the corrections land in the real implementation.

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
