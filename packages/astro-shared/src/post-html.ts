import { highlightCodeBlocks, renderLexicalToHtml } from '@blogstack/blog-client';
import { themes, type ThemeName } from './themes';

// One call per post page: render the CMS content, then highlight its code
// blocks in the site's own Shiki theme pair. Highlighting is async, so pages
// await this in their frontmatter — it runs at build time only.
export function renderPostHtml(content: unknown, theme: ThemeName): Promise<string> {
  return highlightCodeBlocks(renderLexicalToHtml(content), themes[theme].post.shiki);
}
