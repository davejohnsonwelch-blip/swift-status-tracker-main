import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";
import type { Database } from "./types";

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;
const NEON_DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL;

const NEON_AUTH_ORIGIN = (() => {
  try {
    return new URL(NEON_AUTH_URL).origin;
  } catch {
    return null;
  }
})();

if (typeof window !== "undefined" && NEON_AUTH_ORIGIN) {
  const originalFetch = window.fetch;
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    let rewritten: RequestInfo | URL = input;

    if (typeof input === "string" && input.startsWith(NEON_AUTH_ORIGIN)) {
      rewritten = "/api/auth" + input.slice(NEON_AUTH_ORIGIN.length);
    } else if (input instanceof URL && input.origin === NEON_AUTH_ORIGIN) {
      rewritten = new URL("/api/auth" + input.pathname + input.search, window.location.origin);
    } else if (input instanceof Request && new URL(input.url).origin === NEON_AUTH_ORIGIN) {
      const parsed = new URL(input.url);
      const newUrl = "/api/auth" + parsed.pathname + parsed.search;
      rewritten = new Request(newUrl, {
        method: input.method,
        headers: input.headers,
        body: input.body,
        redirect: "follow",
      });
    }

    return originalFetch(rewritten, init);
  }) as typeof window.fetch;
}

export const neon = createClient<Database>({
  auth: {
    url: NEON_AUTH_URL,
    adapter: SupabaseAuthAdapter(),
    allowAnonymous: false,
  },
  dataApi: {
    url: NEON_DATA_API_URL,
  },
});

export type NeonClient = typeof neon;
export default neon;
