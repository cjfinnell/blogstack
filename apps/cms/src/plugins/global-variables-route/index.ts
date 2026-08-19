/**
 * Serves the global-variables key→value map from a path the core router does not
 * shadow.
 *
 * The global-variables plugin mounts its own API at `/api/global-variables`, but
 * @sonicjs-cms/core mounts `/api` — whose `/:collection` wildcard swallows any
 * unmatched path — before it registers plugin routes. So every request to
 * `/api/global-variables/resolve` is answered by the collection handler with
 * `404 {"error":"Collection not found"}`, and the plugin's route is unreachable
 * even though the plugin is active and its admin page at
 * /admin/global-variables works. Core knows about the hazard: it pre-mounts
 * `/api/media`, `/api/system`, `/api/documents` and `/api/events` ahead of the
 * wildcard for exactly this reason, and the MCP plugin sits at top-level `/mcp`
 * rather than `/api/mcp` to dodge it. The global-variables plugin was not given
 * the same treatment.
 *
 * Rather than fork core, this mounts a read-only equivalent at `/global-variables`,
 * which has no wildcard in front of it. The response envelope matches the
 * plugin's `/resolve` exactly, so the frontend client is unaffected apart from
 * the path.
 *
 * Read-only on purpose. The plugin's own POST/PUT/DELETE routes carry no auth
 * middleware; they are currently unreachable behind the same shadowing, and
 * nothing here should be the thing that changes that.
 */

import { definePlugin } from '@sonicjs-cms/core';
import { Hono } from 'hono';

interface GlobalVariableRow {
  key: string;
  value: string;
}

interface VariablesDb {
  prepare: (query: string) => {
    all: () => Promise<{ results?: GlobalVariableRow[] | null }>;
  };
}

// The plugin's own query, verbatim: inactive variables are excluded rather than
// resolved to an empty string, so an editor who deactivates a key sees the
// unresolved `{key}` token instead of a silent blank.
const QUERY = 'SELECT key, value FROM global_variables WHERE is_active = 1';

/** Read the resolved variable map. Exported for the test; the route is a thin wrapper. */
export async function readVariablesMap(db: VariablesDb): Promise<Record<string, string>> {
  const { results } = await db.prepare(QUERY).all();
  const out: Record<string, string> = {};
  for (const row of results ?? []) {
    out[row.key] = row.value;
  }
  return out;
}

const routes = new Hono<{ Bindings: { DB: VariablesDb } }>();

routes.get('/resolve', async (c) => {
  try {
    return c.json({ success: true, data: await readVariablesMap(c.env.DB) });
  } catch {
    // The frontend refuses to build on a failed read rather than shipping
    // placeholder copy, so the status code matters more than the body.
    return c.json({ success: false, error: 'Failed to resolve variables' }, 500);
  }
});

export const globalVariablesRoutePlugin = definePlugin({
  id: 'global-variables-route',
  name: 'Global Variables Route',
  version: '1.0.0',
  description:
    'Serves the global-variables resolve map at /global-variables/resolve, clear of the /api/:collection wildcard.',
  sonicjsVersionRange: '^3.0.0',

  register(app) {
    app.route('/global-variables', routes as never);
  },
});
