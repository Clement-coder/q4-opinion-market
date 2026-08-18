/**
 * src/lib/supabase.js
 * Single Supabase client instance for the entire app.
 *
 * Uses the publishable key — all access is governed by Row Level Security.
 * Falls back to the legacy anon key if the publishable key is not set.
 *
 * setFirebaseUID(uid) — call this once after sign-in so that RLS policies
 * that reference current_setting('app.firebase_uid') resolve correctly.
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

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // Auth is handled by Firebase — disable Supabase's own auth flow
    persistSession:       false,
    autoRefreshToken:     false,
    detectSessionFromUrl: false,
  },
  global: {
    headers: {
      // Pass the Firebase UID to Postgres via a custom header.
      // The RLS policies read this via current_setting('app.firebase_uid').
      get "x-firebase-uid"() { return _firebaseUID; },
    },
  },
});

/**
 * Call after Firebase sign-in resolves.
 * Sets the Firebase UID in all subsequent Supabase requests so that
 * RLS policies that filter by firebase_uid work correctly.
 */
export function setFirebaseUID(uid) {
  _firebaseUID = uid ?? "";
}
