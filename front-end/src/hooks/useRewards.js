import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useRewards() {
  const { profile, loading: authLoading } = useAuth();
  const [rewards,  setRewards]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [error,    setError]    = useState(null);
  const channelRef = useRef(null);

  const fetchRewards = useCallback(async (userId) => {
    if (!userId) { setRewards([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("rewards")
      .select(`id, amount, claimed, claimed_at, created_at,
        markets ( id, question, category, resolved_outcome, deadline )`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (err) { console.error("[useRewards]", err.message); setError(err.message); setLoading(false); return; }
    setRewards((data ?? []).map(r => ({
      id: r.id, question: r.markets?.question ?? "—", category: r.markets?.category ?? "—",
      outcome: r.markets?.resolved_outcome ?? "—", reward: Number(r.amount),
      claimed: r.claimed, claimedAt: r.claimed_at,
      settledAt: r.markets?.deadline
        ? new Date(r.markets.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—",
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    fetchRewards(profile?.id ?? null);
  }, [authLoading, profile?.id, fetchRewards]);

  // Real-time with safe channel management
  useEffect(() => {
    if (!profile?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const ch = supabase
      .channel(`rewards-${profile.id}-${Date.now()}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "rewards", filter: `user_id=eq.${profile.id}` },
        () => fetchRewards(profile.id)
      );

    ch.subscribe();
    channelRef.current = ch;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile?.id, fetchRewards]);

  const claimReward = useCallback(async (rewardId) => {
    if (!profile?.id) return;
    setClaiming(rewardId);
    const { error: err } = await supabase
      .from("rewards")
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq("id", rewardId).eq("user_id", profile.id);
    if (!err) setRewards(prev => prev.map(r => r.id === rewardId ? { ...r, claimed: true } : r));
    setClaiming(null);
  }, [profile?.id]);

  return { rewards, loading, error, claiming, claimReward, refresh: () => fetchRewards(profile?.id ?? null) };
}
