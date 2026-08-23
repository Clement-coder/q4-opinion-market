import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { onChainClaimReward } from "../lib/contractService";
import { useDemoModeContext } from "./useDemoMode";
import { demoStore, demoClaim } from "../data/demoStore";

export function useRewards() {
  const { profile, user, loading: authLoading } = useAuth();
  const { isDemoMode, refreshKey } = useDemoModeContext();
  const [rewards,  setRewards]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [error,    setError]    = useState(null);
  const channelRef = useRef(null);

  // ── Demo mode ──
  useEffect(() => {
    if (!isDemoMode) return;
    setLoading(true);
    setRewards(demoStore.get("rewards"));
    setLoading(false);
    const sync = () => setRewards(demoStore.get("rewards"));
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, [isDemoMode, refreshKey]);

  const fetchRewards = useCallback(async (userId) => {
    if (!userId) { setRewards([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("rewards")
      .select(`id, amount, claimed, claimed_on_chain, tx_hash, claimed_at, created_at,
        markets ( id, question, category, resolved_outcome, deadline, contract_address )`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (err) {
      console.error("[useRewards]", err.message);
      setError(err.message);
      setLoading(false);
      return;
    }
    setRewards((data ?? []).map(r => ({
      id:              r.id,
      question:        r.markets?.question        ?? "—",
      category:        r.markets?.category        ?? "—",
      outcome:         r.markets?.resolved_outcome ?? "—",
      reward:          Number(r.amount),
      claimed:         r.claimed,
      claimedOnChain:  r.claimed_on_chain ?? false,
      txHash:          r.tx_hash ?? null,
      claimedAt:       r.claimed_at,
      contractAddress: r.markets?.contract_address ?? null,
      marketId:        r.markets?.id ?? null,
      settledAt:       r.markets?.deadline
        ? new Date(r.markets.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        : "—",
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDemoMode) return;
    if (authLoading) return;
    fetchRewards(profile?.id ?? null);
  }, [isDemoMode, authLoading, profile?.id, fetchRewards]);

  // Real-time with safe channel management (live mode only)
  useEffect(() => {
    if (isDemoMode) return;
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
  }, [isDemoMode, profile?.id, fetchRewards]);

  /**
   * Claim a reward.
   *
   * Flow:
   *  1. If the market has a contract address, call claimReward() on-chain first.
   *     This sends the QUAI payout to the user's wallet.
   *  2. Mark claimed in Supabase (with the tx hash if available).
   *
   * If the market has no contract address (legacy / off-chain market),
   * we fall back to Supabase-only claiming.
   */
  const claimReward = useCallback(async (rewardId) => {
    // ── Demo mode: persist claim to store ──
    if (isDemoMode) {
      setClaiming(rewardId);
      await new Promise(r => setTimeout(r, 900));
      demoClaim(rewardId);
      setRewards(demoStore.get("rewards"));
      setClaiming(null);
      return;
    }

    if (!profile?.id || !user?.uid) return;

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    setClaiming(rewardId);
    let txHash = null;

    try {
      // ── Step 1: On-chain claim (if contract address exists) ──────────────
      if (reward.contractAddress) {
        try {
          const result = await onChainClaimReward({
            uid:                    user.uid,
            marketContractAddress:  reward.contractAddress,
          });
          txHash = result.hash;
          console.log(`[useRewards] claimReward tx: ${txHash}`);
        } catch (chainErr) {
          // Surface the on-chain error to the caller — don't silently skip.
          // Common causes: already claimed, not resolved, wrong side.
          throw new Error(
            `On-chain claim failed: ${chainErr.message ?? chainErr}`
          );
        }
      }

      // ── Step 2: Mark claimed in Supabase ─────────────────────────────────
      const update = {
        claimed:          true,
        claimed_at:       new Date().toISOString(),
        claimed_on_chain: Boolean(reward.contractAddress),
      };
      if (txHash) update.tx_hash = txHash;

      const { error: dbErr } = await supabase
        .from("rewards")
        .update(update)
        .eq("id", rewardId)
        .eq("user_id", profile.id);

      if (dbErr) throw dbErr;

      // Optimistic update
      setRewards(prev =>
        prev.map(r =>
          r.id === rewardId
            ? { ...r, claimed: true, claimedOnChain: Boolean(reward.contractAddress), txHash }
            : r
        )
      );
    } catch (err) {
      console.error("[useRewards] claimReward error:", err);
      throw err; // let the UI handle the error message
    } finally {
      setClaiming(null);
    }
  }, [isDemoMode, profile?.id, user?.uid, rewards]);

  return {
    rewards,
    loading,
    error,
    claiming,
    claimReward,
    refresh: () => fetchRewards(profile?.id ?? null),
  };
}
