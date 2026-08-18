/**
 * src/hooks/useAdminData.js
 * Admin-only data: all users, all markets, market events.
 * Only called when the signed-in user has role = "admin".
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useAdminUsers() {
  const { isAdmin } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }
    setLoading(true);

    const { data, error: err } = await supabase
      .from("users")
      .select("id, firebase_uid, email, display_name, avatar_url, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else     setUsers(data ?? []);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const setUserRole = useCallback(async (userId, role) => {
    const { error: err } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId);
    if (!err) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    return !err;
  }, []);

  return { users, loading, error, refresh: fetchUsers, setUserRole };
}

export function useAdminMarkets() {
  const { isAdmin } = useAuth();
  const [markets,  setMarkets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchMarkets = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }
    setLoading(true);

    const { data, error: err } = await supabase
      .from("markets")
      .select(`
        id, question, category, status, deadline,
        resolved_outcome, data_source, created_at,
        market_outcomes ( outcome, pool_amount )
      `)
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else {
      setMarkets((data ?? []).map((m) => {
        const yesPool = Number(m.market_outcomes?.find((o) => o.outcome === "YES")?.pool_amount ?? 0);
        const noPool  = Number(m.market_outcomes?.find((o) => o.outcome === "NO")?.pool_amount  ?? 0);
        return { ...m, yesPool, noPool, totalPool: yesPool + noPool };
      }));
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  const pauseMarket = useCallback(async (marketId) => {
    const { error: err } = await supabase
      .from("markets")
      .update({ status: "paused" })
      .eq("id", marketId);
    if (!err) setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, status: "paused" } : m));
    return !err;
  }, []);

  const activateMarket = useCallback(async (marketId) => {
    const { error: err } = await supabase
      .from("markets")
      .update({ status: "active" })
      .eq("id", marketId);
    if (!err) setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, status: "active" } : m));
    return !err;
  }, []);

  return { markets, loading, error, refresh: fetchMarkets, pauseMarket, activateMarket };
}

export function useAdminStats() {
  const { isAdmin } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }

    const [usersRes, marketsRes, positionsRes] = await Promise.allSettled([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("markets").select("id, status", { count: "exact" }),
      supabase.from("user_positions").select("id, amount", { count: "exact" }),
    ]);

    const totalUsers    = usersRes.value?.count    ?? 0;
    const marketsData   = marketsRes.value?.data   ?? [];
    const positionsData = positionsRes.value?.data ?? [];

    const activeMarkets   = marketsData.filter((m) => m.status === "active").length;
    const resolvedMarkets = marketsData.filter((m) => m.status === "resolved").length;
    const totalVolume     = positionsData.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

    setStats({ totalUsers, totalMarkets: marketsData.length, activeMarkets, resolvedMarkets, totalVolume });
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
