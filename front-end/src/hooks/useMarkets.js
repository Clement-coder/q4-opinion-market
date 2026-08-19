/**
 * src/hooks/useMarkets.js
 * Fetches prediction markets from Supabase.
 * Returns live markets ordered by created_at desc.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useMarkets({ category = null, status = "active", limit = 100 } = {}) {
  const [markets,  setMarkets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("markets")
        .select(`
          id,
          question,
          category,
          status,
          deadline,
          resolved_outcome,
          data_source,
          created_at,
          market_outcomes ( outcome, pool_amount )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status && status !== "all") query = query.eq("status", status);
      if (category && category !== "all") query = query.ilike("category", category);

      const { data, error: err } = await query;
      if (err) throw err;

      // Normalise into the shape the UI expects
      const normalised = (data ?? []).map((m) => {
        const yesRow = m.market_outcomes?.find((o) => o.outcome === "YES");
        const noRow  = m.market_outcomes?.find((o) => o.outcome === "NO");
        const yesPool  = Number(yesRow?.pool_amount ?? 0);
        const noPool   = Number(noRow?.pool_amount  ?? 0);
        const totalPool = yesPool + noPool;
        const yesPct = totalPool > 0 ? Math.round((yesPool / totalPool) * 100) : 50;
        const noPct  = 100 - yesPct;

        // Time remaining
        const deadline    = m.deadline ? new Date(m.deadline) : null;
        const msLeft      = deadline ? deadline - Date.now() : null;
        const closesLabel = msLeft != null && msLeft > 0 ? formatTimeLeft(msLeft) : "Closed";

        return {
          id:             m.id,
          question:       m.question,
          category:       m.category,
          status:         m.status,
          deadline:       m.deadline,
          resolvedOutcome: m.resolved_outcome,
          dataSource:     m.data_source,
          yesPool,
          noPool,
          totalPool,
          yes:            yesPct,
          no:             noPct,
          closes:         closesLabel,
          pool:           formatPool(totalPool),
          trending:       totalPool > 5000,
        };
      });

      setMarkets(normalised);
    } catch (err) {
      console.error("[useMarkets]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category, status, limit]);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  // Real-time subscription — update when any market changes
  useEffect(() => {
    const channel = supabase
      .channel("markets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "markets" }, fetchMarkets)
      .on("postgres_changes", { event: "*", schema: "public", table: "market_outcomes" }, fetchMarkets)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMarkets]);

  return { markets, loading, error, refresh: fetchMarkets };
}

/** Single market by ID */
export function useMarket(id) {
  const [market,  setMarket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("markets")
        .select(`*, market_outcomes ( outcome, pool_amount )`)
        .eq("id", id)
        .single();

      if (err) { setError(err.message); setLoading(false); return; }

      const yesPool   = Number(data.market_outcomes?.find((o) => o.outcome === "YES")?.pool_amount ?? 0);
      const noPool    = Number(data.market_outcomes?.find((o) => o.outcome === "NO")?.pool_amount  ?? 0);
      const totalPool = yesPool + noPool;
      setMarket({ ...data, yesPool, noPool, totalPool });
      setLoading(false);
    };

    fetch();
  }, [id]);

  return { market, loading, error };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTimeLeft(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60)   return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function formatPool(total) {
  if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`;
  if (total >= 1_000)     return `$${(total / 1_000).toFixed(1)}K`;
  return `$${total.toFixed(0)}`;
}
