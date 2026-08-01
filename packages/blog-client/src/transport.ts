// Rendering is SSG in v1 (see PLAN.md#why-ssg). This seam exists so an
// SSR flip is a one-line change at the call site — swap httpTransport for
// serviceTransport — rather than a rewrite of every fetch call.

export interface Transport {
  fetch(path: string, init?: RequestInit): Promise<Response>;
}

export function httpTransport(baseUrl: string): Transport {
  const base = baseUrl.replace(/\/$/, '');
  return { fetch: (path, init) => fetch(`${base}${path}`, init) };
}

interface WorkerFetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

// unused in v1; exists so SSR is a one-line change at the call site
export function serviceTransport(binding: WorkerFetcher): Transport {
  return { fetch: (path, init) => binding.fetch(`https://cms.internal${path}`, init) };
}
