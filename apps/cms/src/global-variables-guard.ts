/**
 * Refuses global-variable writes that no legitimate flow makes.
 *
 * Global variables are not ordinary content. The `global-variables` core plugin
 * subscribes to `content:read` and substitutes every `{key}` token it finds in
 * the data a read returns — post bodies included — and post bodies are rendered
 * into the static site with `set:html`. So a variable's *value* is markup on
 * the public site, resolved into posts whose authors never wrote it. Whoever can
 * write a variable can write into everyone's published pages.
 *
 * Core does not treat them that way. Two gaps, both examined against
 * @sonicjs-cms/core@3.0.0-beta.26:
 *
 *   The plugin's REST routes (`POST /api/global-variables`,
 *   `PUT|DELETE /api/global-variables/:id`) carry no auth middleware at all —
 *   the only thing in front of them is a check that the plugin is active. They
 *   are unreachable today, but only by accident: core mounts `/api` and its
 *   `/:collection` wildcard before it mounts plugin routes, so the wildcard's
 *   own `requireAuth()` + `requireRole()` answers first. That is mount order,
 *   not a decision. Core has already started pre-mounting paths ahead of the
 *   wildcard (`/api/media`, `/api/system`, `/api/documents`, `/api/events`) and
 *   fixed plugin routes that never mounted at all (their #758); the day
 *   `/api/global-variables` gets the same treatment, those write routes go live
 *   unauthenticated.
 *
 *   The plugin's admin routes (`POST /admin/global-variables`, `PUT /:id`,
 *   `POST /:id/toggle`, `DELETE /:id`) inherit core's app-wide
 *   `/admin/*` `requireAuth()` + `requireRbac('portal', 'access')`, and nothing
 *   more. The plugin declares a `global-variables:manage` permission, but only
 *   its *menu item* is gated on it — the routes check no permission. Every role
 *   with portal access can therefore write variables, and core's own seeded
 *   `editor` role has portal access without `global-variables:manage`.
 *
 * The second gap matters here because of API keys. Core's `apiKeyAuthMiddleware`
 * runs on `*`, not just `/api/*`, so an `x-api-key` or `Authorization: Bearer
 * sk_…` credential authenticates against `/admin/*` exactly like a session
 * cookie, and CSRF is skipped whenever an Authorization header is present. The
 * MCP key this CMS mints (see index.ts) is meant to have the key owner's
 * document ACL as its entire blast radius. Without this guard it does not: the
 * same key can POST `/admin/global-variables` and inject markup into posts the
 * key's user cannot touch.
 *
 * So this runs in front of the whole app, where it lands ahead of core's route
 * table — a plugin cannot do it, because core registers the global-variables
 * routes before any user plugin and Hono answers with the first handler that
 * matches. It denies:
 *
 *   every write to `/api/global-variables*`, which nothing legitimate calls
 *   (the routes are shadowed, and the frontend reads the map from
 *   `/global-variables/resolve`) — so the mount-order accident above stops
 *   being load-bearing;
 *
 *   every write to `/admin/global-variables*` presented with an API key,
 *   because the admin UI is a browser session and no key-holding caller has
 *   business editing site copy;
 *
 *   every write to `/global-variables*`, this repo's own read-only re-mount.
 *
 * What it deliberately leaves alone: a signed-in human editing copy at
 * /admin/global-variables. That is the feature. The residual exposure is that
 * any portal-access role can edit those values, not just an admin — with the
 * blog's single-owner user list that is the intended trust boundary, and it is
 * core's permission check to add, not something to fake from out here.
 */

const WRITE_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Paths whose writes are denied outright: nothing legitimate posts to them. */
const CLOSED_PREFIXES = ['/api/global-variables', '/global-variables'];

/** Paths whose writes are denied only to API-key callers. */
const SESSION_ONLY_PREFIXES = ['/admin/global-variables'];

// Matching on the whole segment, so a future `/admin/global-variables-export`
// is not silently covered by — or exempted from — a rule written for this one.
function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * True when the request carries an API key rather than an admin session.
 *
 * Mirrors core's `apiKeyAuthMiddleware`: an `x-api-key` header, or a bearer
 * token in the `sk_` keyspace. A session cookie is neither.
 */
function hasApiKeyCredential(request: Request): boolean {
  if (request.headers.get('x-api-key')) return true;
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.toLowerCase().startsWith('bearer ')) return false;
  return authorization.slice(7).trim().startsWith('sk_');
}

function denied(reason: string): Response {
  return new Response(JSON.stringify({ success: false, error: reason }), {
    status: 403,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * The response to send instead of dispatching, or null to let the app handle it.
 */
export function guardGlobalVariables(request: Request): Response | null {
  if (WRITE_SAFE_METHODS.has(request.method.toUpperCase())) return null;

  const { pathname } = new URL(request.url);

  if (CLOSED_PREFIXES.some((prefix) => underPrefix(pathname, prefix))) {
    return denied(
      'Global variables are read-only over the API. Edit them at /admin/global-variables.',
    );
  }

  if (
    SESSION_ONLY_PREFIXES.some((prefix) => underPrefix(pathname, prefix)) &&
    hasApiKeyCredential(request)
  ) {
    return denied('Global variables cannot be edited with an API key. Sign in to the admin.');
  }

  return null;
}
