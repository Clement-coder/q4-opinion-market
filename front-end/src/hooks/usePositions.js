import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function usePositions() {
  const { profile, loading: authLoading } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const channelRef = useRef(null);

  const fetchPositions = useCallback(async (userId) => {
    if (!userId) { setPositions([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("user_positions")
      .select(`id, market_id, side, amount, switched, created_at,
        markets ( id, question, category, status, deadline, resolved_outcome,
          market_outcomes ( outcome, pool_amount ) )`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (err) { console.error("[usePositions]", err.message); setError(err.message); }
    else setPositions((data ?? []).map(normalisePosition));
    setLoading(false);
  }, []);

  // Fetch when auth settles
  useEffect(() => {
    if (authLoading) return;
    fetchPositions(profile?.id ?? null);
  }, [authLoading, profile?.id, fetchPositions]);

  // Real-time — create channel only once per userId, tear down on change
  useEffect(() => {
    if (!profile?.id) return;

    // Remove any existing channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const ch = supabase
      .channel(`positions-${profile.id}-${Date.now()}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "user_positions", filter: `user_id=eq.${profile.id}` },
        () => fetchPositions(profile.id)
      );

    ch.subscribe();
    channelRef.current = ch;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile?.id, fetchPositions]);

  return { positions, loading, error, refresh: () => fetchPositions(profile?.id ?? null) };
}

function normalisePosition(row) {
  const m = row.markets;
  const yes = Number(m?.market_outcomes?.find(o => o.outcome === "YES")?.pool_amount ?? 0);
  const no  = Number(m?.market_outcomes?.find(o => o.outcome === "NO")?.pool_amount  ?? 0);
  const total = yes + no;
  const dl = m?.deadline ? new Date(m.deadline) : null;
  const ms = dl ? dl - Date.now() : null;
  return {
    id: row.id, marketId: row.market_id, side: row.side,
    amount: Number(row.amount), switched: row.switched, createdAt: row.created_at,
    status: m?.status ?? "unknown", question: m?.question ?? "—", category: m?.category ?? "—",
    deadline: m?.deadline, resolvedOutcome: m?.resolved_outcome,
    yesPool: yes, noPool: no, totalPool: total,
    yesPct: total > 0 ? Math.round((yes / total) * 100) : 50,
    closesLabel: ms != null && ms > 0 ? fmtTime(ms) : "Closed",
    won: m?.resolved_outcome != null ? m.resolved_outcome === row.side : null,
  };
}

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}
