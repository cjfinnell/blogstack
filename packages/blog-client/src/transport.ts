// Rendering is SSG in v1 (see PLAN.md#why-ssg). This seam exists so an
// SSR flip is a one-line change at the call site — swap httpTransport for
// serviceTransport — rather than a rewrite of every fetch call.

export interface Transport {
  fetch(path: string, init?: RequestInit): Promise<Response>;
}

// The CMS answers anonymous reads with published rows only, whatever the
// filter asks for, so a drafts-included client also needs a token. Optional:
// the static builds read published rows and run without one.
export function httpTransport(baseUrl: string, token?: string): Transport {
  const base = baseUrl.replace(/\/$/, '');
  if (!token) return { fetch: (path, init) => fetch(`${base}${path}`, init) };
  return {
    fetch: (path, init) => {
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${token}`);
      return fetch(`${base}${path}`, { ...init, headers });
    },
  };
}

interface WorkerFetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

// unused in v1; exists so SSR is a one-line change at the call site
export function serviceTransport(binding: WorkerFetcher): Transport {
  return { fetch: (path, init) => binding.fetch(`https://cms.internal${path}`, init) };
}
