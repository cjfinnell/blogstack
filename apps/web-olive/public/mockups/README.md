# Olive mockup gallery — temporary

Seven design concepts for the olive theme, reviewable at `/mockups/` on any
olive deploy (dev, PR preview, or production until removed). Each concept is
a self-contained, verbatim static HTML file with one inline `<style>` block,
no scripts, no images (CSS-drawn placeholder art), and one Google Fonts
stylesheet request. `notes/` holds the supporting docs explaining what each
concept is answering.

This gallery is not part of the olive product. It exists only so a reviewer
can flip between concepts from one URL instead of being handed seven file
paths, and it is `noindex, nofollow` (per-page meta tag plus
`robots.txt`) so it never shows up in search.

## When this dies

It should be deleted in the same PR that lands the chosen concept's real
implementation against the CMS-backed olive frontend — or after 30 days from
this PR landing if no direction has been chosen by then, whichever comes
first. The decision that ends its life is: **which of the seven concepts (or
none) becomes the real olive theme.**

## What to delete

- `apps/web-olive/public/mockups/` (this whole directory)
- `apps/web-olive/src/pages/mockups/`
- The `apps/web-olive/public/mockups/` line in the repo's `.prettierignore`
- The `Disallow: /mockups/` line in `apps/web-olive/public/robots.txt`
  (remove the whole file if that's the only line left in it)
