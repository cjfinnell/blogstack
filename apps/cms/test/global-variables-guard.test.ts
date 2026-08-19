import { describe, expect, it } from 'vitest';

import { guardGlobalVariables } from '../src/global-variables-guard';

const BASE = 'https://cms.example';

function req(method: string, path: string, headers: Record<string, string> = {}): Request {
  return new Request(`${BASE}${path}`, { method, headers });
}

describe('guardGlobalVariables', () => {
  it('lets reads through', () => {
    expect(guardGlobalVariables(req('GET', '/api/global-variables'))).toBeNull();
    expect(guardGlobalVariables(req('HEAD', '/admin/global-variables'))).toBeNull();
    expect(guardGlobalVariables(req('OPTIONS', '/admin/global-variables'))).toBeNull();
  });

  it('leaves everything outside the plugin alone', () => {
    expect(guardGlobalVariables(req('POST', '/api/blog_post'))).toBeNull();
    expect(guardGlobalVariables(req('POST', '/api/site_copy'))).toBeNull();
    expect(guardGlobalVariables(req('POST', '/mcp', { 'x-api-key': 'sk_key' }))).toBeNull();
    expect(guardGlobalVariables(req('POST', '/admin/content'))).toBeNull();
  });

  // Core's plugin mounts these with no auth middleware at all; they only 401
  // today because core's /api/:collection wildcard is registered first.
  it.each([
    ['POST', '/api/global-variables'],
    ['PUT', '/api/global-variables/some-id'],
    ['DELETE', '/api/global-variables/some-id'],
    ['PATCH', '/api/global-variables/some-id'],
  ])('refuses %s %s', (method, path) => {
    expect(guardGlobalVariables(req(method, path))?.status).toBe(403);
  });

  // The admin routes check nothing beyond portal access, and core resolves API
  // keys on /admin/* too — so no credential is exempt here, session included.
  it.each([
    ['no credential', {}],
    ['an admin session cookie', { cookie: 'auth_token=abc; csrf_token=def' }],
    ['an x-api-key header', { 'x-api-key': 'sk_live_whatever' }],
    ['an sk_ bearer token', { authorization: 'Bearer sk_live_whatever' }],
  ])('refuses an admin write presented with %s', (_label, headers) => {
    expect(guardGlobalVariables(req('POST', '/admin/global-variables', headers))?.status).toBe(403);
    expect(guardGlobalVariables(req('POST', '/admin/global-variables/1/toggle'))?.status).toBe(403);
    expect(guardGlobalVariables(req('DELETE', '/admin/global-variables/1', headers))?.status).toBe(
      403,
    );
  });

  it('says where site copy actually lives', async () => {
    const res = guardGlobalVariables(req('POST', '/api/global-variables'));
    if (!res) throw new Error('expected the guard to refuse this write');
    const body: unknown = await res.json();
    expect((body as { error: string }).error).toMatch(/Site Copy collection/);
  });

  it('matches on whole path segments, not string prefixes', () => {
    expect(guardGlobalVariables(req('POST', '/api/global-variables-export'))).toBeNull();
    expect(guardGlobalVariables(req('POST', '/admin/global-variables-export'))).toBeNull();
  });
});
