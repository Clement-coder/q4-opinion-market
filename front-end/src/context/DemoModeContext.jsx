/**
 * DemoModeContext.jsx
 * ─────────────────────────────────────────────────────────────
 * Runtime-switchable demo / live mode toggle.
 *
 *   - Mode is persisted in localStorage under "q4_account_mode"
 *   - "demo"  → all hooks return localStorage-backed demo data
 *   - "live"  → all hooks hit the real blockchain / Supabase APIs
 *
 * Usage:
 *   const { isDemoMode, toggleMode, setMode, refreshKey } = useDemoModeContext();
 *
 * refreshKey increments on every mode switch — add it to useEffect
 * dependency arrays to silently re-fetch data after a switch.
 *
 * For hooks that need a synchronous boolean without calling useContext,
 * import { getDemoMode } — but prefer the hook inside React components.
 * ─────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useCallback } from "react";

const LS_KEY = "q4_account_mode";

// Module-level cache so non-React code can read synchronously.
let _isDemoMode = localStorage.getItem(LS_KEY) !== "live";

export function getDemoMode() {
  return _isDemoMode;
}

const DemoModeContext = createContext(null);

export function DemoModeProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem(LS_KEY) !== "live";
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const setMode = useCallback((demo) => {
    _isDemoMode = demo;
    localStorage.setItem(LS_KEY, demo ? "demo" : "live");
    setIsDemoMode(demo);
    setRefreshKey(k => k + 1);
  }, []);

  const toggleMode = useCallback(() => {
    setIsDemoMode(prev => {
      const next = !prev;
      _isDemoMode = next;
      localStorage.setItem(LS_KEY, next ? "demo" : "live");
      setRefreshKey(k => k + 1);
      return next;
    });
  }, []);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleMode, setMode, refreshKey }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoModeContext() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error("useDemoModeContext must be used inside <DemoModeProvider>");
  return ctx;
}
