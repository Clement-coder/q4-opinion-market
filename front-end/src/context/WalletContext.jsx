/**
 * WalletContext.jsx
 * Manages embedded wallet state: address, balance, live price, transactions.
 * No localStorage — all state is in-memory and re-fetched on mount.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
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

    try {
      const address = await getOrCreateWallet(uid);
      if (!isMounted.current) return;
      setWalletAddress(address);

      const [priceResult, balResult, txResult, qiResult] = await Promise.allSettled([
        getQuaiPriceFull(7),
        getWalletBalance(address),
        getTransactions(address),
        getWalletQiCode(address),
      ]);

      if (!isMounted.current) return;

      const price     = priceResult.status === "fulfilled" ? priceResult.value : null;
      const bal       = balResult.status   === "fulfilled" ? balResult.value   : { quai: 0 };
      const txs       = txResult.status    === "fulfilled" ? txResult.value    : [];
      const qi        = qiResult.status    === "fulfilled" ? qiResult.value    : null;
      const quaiPrice = price?.current?.price ?? 0;

      setPriceData(price);
      setBalance({ quai: bal.quai, usd: parseFloat((bal.quai * quaiPrice).toFixed(2)) });
      setTransactions(txs);
      setQiCode(qi);
    } catch (e) {
      if (isMounted.current) setError(e.message);
    } finally {
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
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
  }, [user?.uid, loadWallet]);

  const refresh = useCallback(() => {
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
