/**
 * useBlipPay.js
 * React hook — fetches and caches BlipPay API data for use across the dashboard.
 * All data lives in component state; no localStorage.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getQuaiPriceFull,
  getFeedNews,
  getBlipLeaderboard,
  registerWalletWithBlipPay,
  getBlipPayProfile,
} from "./blippay";

/**
 * Hook for the live Quai price ticker + 7-day history.
 * Auto-refreshes every 60 seconds.
 */
export function useQuaiPrice() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const timerRef = useRef(null);

  const fetch_ = useCallback(async () => {
    try {
      const result = await getQuaiPriceFull(7);
      setData(result);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    timerRef.current = setInterval(fetch_, 60_000);
    return () => clearInterval(timerRef.current);
  }, [fetch_]);

  return { data, loading, error, refresh: fetch_ };
}

/**
 * Hook for the Quai Network news feed.
 * Fetches once on mount.
 */
export function useNewsFeed() {
  const [news,    setNews]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getFeedNews();
      setNews(Array.isArray(items) ? items : []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { news, loading, error, refresh: fetch_ };
}

/**
 * Hook for the BlipPay referral leaderboard.
 * Used on the Leaderboard page for real on-chain standings.
 */
export function useBlipLeaderboard(limit = 50) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBlipLeaderboard(limit);
      setEntries(result?.entries ?? []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { entries, loading, error, refresh: fetch_ };
}

/**
 * Hook for registering/refreshing the user's BlipPay profile.
 *
 * Returns:
 *   profile        — current BlipPay profile object or null (not registered yet)
 *   registering    — true while the sign + PUT is in-flight
 *   error          — error message string or null
 *   register(uid, displayName) — trigger registration / re-registration
 *   refresh(address)           — re-fetch current profile status
 */
export function useBlipPayRegistration(address) {
  const [profile,     setProfile]     = useState(undefined); // undefined = not yet fetched
  const [registering, setRegistering] = useState(false);
  const [error,       setError]       = useState(null);

  const refresh = useCallback(async (addr) => {
    const a = addr ?? address;
    if (!a) return;
    const p = await getBlipPayProfile(a);
    setProfile(p ?? null);
  }, [address]);

  useEffect(() => {
    if (address) refresh(address);
  }, [address, refresh]);

  const register = useCallback(async (uid, displayName) => {
    setRegistering(true);
    setError(null);
    try {
      const result = await registerWalletWithBlipPay(uid, displayName);
      setProfile(result);
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setRegistering(false);
    }
  }, []);

  return { profile, registering, error, register, refresh };
}
