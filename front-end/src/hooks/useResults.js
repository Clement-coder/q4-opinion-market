import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useResults() {
  const { profile, loading: authLoading } = useAuth();
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchResults = useCallback(async (userId) => {
    if (!userId) { setResults([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("user_positions")
      .select(`id, side, amount, created_at,
        markets ( id, question, category, status, deadline, resolved_outcome,
          market_outcomes ( outcome, pool_amount ) )`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (err) { console.error("[useResults]", err.message); setError(err.message); setLoading(false); return; }
    setResults(
      (data ?? [])
        .filter(r => r.markets?.status === "resolved")
        .map(r => {
          const m = r.markets;
          const yes = Number(m?.market_outcomes?.find(o => o.outcome === "YES")?.pool_amount ?? 0);
          const no  = Number(m?.market_outcomes?.find(o => o.outcome === "NO")?.pool_amount  ?? 0);
          const total = yes + no;
          const won = m?.resolved_outcome === r.side;
          const winPool = r.side === "YES" ? yes : no;
          const reward = won && winPool > 0
            ? parseFloat(((Number(r.amount) / winPool) * (total - winPool) * 0.95).toFixed(4)) : 0;
          return {
            id: r.id, question: m?.question ?? "—", category: m?.category ?? "—",
            outcome: m?.resolved_outcome ?? "—", yourSide: r.side,
            yourStake: Number(r.amount), totalPool: total, won, reward,
            settledAt: m?.deadline ? new Date(m.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—",
            consensus: total > 0 ? Math.round(((m?.resolved_outcome === "YES" ? yes : no) / total) * 100) : 50,
          };
        })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    fetchResults(profile?.id ?? null);
  }, [authLoading, profile?.id, fetchResults]);

  return { results, loading, error, refresh: () => fetchResults(profile?.id ?? null) };
}
