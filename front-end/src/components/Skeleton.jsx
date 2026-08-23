/**
 * Skeleton.jsx
 * ─────────────────────────────────────────────────────────────
 * Reusable skeleton loading components that match Q4's dark design
 * tokens exactly: #080808 base, shimmer on rgba(255,255,255,...).
 *
 * Usage:
 *   <Sk.Box w="100%" h={20} r={6} />
 *   <Sk.Text lines={3} />
 *   <Sk.KpiCard />
 *   <Sk.MarketCard />
 *   <Sk.TxRow />
 *   <Sk.RewardRow />
 *   <Sk.PositionCard />
 *   <Sk.ResultCard />
 *   <Sk.LeaderboardRow />
 *   <Sk.WalletBalance />
 *   <Sk.WalletPriceCard />
 *   <Sk.WalletTxList count={5} />
 * ─────────────────────────────────────────────────────────────
 */

const SHIMMER_STYLE = `
@keyframes sk-shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}
.sk-box {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.10) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 1200px 100%;
  animation: sk-shimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
  flex-shrink: 0;
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("sk-styles")) return;
  const s = document.createElement("style");
  s.id = "sk-styles";
  s.textContent = SHIMMER_STYLE;
  document.head.appendChild(s);
}
injectStyles();

/** Raw shimmer box */
function Box({ w = "100%", h = 14, r = 6, style = {} }) {
  return (
    <div
      className="sk-box"
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

/** A block of text lines */
function Text({ lines = 2, gap = 8 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Box key={i} w={i === lines - 1 ? "65%" : "100%"} h={13} />
      ))}
    </div>
  );
}

/** KPI stat card (Wallet Balance / QUAI Price / Stats) */
function KpiCard() {
  return (
    <div style={{
      background: "#111111",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <Box w={90} h={10} r={4} />
      <Box w="70%" h={30} r={6} />
      <Box w="50%" h={11} r={4} />
    </div>
  );
}

/** Market / question card */
function MarketCard() {
  return (
    <div style={{
      background: "#111111",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {/* category tag */}
      <Box w={72} h={20} r={999} />
      {/* question title */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="100%" h={14} />
        <Box w="80%"  h={14} />
      </div>
      {/* YES/NO bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Box w={36} h={11} r={4} />
          <Box w={36} h={11} r={4} />
        </div>
        <Box w="100%" h={8} r={4} />
      </div>
      {/* footer row */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Box w={70} h={11} r={4} />
        <Box w={50} h={11} r={4} />
      </div>
    </div>
  );
}

/** Markets grid skeleton */
function MarketsGrid({ count = 6 }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 16,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <MarketCard key={i} />
      ))}
    </div>
  );
}

/** Single transaction row */
function TxRow({ last = false }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.06)",
    }}>
      <Box w={38} h={38} r={10} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="60%" h={13} />
        <Box w="40%" h={10} r={4} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <Box w={70} h={13} />
        <Box w={46} h={10} r={4} />
      </div>
    </div>
  );
}

/** Wallet balance card */
function WalletBalance() {
  return (
    <div style={{
      background: "#0a0a0a",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 22,
      padding: "24px 24px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}>
      {/* label */}
      <Box w={100} h={10} r={4} />
      {/* big balance */}
      <Box w="75%" h={40} r={8} />
      {/* usd equiv */}
      <Box w="45%" h={14} r={4} />
      {/* divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
      {/* address pill */}
      <Box w="100%" h={38} r={10} />
      {/* action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Box h={46} r={11} />
        <Box h={46} r={11} />
      </div>
    </div>
  );
}

/** Wallet price card */
function WalletPriceCard() {
  return (
    <div style={{
      background: "#111111",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 22,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Box w={120} h={10} r={4} />
          <Box w={130} h={34} r={6} />
        </div>
        <Box w={60} h={28} r={7} />
      </div>
      {/* chart area */}
      <Box w="100%" h={140} r={8} />
      {/* stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
            <Box w="70%" h={9} r={4} />
            <Box w="80%" h={13} r={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Wallet transactions list */
function WalletTxList({ count = 5 }) {
  return (
    <div style={{
      background: "#111111",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 22,
      padding: "20px 22px",
    }}>
      <Box w={160} h={11} r={4} style={{ marginBottom: 16 }} />
      {/* filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[80, 72, 52].map((w, i) => <Box key={i} w={w} h={28} r={999} />)}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <TxRow key={i} last={i === count - 1} />
      ))}
    </div>
  );
}

/** Position / conviction card */
function PositionCard() {
  return (
    <div style={{
      background: "#111111",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box w="70%" h={14} />
        <Box w={60} h={22} r={999} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="100%" h={13} />
        <Box w="60%"  h={13} />
      </div>
      <Box w="100%" h={6} r={3} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Box w={80} h={11} r={4} />
        <Box w={60} h={11} r={4} />
      </div>
    </div>
  );
}

/** Result card */
function ResultCard() {
  return (
    <div style={{
      background: "#111111",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Box w={70} h={20} r={999} />
        <Box w={70} h={20} r={999} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="100%" h={14} />
        <Box w="75%"  h={14} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Box w="50%" h={44} r={10} />
        <Box w="50%" h={44} r={10} />
      </div>
    </div>
  );
}

/** Reward row */
function RewardRow({ last = false }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.06)",
    }}>
      <Box w={42} h={42} r={12} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="65%" h={14} />
        <Box w="45%" h={11} r={4} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <Box w={80} h={14} />
        <Box w={90} h={30} r={8} />
      </div>
    </div>
  );
}

/** Leaderboard row */
function LeaderboardRow({ last = false }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 16px",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)",
    }}>
      <Box w={28} h={28} r={999} style={{ flexShrink: 0 }} />
      <Box w={32} h={32} r={999} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Box w="55%" h={13} />
        <Box w="35%" h={10} r={4} />
      </div>
      <Box w={60} h={13} />
    </div>
  );
}

/** Dashboard home — full skeleton */
function DashboardHome() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        <KpiCard /><KpiCard /><KpiCard />
      </div>
      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <Box w={120} h={11} r={4} />
          <Box w="100%" h={180} r={8} />
        </div>
        <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <Box w={100} h={11} r={4} />
          <Box w="100%" h={180} r={8} />
        </div>
      </div>
      {/* featured markets */}
      <Box w={160} h={12} r={4} />
      <MarketsGrid count={3} />
    </div>
  );
}

export const Sk = {
  Box,
  Text,
  KpiCard,
  MarketCard,
  MarketsGrid,
  TxRow,
  WalletBalance,
  WalletPriceCard,
  WalletTxList,
  PositionCard,
  ResultCard,
  RewardRow,
  LeaderboardRow,
  DashboardHome,
};
