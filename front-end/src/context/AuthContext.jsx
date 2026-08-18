/**
 * AuthContext.jsx
 * Firebase handles authentication.
 * On every sign-in we upsert the user into Supabase and read their role.
 * We also inject the Firebase UID into the Supabase client header so that
 * all Row Level Security policies that reference app.firebase_uid work.
 *
 * Exposed values:
 *   user      — Firebase user object (null if signed out)
 *   profile   — Supabase users row { id, firebase_uid, email, display_name, role, created_at }
 *   role      — "admin" | "user" | null
 *   isAdmin   — boolean shorthand
 *   loading   — true while resolving auth state
 *   signInWithGoogle
 *   logout
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { supabase, setFirebaseUID } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Upsert user in Supabase, inject UID header, return the full profile row.
   * Every sign-in — including page refreshes — goes through this path.
   */
  const syncUserToSupabase = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      // Clear the header when signed out
      setFirebaseUID(null);
      setProfile(null);
      return;
    }

    // Inject UID into all future Supabase requests before the upsert
    setFirebaseUID(firebaseUser.uid);

    try {
      // Check if user already exists — if so, only update non-role fields
      // to preserve any admin role that was manually assigned.
      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", firebaseUser.uid)
        .maybeSingle();

      let data, error;

      if (existing) {
        // User exists — update everything except role
        ({ data, error } = await supabase
          .from("users")
          .update({
            email:        firebaseUser.email,
            display_name: firebaseUser.displayName,
            avatar_url:   firebaseUser.photoURL,
            updated_at:   new Date().toISOString(),
          })
          .eq("firebase_uid", firebaseUser.uid)
          .select("*")
          .single());
      } else {
        // New user — insert with default role 'user'
        ({ data, error } = await supabase
          .from("users")
          .insert({
            firebase_uid: firebaseUser.uid,
            email:        firebaseUser.email,
            display_name: firebaseUser.displayName,
            avatar_url:   firebaseUser.photoURL,
            role:         "user",
            updated_at:   new Date().toISOString(),
          })
          .select("*")
          .single());
      }

      if (error) {
        console.error("[AuthContext] Supabase sync error:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("[AuthContext] Unexpected error syncing user:", err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ?? null);
      await syncUserToSupabase(firebaseUser ?? null);
      setLoading(false);
    });
    return unsub;
  }, [syncUserToSupabase]);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    // syncUserToSupabase is called automatically via onAuthStateChanged
    return result;
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUID(null);
    setProfile(null);
  };

  const role    = profile?.role ?? null;
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, profile, role, isAdmin, loading, signInWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
