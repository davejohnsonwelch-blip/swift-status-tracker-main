import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";
import type { Database } from "./types";

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;
const NEON_DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL;

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
