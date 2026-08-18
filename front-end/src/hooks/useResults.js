/**
 * src/hooks/useResults.js
 * Fetches settled market results for the signed-in user from Supabase.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useResults() {
  const { profile } = useAuth();
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchResults = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);

    const { data, error: err } = await supabase
      .from("user_positions")
      .select(`
        id, side, amount, switched, created_at,
        markets (
          id, question, category, status, deadline, resolved_outcome,
          market_outcomes ( outcome, pool_amount )
        )
      `)
      .eq("user_id", profile.id)
      .eq("markets.status", "resolved")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setResults(
        (data ?? [])
          .filter((r) => r.markets?.status === "resolved")
          .map((r) => {
            const m         = r.markets;
            const yesPool   = Number(m?.market_outcomes?.find((o) => o.outcome === "YES")?.pool_amount ?? 0);
            const noPool    = Number(m?.market_outcomes?.find((o) => o.outcome === "NO")?.pool_amount  ?? 0);
            const totalPool = yesPool + noPool;
            const won       = m?.resolved_outcome === r.side;
            const winPool   = r.side === "YES" ? yesPool : noPool;
            const losePool  = totalPool - winPool;
            const reward    = won && winPool > 0
              ? parseFloat(((Number(r.amount) / winPool) * losePool * 0.98).toFixed(4))
              : 0;

            return {
              id:         r.id,
              question:   m?.question ?? "—",
              category:   m?.category ?? "—",
              outcome:    m?.resolved_outcome ?? "—",
              yourSide:   r.side,
              yourStake:  Number(r.amount),
              totalPool,
              won,
              reward,
              settledAt:  m?.deadline
                ? new Date(m.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                : "—",
              consensus:  totalPool > 0
                ? Math.round(
                    ((m?.resolved_outcome === "YES" ? yesPool : noPool) / totalPool) * 100
                  )
                : 50,
            };
          })
      );
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  return { results, loading, error, refresh: fetchResults };
}
