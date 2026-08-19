/**
 * Refuses every write to the `global-variables` core plugin, which this CMS
 * does not use and cannot uninstall.
 *
 * Site copy lives in the `site_copy` collection (see
 * collections/site-copy.collection.ts). It used to live in this plugin, and the
 * move is what closed the underlying problem: the plugin's `content:read` hook
 * substitutes every `{key}` token it finds into the data a read returns — post
 * bodies included, unescaped, and post bodies are rendered into the static site
 * with `set:html`. A variable's *value* was therefore markup on the public
 * site, resolved into posts whose authors never wrote it.
 *
 * The plugin itself is a core plugin: `createSonicJSApp` mounts it whether or
 * not anything here wants it, so its routes exist on this Worker regardless.
 * They are guarded by nothing worth the name, checked against
 * @sonicjs-cms/core@3.0.0-beta.26:
 *
 *   `POST /api/global-variables` and `PUT|DELETE /api/global-variables/:id`
 *   carry no auth middleware at all — the only thing in front of them is a
 *   check that the plugin is active, and that check fails open: it reads the
 *   `plugins` table, which does not exist in any of these databases, and its
 *   catch swallows the error and calls next(). They are unreachable today, but
 *   only because core mounts `/api` and its `/:collection` wildcard before it mounts
 *   plugin routes, so the wildcard's own `requireAuth()` + `requireRole()`
 *   answers first. That is mount order, not a decision, and core has already
 *   started pre-mounting paths ahead of that wildcard.
 *
 *   `POST /admin/global-variables`, `PUT /:id`, `POST /:id/toggle` and
 *   `DELETE /:id` inherit core's app-wide `/admin/*` `requireAuth()` +
 *   `requireRbac('portal', 'access')` and nothing more. The plugin declares a
 *   `global-variables:manage` permission, but only its menu item is gated on
 *   it. Every portal-access role can write variables — core's seeded `editor`
 *   role among them — and because `apiKeyAuthMiddleware` runs on `*` rather
 *   than `/api/*`, an API key authenticates there exactly like a session, with
 *   CSRF skipped whenever an Authorization header is present. The MCP key this
 *   CMS mints is documented as having its user's document ACL for a blast
 *   radius; that is true only while this holds.
 *
 * So: no writes, by anyone, by any credential. Reads are left alone — a `GET`
 * gets core's wildcard 404 and costs nothing to allow.
 *
 * The `global_variables` table has been dropped from every database, dev and
 * production alike, so there is nothing behind these routes to read or corrupt
 * either. This stays because the plugin's install hook would recreate that
 * table the moment someone activated it from /admin/plugins, and the routes
 * above would then be live and unauthenticated again.
 *
 * This runs in front of the whole app, where it lands ahead of core's route
 * table. A plugin cannot do it: core registers the global-variables routes
 * before any user plugin, and Hono answers with the first handler that matches.
 */

const WRITE_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const GUARDED_PREFIXES = ['/api/global-variables', '/admin/global-variables'];

// Matching on the whole segment, so a future `/admin/global-variables-export`
// is not silently covered by — or exempted from — a rule written for this one.
function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * The response to send instead of dispatching, or null to let the app handle it.
 */
export function guardGlobalVariables(request: Request): Response | null {
  if (WRITE_SAFE_METHODS.has(request.method.toUpperCase())) return null;

  const { pathname } = new URL(request.url);
  if (!GUARDED_PREFIXES.some((prefix) => underPrefix(pathname, prefix))) return null;

  return new Response(
    JSON.stringify({
      success: false,
      error:
        'The global-variables plugin is not used by this CMS and its write routes are ' +
        'unauthenticated. Site copy lives in the Site Copy collection.',
    }),
    { status: 403, headers: { 'content-type': 'application/json' } },
  );
}
