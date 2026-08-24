/**
 * PWAPrompts.jsx
 * ─────────────────────────────────────────────────────
 * Three non-blocking UI elements driven by usePWA():
 *
 *   1. <OfflineBanner>   — thin strip at top when network is lost
 *   2. <UpdateToast>     — bottom-right card when a new SW is waiting
 *   3. <InstallToast>    — bottom-right card prompting Add to Home Screen
 *
 * All styled with Q4 design tokens, zero external deps.
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import { usePWA } from "../hooks/usePWA";

/* ── design tokens (mirror DashboardPage T) ── */
const T = {
  bg:      "#080808",
  surface: "#141414",
  border:  "rgba(255,255,255,0.10)",
  text:    "#f0f0f0",
  muted:   "rgba(255,255,255,0.45)",
  dim:     "rgba(255,255,255,0.22)",
  yes:     "#22c55e",
  yesBg:   "rgba(34,197,94,0.12)",
  yesBd:   "rgba(34,197,94,0.28)",
  violet:  "#7c6ff7",
  amber:   "#fbbf24",
  amberBg: "rgba(251,191,36,0.12)",
  amberBd: "rgba(251,191,36,0.28)",
  red:     "#ef4444",
  redBg:   "rgba(239,68,68,0.12)",
  redBd:   "rgba(239,68,68,0.28)",
};

/* ─── 1. Offline banner ─────────────────────────────── */
export function OfflineBanner() {
  const { isOffline } = usePWA();
  if (!isOffline) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      background: T.redBg,
      borderBottom: `1px solid ${T.redBd}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 8, padding: "8px 16px",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      animation: "pwa-slide-down 0.25s ease both",
    }}>
      <span style={{ fontSize: 14 }}>📵</span>
      <p style={{ fontSize: 12, fontWeight: 700, color: T.red, margin: 0, letterSpacing: "0.02em" }}>
        You're offline — showing cached data
      </p>
      <style>{`@keyframes pwa-slide-down{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

/* ─── 2. SW update toast ────────────────────────────── */
export function UpdateToast() {
  const { needRefresh, applyUpdate, dismissUpdate } = usePWA();
  if (!needRefresh) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 20, zIndex: 9998,
      width: 300, maxWidth: "calc(100vw - 32px)",
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: "16px 18px",
      boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
      display: "flex", flexDirection: "column", gap: 12,
      animation: "pwa-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: T.amberBg, border: `1px solid ${T.amberBd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
          ✨
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: T.text, margin: "0 0 3px", letterSpacing: "-0.01em" }}>Update available</p>
          <p style={{ fontSize: 11, color: T.muted, margin: 0, lineHeight: 1.5 }}>A new version of Q4 is ready. Reload to get the latest.</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button" onClick={applyUpdate}
          style={{ flex: 1, padding: "9px 0", borderRadius: 9, background: T.amber, border: "none", color: "#080808", fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          Reload now
        </button>
        <button
          type="button" onClick={dismissUpdate}
          style={{ padding: "9px 14px", borderRadius: 9, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = T.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
        >
          Later
        </button>
      </div>
      <style>{`@keyframes pwa-slide-up{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

/* ─── 3. Install toast ──────────────────────────────── */
export function InstallToast() {
  const { canInstall, promptInstall, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  /* Auto-dismiss after 12 s on first show */
  useEffect(() => {
    if (!canInstall || dismissed) return;
    const id = setTimeout(() => setDismissed(true), 12000);
    return () => clearTimeout(id);
  }, [canInstall, dismissed]);

  if (!canInstall || dismissed || isInstalled) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await promptInstall();
    if (!accepted) setInstalling(false);
  };

  return (
    <div style={{
      position: "fixed", bottom: 24, left: 20, zIndex: 9998,
      width: 300, maxWidth: "calc(100vw - 32px)",
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: "16px 18px",
      boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
      display: "flex", flexDirection: "column", gap: 12,
      animation: "pwa-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* App icon */}
        <img
          src="/icons/icon-72x72.png"
          alt="Q4"
          style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, border: `1px solid ${T.border}` }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: T.text, margin: "0 0 3px", letterSpacing: "-0.01em" }}>Install Q4</p>
          <p style={{ fontSize: 11, color: T.muted, margin: 0, lineHeight: 1.5 }}>Add to your home screen for a faster, app-like experience — works offline too.</p>
        </div>
        <button
          type="button" onClick={() => setDismissed(true)}
          style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", padding: 2, flexShrink: 0, fontSize: 16, lineHeight: 1 }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button" onClick={handleInstall} disabled={installing}
          style={{ flex: 1, padding: "9px 0", borderRadius: 9, background: "#ffffff", border: "none", color: "#080808", fontSize: 12, fontWeight: 800, cursor: installing ? "not-allowed" : "pointer", opacity: installing ? 0.6 : 1, transition: "opacity 0.15s" }}
        >
          {installing ? "Installing…" : "Add to Home Screen"}
        </button>
        <button
          type="button" onClick={() => setDismissed(true)}
          style={{ padding: "9px 14px", borderRadius: 9, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

/* ─── 4. Offline-ready toast (first cache complete) ── */
export function OfflineReadyToast() {
  const { offlineReady, dismissOfflineReady } = usePWA();
  if (!offlineReady) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 20, zIndex: 9998,
      width: 280, maxWidth: "calc(100vw - 32px)",
      background: T.surface,
      border: `1px solid ${T.yesBd}`,
      borderRadius: 14,
      padding: "14px 16px",
      boxShadow: "0 20px 56px rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", gap: 12,
      animation: "pwa-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <span style={{ fontSize: 18 }}>✅</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.yes, margin: "0 0 2px" }}>Ready to work offline</p>
        <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Q4 is now cached and available offline.</p>
      </div>
      <button
        type="button" onClick={dismissOfflineReady}
        style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/* ─── Convenience: render all prompts together ────── */
export function PWAPrompts() {
  return (
    <>
      <OfflineBanner />
      <UpdateToast />
      <OfflineReadyToast />
      <InstallToast />
    </>
  );
}
