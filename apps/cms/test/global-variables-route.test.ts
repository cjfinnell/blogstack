import { describe, expect, it, vi } from 'vitest';

import { readVariablesMap } from '../src/plugins/global-variables-route';

function fakeDb(results: { key: string; value: string }[] | null) {
  const all = vi.fn().mockResolvedValue({ results });
  const prepare = vi.fn().mockReturnValue({ all });
  return { db: { prepare }, prepare, all };
}

describe('readVariablesMap', () => {
  it('turns rows into the key→value map the frontend expects', async () => {
    const { db } = fakeDb([
      { key: 'site_name', value: 'Maria Eleni' },
      { key: 'tagline', value: 'Food, hospitality, and the business of both' },
    ]);

    await expect(readVariablesMap(db)).resolves.toEqual({
      site_name: 'Maria Eleni',
      tagline: 'Food, hospitality, and the business of both',
    });
  });

  it('excludes inactive variables, as the plugin does', async () => {
    // Deactivating a key should surface the unresolved {key} token to an editor,
    // not resolve it to a blank.
    const { db, prepare } = fakeDb([]);
    await readVariablesMap(db);
    expect(prepare).toHaveBeenCalledWith(
      'SELECT key, value FROM global_variables WHERE is_active = 1',
    );
  });

  it('returns an empty map when the table is empty or D1 omits results', async () => {
    await expect(readVariablesMap(fakeDb([]).db)).resolves.toEqual({});
    await expect(readVariablesMap(fakeDb(null).db)).resolves.toEqual({});
  });
});
