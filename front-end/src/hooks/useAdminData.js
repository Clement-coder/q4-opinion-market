import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

/* ─── Users ─────────────────────────────────────────────────── */
export function useAdminUsers() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchUsers = useCallback(async (admin) => {
    if (!admin) { setUsers([]); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from("users")
      .select("id, firebase_uid, email, display_name, avatar_url, role, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setUsers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { if (!authLoading) fetchUsers(isAdmin); }, [authLoading, isAdmin, fetchUsers]);

  const setUserRole = useCallback(async (userId, role) => {
    const { error: err } = await supabase.from("users").update({ role }).eq("id", userId);
    if (!err) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    return !err;
  }, []);

  const deleteUser = useCallback(async (userId) => {
    const { error: err } = await supabase.from("users").delete().eq("id", userId);
    if (!err) setUsers(prev => prev.filter(u => u.id !== userId));
    return !err;
  }, []);

  return { users, loading, error, refresh: () => fetchUsers(isAdmin), setUserRole, deleteUser };
}

/* ─── Markets ────────────────────────────────────────────────── */
export function useAdminMarkets() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [markets,  setMarkets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchMarkets = useCallback(async (admin) => {
    if (!admin) { setMarkets([]); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from("markets")
      .select(`id, question, category, status, deadline,
        resolved_outcome, data_source, created_by, created_at,
        market_outcomes ( outcome, pool_amount )`)
      .order("created_at", { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    setMarkets((data ?? []).map(m => {
      const yes = Number(m.market_outcomes?.find(o => o.outcome === "YES")?.pool_amount ?? 0);
      const no  = Number(m.market_outcomes?.find(o => o.outcome === "NO")?.pool_amount  ?? 0);
      return { ...m, yesPool: yes, noPool: no, totalPool: yes + no };
    }));
    setLoading(false);
  }, []);

  useEffect(() => { if (!authLoading) fetchMarkets(isAdmin); }, [authLoading, isAdmin, fetchMarkets]);

  const pauseMarket    = useCallback(async id => { const ok = !(await supabase.from("markets").update({ status: "paused"  }).eq("id", id)).error; if (ok) setMarkets(p => p.map(m => m.id===id?{...m,status:"paused"}:m));   return ok; }, []);
  const activateMarket = useCallback(async id => { const ok = !(await supabase.from("markets").update({ status: "active"  }).eq("id", id)).error; if (ok) setMarkets(p => p.map(m => m.id===id?{...m,status:"active"}:m));   return ok; }, []);
  const closeMarket    = useCallback(async id => { const ok = !(await supabase.from("markets").update({ status: "closed"  }).eq("id", id)).error; if (ok) setMarkets(p => p.map(m => m.id===id?{...m,status:"closed"}:m));   return ok; }, []);

  const resolveMarket = useCallback(async (marketId, outcome) => {
    const now = new Date().toISOString();
    const { error: err } = await supabase.from("markets")
      .update({ status: "resolved", resolved_outcome: outcome, updated_at: now }).eq("id", marketId);
    if (!err) {
      setMarkets(p => p.map(m => m.id===marketId ? {...m, status:"resolved", resolved_outcome:outcome} : m));
      await supabase.from("oracle_results").insert({ market_id: marketId, result_value: outcome, resolved_at: now, data_source: "admin_manual" });
      await supabase.from("market_events").insert({ market_id: marketId, event_type: "resolved", metadata: { outcome, resolved_by: "admin" } });
    }
    return !err;
  }, []);

  const deleteMarket = useCallback(async id => {
    const { error: err } = await supabase.from("markets").delete().eq("id", id);
    if (!err) setMarkets(p => p.filter(m => m.id !== id));
    return !err;
  }, []);

  const createMarket = useCallback(async ({ question, category, deadline, data_source }) => {
    const { data, error: err } = await supabase.from("markets")
      .insert({ question, category, deadline, data_source, status: "active" }).select("*").single();
    if (err) return { ok: false, error: err.message };
    await supabase.from("market_outcomes").insert([
      { market_id: data.id, outcome: "YES", pool_amount: 0 },
      { market_id: data.id, outcome: "NO",  pool_amount: 0 },
    ]);
    await supabase.from("market_events").insert({ market_id: data.id, event_type: "created", metadata: { created_by: "admin" } });
    fetchMarkets(true);
    return { ok: true, market: data };
  }, [fetchMarkets]);

  return { markets, loading, error, refresh: () => fetchMarkets(isAdmin), pauseMarket, activateMarket, closeMarket, resolveMarket, deleteMarket, createMarket };
}

/* ─── Stats ──────────────────────────────────────────────────── */
export function useAdminStats() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (admin) => {
    if (!admin) { setLoading(false); return; }
    setLoading(true);
    const [uR, mR, pR, rR] = await Promise.allSettled([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("markets").select("id, status, category"),
      supabase.from("user_positions").select("id, amount, side"),
      supabase.from("rewards").select("id, amount, claimed"),
    ]);
    const md = mR.value?.data ?? [], pd = pR.value?.data ?? [], rd = rR.value?.data ?? [];
    const catMap = {};
    md.forEach(m => { catMap[m.category] = (catMap[m.category] || 0) + 1; });
    setStats({
      totalUsers:      uR.value?.count ?? 0,
      totalMarkets:    md.length,
      activeMarkets:   md.filter(m => m.status === "active").length,
      closedMarkets:   md.filter(m => m.status === "closed").length,
      resolvedMarkets: md.filter(m => m.status === "resolved").length,
      pausedMarkets:   md.filter(m => m.status === "paused").length,
      totalPositions:  pd.length,
      totalVolume:     pd.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      yesPositions:    pd.filter(p => p.side === "YES").length,
      noPositions:     pd.filter(p => p.side === "NO").length,
      totalRewards:    rd.reduce((s, r) => s + Number(r.amount ?? 0), 0),
      claimedRewards:  rd.filter(r => r.claimed).reduce((s, r) => s + Number(r.amount ?? 0), 0),
      categoryBreakdown: catMap,
    });
    setLoading(false);
  }, []);

  useEffect(() => { if (!authLoading) fetchStats(isAdmin); }, [authLoading, isAdmin, fetchStats]);

  return { stats, loading, refresh: () => fetchStats(isAdmin) };
}

/* ─── Oracle Results ─────────────────────────────────────────── */
export function useAdminOracle() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchResults = useCallback(async (admin) => {
    if (!admin) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("oracle_results")
      .select("*, markets(question, category)").order("resolved_at", { ascending: false }).limit(50);
    setResults(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { if (!authLoading) fetchResults(isAdmin); }, [authLoading, isAdmin, fetchResults]);

  return { results, loading, refresh: () => fetchResults(isAdmin) };
}

/* ─── Market Events ──────────────────────────────────────────── */
export function useAdminEvents() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async (admin) => {
    if (!admin) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("market_events")
      .select("*, markets(question), users(display_name, email)")
      .order("created_at", { ascending: false }).limit(100);
    setEvents(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { if (!authLoading) fetchEvents(isAdmin); }, [authLoading, isAdmin, fetchEvents]);

  return { events, loading, refresh: () => fetchEvents(isAdmin) };
}

/* ─── All Positions (admin view) ─────────────────────────────── */
export function useAdminPositions() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchPositions = useCallback(async (admin) => {
    if (!admin) { setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase.from("user_positions")
      .select("*, users(display_name, email), markets(question, category, status)")
      .order("created_at", { ascending: false }).limit(200);
    if (err) setError(err.message);
    setPositions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { if (!authLoading) fetchPositions(isAdmin); }, [authLoading, isAdmin, fetchPositions]);

  return { positions, loading, error, refresh: () => fetchPositions(isAdmin) };
}
