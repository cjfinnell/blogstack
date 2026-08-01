/**
 * Workaround for @sonicjs-cms/core@3.0.0-beta.26: the admin content form emits
 * `<script type="module" src=".../@tailwindplus/elements@1">` (from
 * getConfirmationDialogScript) *before* the Lexical `<script type="importmap">`.
 *
 * Per the HTML spec an import map is only honoured while no module script has
 * started loading. Chrome 133+ tolerates a late map; Firefox and Safari discard
 * it, so every `import('lexical')` in core's loader fails with
 *
 *   TypeError: The specifier "lexical" was a bare specifier, but was not
 *   remapped to anything.
 *
 * Lexical then never initialises. The editor surface is a plain
 * `contenteditable` div and the hidden `<input name="content">` that the server
 * actually reads stays empty, so saving any post fails with "Content is
 * required" — in Firefox/Safari only.
 *
 * Fix: rewrite admin HTML responses so the import map lives at the end of
 * `<head>` (core puts no module scripts there) and drop core's late in-body
 * copy, leaving exactly one map ahead of every module script.
 *
 * Remove this once core emits the import map before its module scripts.
 */

/**
 * Lexical version core resolves its editor modules against. Kept in sync with
 * core's own `LEXICAL_VERSION` by apps/cms/test/lexical-importmap.test.ts.
 */
export const LEXICAL_VERSION = '0.21.0';

const IMPORTMAP_ID = 'lexical-importmap';

/** Byte-for-byte the specifier set core's loader imports. */
export function buildLexicalImportMap(version: string = LEXICAL_VERSION): string {
  const base = 'https://esm.sh';
  const ext = '?external=lexical';
  const imports = {
    lexical: `${base}/lexical@${version}`,
    '@lexical/rich-text': `${base}/@lexical/rich-text@${version}${ext}`,
    '@lexical/history': `${base}/@lexical/history@${version}${ext}`,
    '@lexical/list': `${base}/@lexical/list@${version}${ext}`,
    '@lexical/link': `${base}/@lexical/link@${version}${ext}`,
    '@lexical/html': `${base}/@lexical/html@${version}${ext}`,
    '@lexical/selection': `${base}/@lexical/selection@${version}${ext}`,
  };
  return `<script type="importmap" id="${IMPORTMAP_ID}">${JSON.stringify({ imports })}</script>`;
}

/** True for admin HTML responses, the only pages that render Lexical fields. */
export function shouldHoist(request: Request, response: Response): boolean {
  if (!response.ok) return false;
  if (!new URL(request.url).pathname.startsWith('/admin')) return false;
  return (response.headers.get('content-type') ?? '').includes('text/html');
}

export function hoistLexicalImportMap(request: Request, response: Response): Response {
  if (!shouldHoist(request, response)) return response;

  return new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append(buildLexicalImportMap(), { html: true });
      },
    })
    .on(`script#${IMPORTMAP_ID}`, {
      element(element) {
        // Core's late duplicate. Two maps make Firefox log a hard error and
        // Chrome drop the conflicting rules, so keep only the hoisted one.
        element.remove();
      },
    })
    .transform(response);
}
