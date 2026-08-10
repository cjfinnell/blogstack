# Round 2 feedback — what it changed, and what is left

Maria reviewed the three round 2 pages and recorded one voice memo per page,
plus a photograph of painted blue bows and the text of her Google Maps pin
lists. This is the distillation. The raw recordings are not in the repo.

The short version: the direction holds. Nothing structural was rejected. What
came back was a set of mechanical corrections, one identity decision, and a
handful of questions that are waiting on content rather than on design — which
is why round 3 is a single decision sheet (`0-identity.html`) rather than
another set of pages.

---

## Settled — no further review needed

Nav (Food, Wine, About, Tip jar, Search), the featured article, the category
tags, Lately, the open letter, most-read, the tip jar close, the facet rows
(neighbourhoods, cuisine, price, good for, values), map-left and content-right,
the short version, pull quotes, the scorecard — *"I really like kind of this
scorecard that's colourful and very easy to read"* — "If you liked this", and
the published/updated dates.

She also asked whether the same header on every page is right. It is; a single
persistent global header is the standard pattern, and her own reason for liking
it is the correct one: *"it makes things less confusing, especially for people
who are less tech savvy."*

## Mechanical — decided, queued for the build

These need no mockup to resolve. They are corrections, not questions.

| Page | Change |
| --- | --- |
| All | Wordmark and bow per the identity sheet |
| Home | Move maps and lists onto the homepage, above rankings, replacing the standing-columns slot |
| Home | "Everything, oldest to newest" should open a filterable archive, not a flat list |
| Home | Standing columns as written do not exist yet — realign them to her actual Google Maps lists |
| Map | Map filter chips become her real pin lists, not invented ones |
| Map | "Newest on the map" goes from one item to three across |
| Map | "Your lists" is wrong — they are *her* lists, not reader-saved. No accounts, so nothing is savable. Reframe with her own introduction copy |
| Review | Remove Reserve, Directions and Save to a list. Keep "See it on the map" — *"I don't want to be in charge of telling people how to make reservations"* |
| Review | "What to order" becomes "What we ordered" |
| Review | Drop opening hours. She will not maintain them: *"I'm not going to keep that part updated"* |
| Review | Fix the dead left gutter (see below) |

## Open decisions

1. **The wordmark and the bow.** *"A little bit more twirly and a little bit
   more elegant, kind of like Blair Waldorf meets Elle Woods"*, plus the
   photograph. This is what `0-identity.html` exists to settle, and it is the
   only one of these that is worth a mockup — it lands in the header of every
   page, the favicon and every link preview, so it is expensive to revisit.
2. **Food Ed and Wine Ed.** *"It's not really clear what that is."* Needs names
   that read as educational at a glance.
3. **Rankings.** The largest open question, and it is hers to answer:
   *"I'm not sure how to organise the rankings in general. Should it be best
   Thai food worldwide, best Thai food in Colorado? I don't know what sort of
   ranking to have in existence… I'm not sure what the content is. So I don't
   know how to organise it."* Also unresolved: how to signal that more than one
   ranking exists.
4. **The score and the photographs on a review.** *"I don't know what pictures
   are going to look like and I think it's going to be different every time I go
   somewhere."* This cannot be designed against placeholder art; it needs real
   photographs from real posts.
5. **"Make a night of it."** Her idea, replacing or extending "Where it is": one
   place for a drink beforehand, the meal, then a show or an attraction — a
   night-out itinerary, not necessarily romantic. Ties to the wider brand
   argument that dining is part of the human experience rather than just a meal.
   Note that her pin lists already contain the raw material for this.
6. **The lists explainer.** On the map page, or its own post.

## The finding that changes the data model

`maps-pins-context.txt` is not a restaurant list. It is twelve Google Maps
lists, maintained since 2019 and global rather than Colorado: Want to go,
Reviews, Vegan options, Drinks, Cafés & coworking, Wineries+, Walks & recs,
Nature & wildlife, Attractions, Shopping, Retailers, Stays & spas.

Two consequences:

- The map section is not a restaurant map. It spans food, nature, shopping and
  hotels, and the schema has to carry that.
- "Make a night of it" is already possible from her own data — Drinks plus
  Attractions plus the review.

**Unresolved and worth flagging early:** Google Maps *saved lists* have no
public API. The options are a periodic Takeout or KML export, manual curation
into the CMS, or iframe embeds — and embeds are both ugly and slow, which she
has already ruled out. This needs deciding before the map section is built.

## The layout bug, reproduced

She reported that *"the text also goes over the what to order section."*
Reproduced by rendering `3-review.html` headless at several widths.

Above about 1024px the article's left gutter is dead for the entire scroll: the
score block strands at the top of the column, roughly a thousand pixels of empty
column runs beside the prose, and then "What we ordered" starts back at column
one. Below that breakpoint the layout collapses to a full-width score strip and
reads correctly. The wide layout is the broken one, so the fix is to stop
treating the margin column as a place to park the score.

## Why round 3 is one sheet and not three pages

Everything above is either already decided, or blocked on content she has not
written yet. She said so three times — she cannot judge the ranking layout
without knowing what the rankings are, and she cannot judge the photograph
treatment without real photographs.

So the recommendation is: settle the identity here, then build the MVP against
the CMS with her real posts, and resolve the rest against real content instead
of placeholder art. Iterating in components is cheaper than hand-editing
static files, and it puts the actual thing in front of her.
