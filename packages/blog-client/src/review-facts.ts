// A restaurant review opens with a run of labelled one-paragraph facts —
// "Rating: 2.3 / 4. …", "Best occasion: …", "Reservations: …" — that the
// writer types as ordinary paragraphs in the editor, each led by a bold label.
// This lifts that run out of the rendered body so the page can show it as one
// object instead of more of the essay. The writer keeps writing prose; nothing
// about the CMS content changes.
//
// Only a run of at least two labelled paragraphs counts, so a single bold
// lead-in somewhere in the essay is left where it is.

export interface ReviewFact {
  label: string;
  /** The paragraph after its label, still HTML. */
  html: string;
}

export interface ReviewScaleStep {
  value: number;
  label: string;
}

export interface ReviewRating {
  value: number;
  max: number;
  /** What follows the number, e.g. "It was good, could be great…". HTML. */
  html: string;
}

export interface ReviewFacts {
  /** The body with the run replaced by `marker`. */
  html: string;
  facts: ReviewFact[];
  rating: ReviewRating | null;
  /** The scale legend line ("1 - Bad · 2 - Good · …"), if the run has one. */
  scale: ReviewScaleStep[];
}

const FACT = /^\s*<p><strong>([^<:]{1,40})(?::<\/strong>|<\/strong>\s*:)\s*([\s\S]*?)<\/p>/;
const SCALE_LINE = /^\s*<p>(\d+\s*[-–—][^<]*)<\/p>/;
const SCALE_STEP = /^(\d+)\s*[-–—]\s*(.+)$/;
const RATING = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\.?\s*/;

function parseScale(line: string): ReviewScaleStep[] | null {
  const steps = line.split('·').map((part) => SCALE_STEP.exec(part.trim()));
  if (steps.length < 2 || steps.some((step) => !step)) return null;
  return steps.map((step) => ({ value: Number(step?.[1]), label: (step?.[2] ?? '').trim() }));
}

export function extractReviewFacts(html: string, marker: string): ReviewFacts | null {
  let from = html.indexOf('<p><strong>');
  while (from !== -1) {
    const facts: ReviewFact[] = [];
    let rating: ReviewRating | null = null;
    let scale: ReviewScaleStep[] = [];
    let at = from;

    for (;;) {
      const rest = html.slice(at);
      const fact = FACT.exec(rest);
      if (fact) {
        const label = (fact[1] ?? '').trim();
        const body = fact[2] ?? '';
        const score = label.toLowerCase() === 'rating' ? RATING.exec(body) : null;
        if (score) {
          rating = {
            value: Number(score[1]),
            max: Number(score[2]),
            html: body.slice(score[0].length),
          };
        } else {
          facts.push({ label, html: body });
        }
        at += fact[0].length;
        continue;
      }
      const line = facts.length > 0 || rating ? SCALE_LINE.exec(rest) : null;
      const steps = line ? parseScale(line[1] ?? '') : null;
      if (line && steps) {
        scale = steps;
        at += line[0].length;
        continue;
      }
      break;
    }

    if (facts.length + (rating ? 1 : 0) >= 2) {
      return { html: html.slice(0, from) + marker + html.slice(at), facts, rating, scale };
    }
    from = html.indexOf('<p><strong>', Math.max(at, from + 1));
  }
  return null;
}
