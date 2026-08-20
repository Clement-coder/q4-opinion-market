/**
 * src/lib/supabase.js
 * Single Supabase client instance for the entire app.
 *
 * Uses the publishable key — all access is governed by Row Level Security.
 * Falls back to the legacy anon key if the publishable key is not set.
 *
 * setFirebaseUID(uid) — call this once after sign-in so that RLS policies
 * that reference firebase_uid() resolve correctly.
 *
 * IMPORTANT: The x-firebase-uid header is injected via a custom fetch wrapper
 * so it is re-evaluated on every request. Using global.headers with a getter
 * does NOT work in Supabase JS v2 because createClient snapshots those headers
 * once at construction time via `new Headers(global.headers)`.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file."
  );
}

// Mutable header store — updated by setFirebaseUID after sign-in
let _firebaseUID = "";

/**
 * Custom fetch wrapper that injects x-firebase-uid on every outbound request.
 * This is necessary because Supabase JS v2 snapshots the global.headers object
 * once at createClient time, so a getter on that object would only be evaluated
 * once and wouldn't pick up UID changes that happen after sign-in.
 */
function fetchWithFirebaseUID(url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  if (_firebaseUID) {
    headers.set("x-firebase-uid", _firebaseUID);
  }
  return fetch(url, { ...options, headers });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // Auth is handled by Firebase — disable Supabase's own auth flow
    persistSession:       false,
    autoRefreshToken:     false,
    detectSessionFromUrl: false,
  },
  global: {
    fetch: fetchWithFirebaseUID,
  },
});

/**
 * Call after Firebase sign-in resolves.
 * Sets the Firebase UID so that all subsequent Supabase requests include
 * the x-firebase-uid header and RLS policies resolve correctly.
 */
export function setFirebaseUID(uid) {
  _firebaseUID = uid ?? "";
}

/**
 * Returns the currently stored Firebase UID (empty string if not signed in).
 * Use this to guard writes that require RLS to pass.
 */
export function getFirebaseUID() {
  return _firebaseUID;
}
