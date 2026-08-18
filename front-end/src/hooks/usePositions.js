/**
 * src/hooks/usePositions.js
 * Fetches the signed-in user's market positions from Supabase.
 * Table: user_positions
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function usePositions() {
  const { profile } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchPositions = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("user_positions")
      .select(`
        id,
        market_id,
        side,
        amount,
        switched,
        created_at,
        markets (
          id,
          question,
          category,
          status,
          deadline,
          resolved_outcome,
          market_outcomes ( outcome, pool_amount )
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setPositions((data ?? []).map(normalisePosition));
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  // Real-time: refresh when user's positions change
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`positions-${profile.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "user_positions", filter: `user_id=eq.${profile.id}` },
        fetchPositions
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, fetchPositions]);

  return { positions, loading, error, refresh: fetchPositions };
}

function normalisePosition(row) {
  const m         = row.markets;
  const yesPool   = Number(m?.market_outcomes?.find((o) => o.outcome === "YES")?.pool_amount ?? 0);
  const noPool    = Number(m?.market_outcomes?.find((o) => o.outcome === "NO")?.pool_amount  ?? 0);
  const totalPool = yesPool + noPool;
  const deadline  = m?.deadline ? new Date(m.deadline) : null;
  const msLeft    = deadline ? deadline - Date.now() : null;

  return {
    id:         row.id,
    marketId:   row.market_id,
    side:       row.side,       // "YES" | "NO"
    amount:     Number(row.amount),
    switched:   row.switched,
    createdAt:  row.created_at,
    status:     m?.status ?? "unknown",
    question:   m?.question ?? "—",
    category:   m?.category ?? "—",
    deadline:   m?.deadline,
    resolvedOutcome: m?.resolved_outcome,
    yesPool,
    noPool,
    totalPool,
    yesPct: totalPool > 0 ? Math.round((yesPool / totalPool) * 100) : 50,
    closesLabel: msLeft != null && msLeft > 0
      ? formatTimeLeft(msLeft)
      : "Closed",
    won: m?.resolved_outcome != null
      ? m.resolved_outcome === row.side
      : null,
  };
}

function formatTimeLeft(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60)  return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
