// Lexical has no footnote node, so footnotes are an authoring convention:
// `[^n]` inline, and a trailing `Notes` heading followed by an ordered list.
// This rewrites both halves into linked superscripts after the tree has
// already been rendered to HTML.

const NOTES_SECTION = /<h[1-6]>\s*Notes\s*<\/h[1-6]>\s*<ol>([\s\S]*?)<\/ol>/i;
const LIST_ITEM = /<li>([\s\S]*?)<\/li>/g;
const MARKER = /\[\^(\d+)\]/g;

export function applyFootnotes(html: string): string {
  if (!html) return html;

  const section = NOTES_SECTION.exec(html);
  // The capture group is unconditional in NOTES_SECTION, but TS can't infer
  // that from the pattern, so it types every capture as possibly undefined.
  const notesListHtml = section?.[1];
  if (!section || notesListHtml === undefined) return html;

  const items = [...notesListHtml.matchAll(LIST_ITEM)].map((m) => m[1] ?? '');
  if (items.length === 0) return html;

  const body = html.slice(0, section.index);
  const tail = html.slice(section.index + section[0].length);

  // A marker with no matching note stays literal — a dangling link to
  // nowhere is worse for the reader than a visible authoring typo.
  const linkedBody = body.replace(MARKER, (match, raw: string) => {
    const n = Number(raw);
    if (n < 1 || n > items.length) return match;
    return `<sup id="fnref-${String(n)}"><a href="#fn-${String(n)}">${String(n)}</a></sup>`;
  });

  // No marker actually linked — an ordinary "Notes" section (terminal/folio
  // content predates this convention and can end on one), not footnotes.
  // Rewriting it anyway would emit back-links to fnref ids that don't exist.
  if (linkedBody === body) return html;

  const notes = items
    .map(
      (text, i) =>
        `<li id="fn-${String(i + 1)}">${text} <a href="#fnref-${String(i + 1)}" aria-label="Back to content">&#8617;</a></li>`,
    )
    .join('');

  return `${linkedBody}<section class="footnotes"><h2>Notes</h2><ol>${notes}</ol></section>${tail}`;
}
