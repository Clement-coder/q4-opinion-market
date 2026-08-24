/**
 * usePWA.js
 * ─────────────────────────────────────────────────────
 * Handles:
 *  • Service worker registration / updates
 *  • Install prompt (beforeinstallprompt)
 *  • Online / offline detection
 *  • Update-available toast trigger
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";

/* ── registerSW is injected by vite-plugin-pwa at build time ── */
import { registerSW } from "virtual:pwa-register";

export function usePWA() {
  const [needRefresh,  setNeedRefresh]  = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isOffline,    setIsOffline]    = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null); // deferred BeforeInstallPromptEvent
  const [isInstalled,   setIsInstalled]   = useState(false);

  const updateSWRef = useRef(null);

  /* ── Online / offline listeners ── */
  useEffect(() => {
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ── Detect if already installed as PWA ── */
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || window.navigator.standalone === true);
    const handler = (e) => setIsInstalled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ── Capture install prompt ── */
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  /* ── Register service worker ── */
  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh()  { setNeedRefresh(true);  },
      onOfflineReady() { setOfflineReady(true); },
      onRegistered(r)  { console.log("[PWA] SW registered:", r); },
      onRegisterError(e) { console.error("[PWA] SW error:", e); },
    });
  }, []);

  /* ── Trigger update (user clicked "Update" in toast) ── */
  const applyUpdate = useCallback(async () => {
    if (updateSWRef.current) {
      await updateSWRef.current(true);
    }
    setNeedRefresh(false);
  }, []);

  /* ── Trigger native install prompt ── */
  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
    return outcome === "accepted";
  }, [installPrompt]);

  return {
    needRefresh,
    offlineReady,
    isOffline,
    isInstalled,
    canInstall: !!installPrompt && !isInstalled,
    applyUpdate,
    promptInstall,
    dismissOfflineReady: () => setOfflineReady(false),
    dismissUpdate:       () => setNeedRefresh(false),
  };
}
