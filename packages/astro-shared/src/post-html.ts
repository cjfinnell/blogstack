import { getImage, inferRemoteSize } from 'astro:assets';
import { highlightCodeBlocks, renderLexicalToHtml } from '@blogstack/blog-client';
import { themes, type ThemeName } from './themes';

// One call per post page: render the CMS content, then highlight its code
// blocks in the site's own Shiki theme pair. Highlighting is async, so pages
// await this in their frontmatter — it runs at build time only.
export function renderPostHtml(content: unknown, theme: ThemeName): Promise<string> {
  return highlightCodeBlocks(renderLexicalToHtml(content), themes[theme].post.shiki);
}

// Candidate srcset widths. Any wider than the upload are dropped per image,
// and the upload's own width is always kept as the largest candidate.
const WIDTHS = [480, 800, 1200, 1600];

const IMG_TAG = /<img\s[^>]*>/g;
const ATTR = /([a-zA-Z-]+)="([^"]*)"/g;

function unescapeAttr(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// The post body is CMS HTML injected with set:html, so there is no <img> in
// Astro source to swap for <Image>. This rewrites the body's CMS-hosted <img>
// tags through getImage() instead: in a static build sharp downloads each
// upload once, writes resized webp copies into dist/, and the tag gains
// srcset/sizes plus width/height so the layout does not shift as it loads.
// Readers then fetch images from the blog's own domain, never from the CMS
// Worker. `sizes` is the rendered column width, which only the page knows.
//
// Images on any other host are left alone; they would also need adding to
// image.domains before getImage() would touch them.
export async function optimizePostImages(
  html: string,
  { cmsUrl, sizes }: { cmsUrl: string; sizes: string },
): Promise<string> {
  const cmsHost = new URL(cmsUrl).host;
  const tags = [...new Set(html.match(IMG_TAG) ?? [])];
  const rewritten = await Promise.all(
    tags.map(async (tag) => {
      const attrs: Partial<Record<string, string>> = Object.fromEntries(
        [...tag.matchAll(ATTR)].map(([, name, value]) => [name, unescapeAttr(value)]),
      );
      const src = attrs.src;
      if (!src || !URL.canParse(src) || new URL(src).host !== cmsHost) return tag;

      const { width, height } = await inferRemoteSize(src);
      const image = await getImage({
        src,
        width,
        height,
        widths: [...WIDTHS.filter((w) => w < width), width],
        sizes,
        format: 'webp',
      });
      const out: Record<string, string | number> = {
        src: image.src,
        srcset: image.srcSet.attribute,
        sizes,
        width,
        height,
        alt: attrs.alt ?? '',
        loading: attrs.loading ?? 'lazy',
        decoding: 'async',
      };
      const attrHtml = Object.entries(out)
        .map(([name, value]) => `${name}="${escapeAttr(String(value))}"`)
        .join(' ');
      return `<img ${attrHtml} />`;
    }),
  );
  return tags.reduce((acc, tag, i) => acc.replaceAll(tag, rewritten[i] ?? tag), html);
}
