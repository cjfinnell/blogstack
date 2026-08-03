import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { isCmsChanged } from './resolve-deploy-matrix.ts';

describe('isCmsChanged', () => {
  it('flags files under apps/cms/', () => {
    expect(isCmsChanged(['apps/cms/src/index.ts'])).toBe(true);
  });

  it('flags wrangler.template.toml', () => {
    expect(isCmsChanged(['README.md', 'wrangler.template.toml'])).toBe(true);
  });

  it('ignores files outside apps/cms/ and wrangler.template.toml', () => {
    expect(
      isCmsChanged(['apps/web-terminal/src/index.astro', 'packages/blog-client/src/index.ts']),
    ).toBe(false);
  });

  it('ignores an empty changeset', () => {
    expect(isCmsChanged([])).toBe(false);
  });
});

const repoRoot = resolve(import.meta.dirname, '..');
const tsxBin = join(repoRoot, 'node_modules', '.bin', 'tsx');
const scriptPath = join(repoRoot, 'scripts', 'resolve-deploy-matrix.ts');

function git(dir: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
}

function initRepoWithBranchPoint(dir: string): string {
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Test');
  writeFileSync(join(dir, 'README.md'), 'root\n');
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'root');
  return git(dir, 'rev-parse', 'HEAD').trim();
}

function runResolve(dir: string, base: string, head: string): string {
  return execFileSync(tsxBin, [scriptPath], {
    cwd: dir,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'pull_request',
      ALL_SITES: '[]',
      PR_BASE_SHA: base,
      PR_HEAD_SHA: head,
    },
  });
}

function runResolvePush(dir: string, base: string, head: string, allSites: string[]): string {
  return execFileSync(tsxBin, [scriptPath], {
    cwd: dir,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'push',
      ALL_SITES: JSON.stringify(allSites),
      BASE_SHA: base,
      HEAD_SHA: head,
    },
  });
}

describe('push event', () => {
  it('treats a root package.json/package-lock.json change (e.g. a Renovate PR) as global, deploying every site', () => {
    const dir = mkdtempSync(join(tmpdir(), 'resolve-deploy-matrix-'));
    try {
      const base = initRepoWithBranchPoint(dir);

      writeFileSync(join(dir, 'package.json'), '{"name":"root","version":"0.0.2"}\n');
      writeFileSync(join(dir, 'package-lock.json'), '{"lockfileVersion":3}\n');
      git(dir, 'add', '.');
      git(dir, 'commit', '-q', '-m', 'chore(deps): bump a root devDependency');
      const head = git(dir, 'rev-parse', 'HEAD').trim();

      const output = runResolvePush(dir, base, head, ['terminal', 'folio']);

      expect(output).toContain('sites=["terminal","folio"]');
      expect(output).toContain('cms_changed=false');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('pull_request event', () => {
  it('reports cms_changed=true for a branch that touched apps/cms/, ignoring commits main gained afterward', () => {
    const dir = mkdtempSync(join(tmpdir(), 'resolve-deploy-matrix-'));
    try {
      const base = initRepoWithBranchPoint(dir);

      git(dir, 'checkout', '-q', '-b', 'feature');
      mkdirSync(join(dir, 'apps', 'cms', 'src'), { recursive: true });
      writeFileSync(join(dir, 'apps', 'cms', 'src', 'index.ts'), 'export {};\n');
      git(dir, 'add', '.');
      git(dir, 'commit', '-q', '-m', 'touch cms');
      const head = git(dir, 'rev-parse', 'HEAD').trim();

      // main moves on after the branch point — a three-dot diff must ignore this.
      git(dir, 'checkout', '-q', 'main');
      writeFileSync(join(dir, 'README.md'), 'root, updated\n');
      git(dir, 'add', '.');
      git(dir, 'commit', '-q', '-m', 'unrelated main commit');

      const output = runResolve(dir, base, head);

      expect(output).toContain('sites=[]');
      expect(output).toContain('cms_changed=true');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports cms_changed=false for a branch that never touched CMS files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'resolve-deploy-matrix-'));
    try {
      const base = initRepoWithBranchPoint(dir);

      git(dir, 'checkout', '-q', '-b', 'feature');
      writeFileSync(join(dir, 'apps-web-note.md'), 'web change\n');
      git(dir, 'add', '.');
      git(dir, 'commit', '-q', '-m', 'unrelated feature commit');
      const head = git(dir, 'rev-parse', 'HEAD').trim();

      const output = runResolve(dir, base, head);

      expect(output).toContain('cms_changed=false');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
