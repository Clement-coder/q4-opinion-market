/**
 * src/hooks/useRewards.js
 * Fetches claimable and claimed rewards for the signed-in user.
 * Table: rewards
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useRewards() {
  const { profile } = useAuth();
  const [rewards,  setRewards]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [claiming, setClaiming] = useState(null); // reward id being claimed
  const [error,    setError]    = useState(null);

  const fetchRewards = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);

    const { data, error: err } = await supabase
      .from("rewards")
      .select(`
        id, amount, claimed, claimed_at, created_at,
        markets ( id, question, category, resolved_outcome, deadline )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setRewards(
        (data ?? []).map((r) => ({
          id:        r.id,
          question:  r.markets?.question  ?? "—",
          category:  r.markets?.category  ?? "—",
          outcome:   r.markets?.resolved_outcome ?? "—",
          reward:    Number(r.amount),
          claimed:   r.claimed,
          claimedAt: r.claimed_at,
          settledAt: r.markets?.deadline
            ? new Date(r.markets.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
            : "—",
        }))
      );
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

  const claimReward = useCallback(async (rewardId) => {
    setClaiming(rewardId);
    const { error: err } = await supabase
      .from("rewards")
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq("id", rewardId)
      .eq("user_id", profile.id);

    if (!err) {
      setRewards((prev) =>
        prev.map((r) =>
          r.id === rewardId ? { ...r, claimed: true, claimedAt: new Date().toISOString() } : r
        )
      );
    }
    setClaiming(null);
  }, [profile?.id]);

  // Real-time
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`rewards-${profile.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "rewards", filter: `user_id=eq.${profile.id}` },
        fetchRewards
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, fetchRewards]);

  return { rewards, loading, error, claiming, claimReward, refresh: fetchRewards };
}
