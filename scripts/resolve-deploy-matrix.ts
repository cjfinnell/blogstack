// Computes which sites deploy.yml's matrix should cover, and whether the CMS
// needs redeploying alongside the web build. See PLAN.md#github-actions.
//
// GitHub's `secrets` context is unavailable in `strategy.matrix` (constraint
// 2 in PLAN.md#anonymity) — the matrix can only read `vars.SITES`, echoed
// unmasked into public logs, hence codenames only.

import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const eventName = process.env.GITHUB_EVENT_NAME;
const allSites = JSON.parse(process.env.ALL_SITES ?? '[]') as string[];

function writeOutput(sites: string[], cmsChanged: boolean) {
  const lines = [`sites=${JSON.stringify(sites)}`, `cms_changed=${cmsChanged}`];
  const outputPath = process.env.GITHUB_OUTPUT;
  for (const line of lines) {
    if (outputPath) appendFileSync(outputPath, `${line}\n`);
    console.log(line);
  }
}

function validated(site: string | undefined): string[] {
  if (!site || !allSites.includes(site)) {
    throw new Error(`Rejected site "${site}" — not in vars.SITES (${allSites.join(', ')})`);
  }
  return [site];
}

// Shared by the `push` and `pull_request` cases below — one definition of
// "does this set of changed files touch the CMS" for both deploy.yml and
// preview.yml to agree on.
export function isCmsChanged(changedFiles: string[]): boolean {
  return changedFiles.some((f) => f.startsWith('apps/cms/') || f === 'wrangler.template.toml');
}

function main() {
  switch (eventName) {
    case 'repository_dispatch': {
      // A content publish, not a code change — only the web build needs
      // refreshing with the new content, not the CMS worker itself.
      writeOutput(validated(process.env.DISPATCH_SITE), false);
      break;
    }
    case 'workflow_dispatch': {
      const input = process.env.INPUT_SITE;
      const sites = input === 'all' ? allSites : validated(input);
      writeOutput(sites, true);
      break;
    }
    case 'push': {
      const base = process.env.BASE_SHA;
      const head = process.env.HEAD_SHA;
      const diff = execSync(`git diff --name-only ${base} ${head}`, { encoding: 'utf8' });
      const changed = diff.split('\n').filter(Boolean);

      const cmsChanged = isCmsChanged(changed);
      // Root package.json/package-lock.json cover every workspace via a
      // single hoisted node_modules — a dep bump there (e.g. a Renovate PR)
      // can affect any site's build even though it touches no apps/ path.
      const globalChange =
        cmsChanged ||
        changed.some((f) => f.startsWith('packages/')) ||
        changed.includes('package.json') ||
        changed.includes('package-lock.json');

      const sites = globalChange
        ? allSites
        : allSites.filter((site) => changed.some((f) => f.startsWith(`apps/web-${site}/`)));

      writeOutput(sites, cmsChanged);
      break;
    }
    case 'pull_request': {
      // Three-dot (merge-base to head), not two-dot — "did this PR ever
      // touch CMS files relative to where it branched," not an incremental
      // diff between consecutive pushes. preview.yml only reads
      // `cms_changed` from this path; `sites` is unused.
      const base = process.env.PR_BASE_SHA;
      const head = process.env.PR_HEAD_SHA;
      const diff = execSync(`git diff --name-only ${base}...${head}`, { encoding: 'utf8' });
      const changed = diff.split('\n').filter(Boolean);
      writeOutput([], isCmsChanged(changed));
      break;
    }
    default:
      throw new Error(`Unhandled event: ${eventName}`);
  }
}

if (import.meta.filename === process.argv[1]) {
  main();
}
