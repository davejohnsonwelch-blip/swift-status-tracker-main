import { createClient } from "@neondatabase/neon-js";
import type { Database } from "./types";
import { NEON_AUTH_URL, NEON_DATA_API_URL } from "./client";

let cached: { token: string; expiresAt: number } | null = null;

async function getAnonymousToken(): Promise<string | null> {
  const now = Date.now() / 1000;
  if (cached && cached.expiresAt > now + 60) return cached.token;
  try {
    const res = await fetch(`${NEON_AUTH_URL}/token/anonymous`);
    if (!res.ok) return null;
    const data = await res.json();
    cached = { token: data.token, expiresAt: data.expires_at };
    return data.token;
  } catch {
    return null;
  }
}

export const publicNeon = createClient<Database>({
  dataApi: {
    url: NEON_DATA_API_URL,
    getToken: getAnonymousToken,
  },
});