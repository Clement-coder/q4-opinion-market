import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, TrendingUp, ArrowRight, Share2, Check } from "../components/icons";
import { useMarkets } from "../hooks/useMarkets";

const CATEGORIES = ["All", "Crypto", "Sports", "Weather", "Stocks"];

const CAT_COLORS = {
  Crypto:  { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  Sports:  { color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  Weather: { color: "#38bdf8", bg: "rgba(56,189,248,0.12)"  },
  Stocks:  { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
};

function MarketCard({ market }) {
  const navigate  = useNavigate();
  const [copied, setCopied] = useState(false);
  const style = CAT_COLORS[market.category] || { color: "rgba(255,255,255,0.6)", bg: "rgba(255,255,255,0.07)" };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/markets?id=${market.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: market.question, text: market.question, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* cancelled */ }
  };

  return (
    <div className="flex flex-col overflow-hidden transition-all" style={{
      position: "relative",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.08)",
      backgroundColor: "#0d0d0d",
      backgroundImage: "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%), radial-gradient(circle, rgba(255,255,255,0.26) 1px, transparent 1px)",
      backgroundSize: "auto, 32px 32px",
      backgroundPosition: "center top, 0 0",
    }}>
      <div className="flex flex-col flex-1 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}22` }}
          >
            {market.category}
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              <Clock size={11} strokeWidth={2} />
              {market.closes}
            </span>
            <button
              type="button"
              onClick={handleShare}
              title="Share market"
              aria-label="Share this market"
              className="flex items-center justify-center transition-all"
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                color: copied ? "#22c55e" : "rgba(255,255,255,0.4)",
                cursor: "pointer", flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}}
              onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}}
            >
              {copied ? <Check size={12} strokeWidth={2.5} /> : <Share2 size={12} strokeWidth={2} />}
            </button>
          </div>
        </div>

        <h3 className="flex-1 market-question text-sm leading-snug" style={{ color: "rgba(255,255,255,0.9)", marginBottom: 14 }}>
          {market.question}
        </h3>

        {/* YES/NO progress bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, fontWeight: 600 }}>
            <span style={{ color: "#22c55e" }}>YES {market.yes}%</span>
            <span style={{ color: "#ef4444" }}>NO {market.no}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: "rgba(239,68,68,0.25)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${market.yes}%`, borderRadius: 4, background: "#22c55e", transition: "width 0.3s" }} />
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
          Pool <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{market.pool}</span>
          {market.trending && (
            <span className="inline-flex items-center gap-1 ml-3" style={{ color: "rgba(34,197,94,0.7)" }}>
              <TrendingUp size={10} strokeWidth={2} /> Trending
            </span>
          )}
        </p>
      </div>

      {/* YES / NO buttons — unauthenticated users are sent to login */}
      <div className="grid grid-cols-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="outcome-yes py-3 text-sm font-bold transition"
          style={{ color: "#22c55e", borderRadius: 0, borderRight: "1px solid rgba(255,255,255,0.07)" }}
        >
          YES
        </button>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="outcome-no py-3 text-sm font-bold transition"
          style={{ color: "#ef4444", borderRadius: 0 }}
        >
          NO
        </button>
      </div>

      {/* Copied toast */}
      <div
        aria-live="polite"
        style={{
          position: "absolute", bottom: 12, left: "50%",
          transform: copied ? "translate(-50%, 0)" : "translate(-50%, 8px)",
          opacity: copied ? 1 : 0, pointerEvents: "none",
          transition: "opacity 0.2s, transform 0.2s",
          background: "rgba(8,8,8,0.92)", border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600,
          color: "#22c55e", whiteSpace: "nowrap", backdropFilter: "blur(12px)", zIndex: 10,
        }}
      >
        Link copied!
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)",
      background: "#0d0d0d", padding: 20, display: "flex", flexDirection: "column", gap: 12,
    }}>
      {[80, 100, 60, 40].map((w, i) => (
        <div key={i} style={{ height: i === 1 ? 40 : 14, width: `${w}%`, borderRadius: 6, background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  );
}

export default function MarketsPage() {
  const [active, setActive] = useState("All");
  const categoryFilter = active === "All" ? null : active;
  const { markets, loading, error } = useMarkets({ category: categoryFilter, status: "active" });

  return (
    <div className="hero-bg" style={{ minHeight: "100vh" }}>

      <section className="hero-bg">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em" }}>
            Prediction Markets
          </p>
          <h1 className="font-bold text-white" style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.04em" }}>
            Today's Markets
          </h1>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Pick a side, commit your prediction, and know the result by tonight.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <div
        className="sticky top-16 z-10 border-b"
        style={{ background: "rgba(8,8,8,0.92)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="mx-auto max-w-7xl overflow-x-auto px-5 sm:px-8">
          <div className="flex gap-2 py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className="shrink-0 rounded-lg px-4 py-2 text-sm transition"
                style={active === cat
                  ? { background: "#ffffff", color: "#080808", fontWeight: 600 }
                  : { background: "transparent", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          {error && (
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
              Could not load markets: {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : markets.length === 0 ? (
            <div className="py-20 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              No active markets in this category right now. Check back soon.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {markets.map((m) => <MarketCard key={m.id} market={m} />)}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8">
          <h2 className="font-bold text-[#080808]" style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.03em" }}>
            Ready to make your first prediction?
          </h2>
          <p className="mt-3 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            Create a free account to start predicting and earning rewards.
          </p>
          <Link to="/signup" className="btn-primary-dark mt-6 inline-flex">
            Create Account
            <ArrowRight size={14} strokeWidth={2.4} />
          </Link>
        </div>
      </section>
    </div>
  );
}
