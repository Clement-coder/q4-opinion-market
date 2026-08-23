/**
 * useDemoMode.js
 * ─────────────────────────────────────────────────────────────
 * Provides the demo-mode flag as a callable function getDemoMode()
 * and re-exports the context hook for reactive React usage.
 *
 * In hooks / non-React code:  getDemoMode()  → boolean
 * In React components:        useDemoModeContext() → { isDemoMode, toggleMode, setMode }
 * ─────────────────────────────────────────────────────────────
 */

export { getDemoMode, useDemoModeContext } from "../context/DemoModeContext";
