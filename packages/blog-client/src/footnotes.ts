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
  if (!section) return html;

  const items = [...section[1].matchAll(LIST_ITEM)].map((m) => m[1]);
  if (items.length === 0) return html;

  const body = html.slice(0, section.index);
  const tail = html.slice(section.index + section[0].length);

  // A marker with no matching note stays literal — a dangling link to
  // nowhere is worse for the reader than a visible authoring typo.
  const linkedBody = body.replace(MARKER, (match, raw: string) => {
    const n = Number(raw);
    if (n < 1 || n > items.length) return match;
    return `<sup id="fnref-${n}"><a href="#fn-${n}">${n}</a></sup>`;
  });

  const notes = items
    .map(
      (text, i) =>
        `<li id="fn-${i + 1}">${text} <a href="#fnref-${i + 1}" aria-label="Back to content">&#8617;</a></li>`,
    )
    .join('');

  return `${linkedBody}<section class="footnotes"><h2>Notes</h2><ol>${notes}</ol></section>${tail}`;
}
