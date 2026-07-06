import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Deliberately staying on neon-http rather than the pooled neon-serverless driver: measured
// directly against the live DB, a pooled connection makes Promise.all-style concurrent queries
// ~3x SLOWER (each concurrent call forces a fresh WebSocket handshake) since Postgres
// connections process one query at a time — there's no multiplexing to parallelize over. This
// codebase fetches data with Promise.all throughout (see (app)/layout.tsx and every page), and
// that pattern is exactly what neon-http is good at: every query is an independent, stateless
// HTTPS request, so concurrent queries genuinely run concurrently. Don't revisit this without
// also rewriting those call sites to sequential awaits — see project memory for the numbers.
export const db = drizzle(process.env.DATABASE_URL!, { schema });
