import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { DEMO_MODE } from "./useDemoMode";
import { DEMO_RESULTS } from "../data/demoData";
import { demoStore } from "../data/demoStore";

export function useResults() {
  const { profile, loading: authLoading } = useAuth();
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Demo mode ──
  useEffect(() => {
    if (!DEMO_MODE) return;
    // Combine seed results with any resolved positions from the store
    const positions = demoStore.get("positions");
    const resolvedFromPositions = positions
      .filter(p => p.status === "resolved")
      .map(p => ({
        id:        p.id,
        question:  p.question,
        category:  p.category,
        outcome:   p.won ? p.side : (p.side === "YES" ? "NO" : "YES"),
        yourSide:  p.side,
        yourStake: p.amount,
        totalPool: p.totalPool,
        reward:    p.won ? parseFloat((p.amount * 0.95 * 0.5).toFixed(2)) : 0,
        won:       p.won ?? false,
        consensus: 58,
        settledAt: p.closesLabel,
      }));
    // Merge: seed results first, then any live resolved positions not already in seed
    const seedIds = new Set(DEMO_RESULTS.map(r => r.id));
    const merged  = [
      ...DEMO_RESULTS,
      ...resolvedFromPositions.filter(r => !seedIds.has(r.id)),
    ];
    setResults(merged);
    setLoading(false);
    const sync = () => {
      const pos = demoStore.get("positions");
      const live = pos.filter(p => p.status === "resolved").map(p => ({
        id: p.id, question: p.question, category: p.category,
        outcome: p.won ? p.side : (p.side === "YES" ? "NO" : "YES"),
        yourSide: p.side, yourStake: p.amount, totalPool: p.totalPool,
        reward: p.won ? parseFloat((p.amount * 0.95 * 0.5).toFixed(2)) : 0,
        won: p.won ?? false, consensus: 58, settledAt: p.closesLabel,
      }));
      const ids = new Set(DEMO_RESULTS.map(r => r.id));
      setResults([...DEMO_RESULTS, ...live.filter(r => !ids.has(r.id))]);
    };
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const fetchResults = useCallback(async (userId) => {
    if (DEMO_MODE) return;
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
    if (DEMO_MODE) return;
    if (authLoading) return;
    fetchResults(profile?.id ?? null);
  }, [authLoading, profile?.id, fetchResults]);

  return { results, loading, error, refresh: () => fetchResults(profile?.id ?? null) };
}
