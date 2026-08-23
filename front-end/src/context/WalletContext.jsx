/**
 * WalletContext.jsx
 * Manages embedded wallet state: address, balance, live price, transactions.
 * No localStorage — all state is in-memory and re-fetched on mount.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { getDemoMode, useDemoModeContext } from "../hooks/useDemoMode";
import {
  DEMO_WALLET_ADDRESS,
  DEMO_PRICE_DATA,
  DEMO_QI_CODE,
} from "../data/demoData";
import { demoStore, setCachedQuaiPrice } from "../data/demoStore";
import {
  getOrCreateWallet,
  getWalletBalance,
  getTransactions,
  getQuaiPriceFull,
  getWalletQiCode,
} from "../services/blippay";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const { isDemoMode, refreshKey } = useDemoModeContext();

  const [walletAddress,  setWalletAddress]  = useState(null);
  const [qiCode,         setQiCode]         = useState(null);
  const [balance,        setBalance]        = useState({ quai: 0, usd: 0 });
  const [priceData,      setPriceData]      = useState(null);
  const [transactions,   setTransactions]   = useState([]);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const toggleBalanceVisibility = useCallback(() => {
    setBalanceVisible((v) => !v);
  }, []);

  const loadWallet = useCallback(async (uid, isRefresh = false) => {
    if (!uid) return;
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    setError(null);

    // Hard 12s timeout on the entire load — prevents "Setting up wallet…" forever
    // on slow connections or unresponsive APIs.
    const timeoutId = setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
        // Don't set error — show whatever loaded; wallet address is derived locally
        console.warn("[WalletContext] loadWallet timed out after 12s");
      }
    }, 12_000);

    try {
      // Address derivation is local (SHA-256 only) — always fast
      const address = await getOrCreateWallet(uid);
      if (!isMounted.current) return;
      setWalletAddress(address);

      // Run all network calls in parallel with individual timeouts
      // so a slow/failed call never blocks the others
      const withTimeout = (promise, ms, fallback) =>
        Promise.race([
          promise,
          new Promise(resolve => setTimeout(() => resolve(fallback), ms)),
        ]);

      const [priceResult, balResult, txResult, qiResult] = await Promise.allSettled([
        withTimeout(getQuaiPriceFull(7),       8000, null),
        withTimeout(getWalletBalance(address), 6000, { quai: 0 }),
        withTimeout(getTransactions(address),  9000, []),
        withTimeout(getWalletQiCode(address),  5000, null),
      ]);

      if (!isMounted.current) return;

      const price     = priceResult.status === "fulfilled" ? priceResult.value : null;
      const bal       = balResult.status   === "fulfilled" ? balResult.value   : { quai: 0 };
      const txs       = txResult.status    === "fulfilled" ? txResult.value    : [];
      const qi        = qiResult.status    === "fulfilled" ? qiResult.value    : null;
      const quaiPrice = price?.current?.price ?? 0;

      setPriceData(price);
      setBalance({ quai: bal.quai ?? 0, usd: parseFloat(((bal.quai ?? 0) * quaiPrice).toFixed(2)) });
      setTransactions(txs ?? []);
      setQiCode(qi);
    } catch (e) {
      if (isMounted.current) setError(e.message);
    } finally {
      clearTimeout(timeoutId);
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    // Reset loading state so skeleton shows on every mode switch
    setLoading(true);

    // ── Demo mode: fetch live QUAI price, then inject store data ──
    if (getDemoMode()) {
      const load = async () => {
        setWalletAddress(DEMO_WALLET_ADDRESS);
        setQiCode(DEMO_QI_CODE);

        // Show stored data immediately so the UI is never blank
        const storedBal = demoStore.get("balance");
        setBalance(storedBal);
        setTransactions(demoStore.get("transactions"));
        setPriceData(DEMO_PRICE_DATA);
        setLoading(false);

        // Fetch real QUAI price in the background; update display if it arrives
        try {
          const priceResult = await getQuaiPriceFull(7);
          const livePrice   = priceResult?.current?.price ?? DEMO_PRICE_DATA.current.price;

          // Cache the live price so demoStake / demoClaim use it for QUAI conversions
          setCachedQuaiPrice(livePrice);

          // Recompute QUAI equivalent at live rate, keep current USD amount
          const currentUsd = demoStore.get("balance").usd;
          const quaiEquiv  = parseFloat((currentUsd / livePrice).toFixed(4));
          const newBalance = { quai: quaiEquiv, usd: currentUsd };
          demoStore.set("balance", newBalance);

          setPriceData(priceResult);
          setBalance(newBalance);
        } catch {
          /* network unavailable — keep the demo fallback already shown */
        }
      };
      load();
      // Refresh balance display when user returns to the tab
      window.addEventListener("focus", load);
      return () => window.removeEventListener("focus", load);
    }

    if (user?.uid) {
      loadWallet(user.uid);
    } else {
      setWalletAddress(null);
      setQiCode(null);
      setBalance({ quai: 0, usd: 0 });
      setPriceData(null);
      setTransactions([]);
      setLoading(false);
    }
  }, [user?.uid, loadWallet, isDemoMode, refreshKey]);

  const refresh = useCallback(async () => {
    if (getDemoMode()) {
      setRefreshing(true);
      // Show stored data immediately
      const storedBal = demoStore.get("balance");
      setBalance(storedBal);
      setTransactions(demoStore.get("transactions"));
      // Re-fetch live price in background
      try {
        const priceResult = await getQuaiPriceFull(7);
        const livePrice   = priceResult?.current?.price ?? DEMO_PRICE_DATA.current.price;
        setCachedQuaiPrice(livePrice);
        const currentUsd = demoStore.get("balance").usd;
        const quaiEquiv  = parseFloat((currentUsd / livePrice).toFixed(4));
        const newBalance = { quai: quaiEquiv, usd: currentUsd };
        demoStore.set("balance", newBalance);
        setBalance(newBalance);
        setPriceData(priceResult);
      } catch { /* keep fallback */ }
      setRefreshing(false);
      return;
    }
    if (user?.uid) loadWallet(user.uid, true);
  }, [user?.uid, loadWallet]);

  return (
    <WalletContext.Provider value={{
      walletAddress,
      qiCode,
      balance,
      priceData,
      transactions,
      balanceVisible,
      toggleBalanceVisibility,
      loading,
      refreshing,
      error,
      refresh,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
