/**
 * useDemoMode.js
 * ─────────────────────────────────────────────────────────────
 * Single switch to enable/disable demo mode across the whole app.
 *
 *   DEMO_MODE = true   →  all hooks return hardcoded demo data
 *   DEMO_MODE = false  →  all hooks hit the real DB / APIs
 *
 * Nothing in the database is touched either way.
 * ─────────────────────────────────────────────────────────────
 */

export const DEMO_MODE = true;
