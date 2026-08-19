import { describe, expect, it } from 'vitest';

import { guardGlobalVariables } from '../src/global-variables-guard';

const BASE = 'https://cms.example';

function req(method: string, path: string, headers: Record<string, string> = {}): Request {
  return new Request(`${BASE}${path}`, { method, headers });
}

describe('guardGlobalVariables', () => {
  it('lets reads through on every global-variables path', () => {
    expect(guardGlobalVariables(req('GET', '/global-variables/resolve'))).toBeNull();
    expect(guardGlobalVariables(req('GET', '/api/global-variables'))).toBeNull();
    expect(guardGlobalVariables(req('HEAD', '/admin/global-variables'))).toBeNull();
    expect(guardGlobalVariables(req('OPTIONS', '/admin/global-variables'))).toBeNull();
  });

  it('leaves everything outside the global-variables paths alone', () => {
    expect(guardGlobalVariables(req('POST', '/api/blog_post'))).toBeNull();
    expect(guardGlobalVariables(req('POST', '/mcp', { 'x-api-key': 'sk_key' }))).toBeNull();
    expect(guardGlobalVariables(req('POST', '/admin/content'))).toBeNull();
  });

  // Core's plugin mounts these with no auth middleware at all; they only 401
  // today because core's /api/:collection wildcard is registered first. Refusing
  // them here means a change to core's mount order cannot open them.
  it.each([
    ['POST', '/api/global-variables'],
    ['PUT', '/api/global-variables/some-id'],
    ['DELETE', '/api/global-variables/some-id'],
    ['PATCH', '/api/global-variables/some-id'],
  ])('refuses %s %s outright', (method, path) => {
    const res = guardGlobalVariables(req(method, path));
    expect(res?.status).toBe(403);
  });

  it('refuses writes to this repo’s own read-only re-mount', () => {
    expect(guardGlobalVariables(req('POST', '/global-variables/resolve'))?.status).toBe(403);
  });

  // The MCP key's blast radius is supposed to be its user's document ACL. Core
  // authenticates API keys on /admin/* too, and the admin global-variables
  // routes check nothing beyond portal access, so this is the line that holds.
  it.each([
    ['x-api-key header', { 'x-api-key': 'sk_live_whatever' }],
    ['sk_ bearer token', { authorization: 'Bearer sk_live_whatever' }],
    ['case-insensitive bearer', { authorization: 'bearer sk_live_whatever' }],
  ])('refuses an admin write presented with an API key (%s)', (_label, headers) => {
    const res = guardGlobalVariables(req('POST', '/admin/global-variables', headers));
    expect(res?.status).toBe(403);
    expect(guardGlobalVariables(req('DELETE', '/admin/global-variables/1', headers))?.status).toBe(
      403,
    );
  });

  it('lets a signed-in human edit copy in the admin', () => {
    // A session cookie, which is what the admin UI actually sends. Editing site
    // copy from the admin is the feature; the guard must not touch it.
    const headers = { cookie: 'auth_token=abc; csrf_token=def' };
    expect(guardGlobalVariables(req('POST', '/admin/global-variables', headers))).toBeNull();
    expect(
      guardGlobalVariables(req('POST', '/admin/global-variables/1/toggle', headers)),
    ).toBeNull();
  });

  it('does not treat a non-sk_ bearer token as an API key', () => {
    // Core only resolves `sk_`-prefixed bearers as keys; a JWT bearer is a
    // session, and matching it here would refuse a write core would allow.
    const headers = { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig' };
    expect(guardGlobalVariables(req('POST', '/admin/global-variables', headers))).toBeNull();
  });

  it('matches on whole path segments, not string prefixes', () => {
    expect(guardGlobalVariables(req('POST', '/api/global-variables-export'))).toBeNull();
    expect(
      guardGlobalVariables(req('POST', '/admin/global-variables-export', { 'x-api-key': 'sk_k' })),
    ).toBeNull();
  });
});
