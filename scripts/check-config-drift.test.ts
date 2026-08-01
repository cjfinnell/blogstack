import { describe, expect, it } from 'vitest';
import { checkConfigDrift } from './check-config-drift.ts';

describe('config drift', () => {
  it('wrangler.template.toml matches config/sites.ts and mise.toml', () => {
    const errors = checkConfigDrift();
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
