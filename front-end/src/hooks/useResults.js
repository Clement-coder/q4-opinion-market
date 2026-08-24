import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useDemoModeContext } from "./useDemoMode";
import { DEMO_RESULTS } from "../data/demoData";
import { demoStore } from "../data/demoStore";

export function useResults() {
  const { profile, loading: authLoading } = useAuth();
  const { isDemoMode, refreshKey } = useDemoModeContext();
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Demo mode ──
  useEffect(() => {
    if (!isDemoMode) return;
    setLoading(true);
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
        // Demo payout estimate: assume 50/50 pool split, full formula
        // payout = stake + (stake / winPool) * (losePool * 0.95)
        // with winPool = losePool = totalPool / 2
        reward:    p.won && p.totalPool > 0
          ? parseFloat((p.amount + (p.amount / (p.totalPool * 0.5)) * (p.totalPool * 0.5 * 0.95)).toFixed(2))
          : 0,
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
        reward: p.won && p.totalPool > 0
          ? parseFloat((p.amount + (p.amount / (p.totalPool * 0.5)) * (p.totalPool * 0.5 * 0.95)).toFixed(2))
          : 0,
        won: p.won ?? false, consensus: 58, settledAt: p.closesLabel,
      }));
      const ids = new Set(DEMO_RESULTS.map(r => r.id));
      setResults([...DEMO_RESULTS, ...live.filter(r => !ids.has(r.id))]);
    };
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, [isDemoMode, refreshKey]);

  const fetchResults = useCallback(async (userId) => {
    if (!userId) { setResults([]); setLoading(false); return; }
    setLoading(true);
    setError(null);

    // Fetch resolved positions + the matching reward row (if any).
    // The reward row holds the authoritative payout amount locked at resolution
    // time — more accurate than recalculating from current pool data.
    const { data, error: err } = await supabase
      .from("user_positions")
      .select(`id, side, amount, created_at,
        markets ( id, question, category, status, deadline, resolved_outcome,
          market_outcomes ( outcome, pool_amount ) ),
        rewards ( amount, claimed, market_id )`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (err) { console.error("[useResults]", err.message); setError(err.message); setLoading(false); return; }

    // Build a map of market_id → authoritative reward amount (from rewards table)
    // Multiple positions on the same market share one reward row — only show it once.
    const rewardByMarket = new Map();
    for (const r of data ?? []) {
      // rewards is an array (one-to-many FK), take the first matching row
      const rw = Array.isArray(r.rewards) ? r.rewards[0] : r.rewards;
      if (rw && !rewardByMarket.has(r.market_id)) {
        rewardByMarket.set(r.market_id, Number(rw.amount));
      }
    }

    setResults(
      (data ?? [])
        .filter(r => r.markets?.status === "resolved")
        .map(r => {
          const m = r.markets;
          const yes = Number(m?.market_outcomes?.find(o => o.outcome === "YES")?.pool_amount ?? 0);
          const no  = Number(m?.market_outcomes?.find(o => o.outcome === "NO")?.pool_amount  ?? 0);
          const total = yes + no;
          const won      = m?.resolved_outcome === r.side;
          const stake    = Number(r.amount);
          const winPool  = r.side === "YES" ? yes : no;
          const losePool = total - winPool;

          // Use the authoritative reward amount from the rewards table if available.
          // Fall back to recalculating from pool data for markets with no reward row
          // (e.g. markets with zero winners or pre-resolver markets).
          const authoritativeReward = rewardByMarket.get(r.market_id) ?? null;
          const calculatedReward = won && winPool > 0
            ? parseFloat((stake + (stake / winPool) * (losePool * 0.95)).toFixed(4))
            : 0;
          const reward = authoritativeReward !== null ? authoritativeReward : calculatedReward;

          return {
            id: r.id, question: m?.question ?? "—", category: m?.category ?? "—",
            outcome: m?.resolved_outcome ?? "—", yourSide: r.side,
            yourStake: stake, totalPool: total, won, reward,
            settledAt: m?.deadline ? new Date(m.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—",
            consensus: total > 0 ? Math.round(((m?.resolved_outcome === "YES" ? yes : no) / total) * 100) : 50,
          };
        })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDemoMode) return;
    if (authLoading) return;
    fetchResults(profile?.id ?? null);
  }, [isDemoMode, authLoading, profile?.id, fetchResults]);

  return { results, loading, error, refresh: () => fetchResults(profile?.id ?? null) };
}
