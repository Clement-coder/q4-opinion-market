/**
 * Skeleton.jsx
 * ─────────────────────────────────────────────────────────────
 * Shimmer loading skeletons that exactly match Q4's design tokens:
 *   base surface  #111111
 *   border        rgba(255,255,255,0.08)
 *   shimmer       rgba(255,255,255,0.04) → 0.10 → 0.04
 *
 * Every skeleton mirrors the real component it replaces in size,
 * border-radius, padding, and grid layout so there is zero layout
 * shift when real content loads.
 * ─────────────────────────────────────────────────────────────
 */

const SHIMMER_CSS = `
@keyframes sk-shimmer {
  0%   { background-position: -800px 0; }
  100% { background-position:  800px 0; }
}
.sk-box {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.09) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 1600px 100%;
  animation: sk-shimmer 1.8s ease-in-out infinite;
  border-radius: 6px;
  flex-shrink: 0;
}
.sk-surface {
  background: #111111;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
}
.sk-surface-sm {
  background: #111111;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("sk-styles")) return;
  const s = document.createElement("style");
  s.id = "sk-styles";
  s.textContent = SHIMMER_CSS;
  document.head.appendChild(s);
}
injectStyles();

/* ─── Raw shimmer box ─────────────────────────────────────── */
function Box({ w = "100%", h = 14, r = 6, style = {} }) {
  return (
    <div className="sk-box" style={{ width: w, height: h, borderRadius: r, ...style }} />
  );
}

/* ─── Text block ──────────────────────────────────────────── */
function Text({ lines = 2, gap = 8 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Box key={i} w={i === lines - 1 ? "60%" : "100%"} h={13} />
      ))}
    </div>
  );
}

/* ─── KPI stat card ───────────────────────────────────────── */
function KpiCard() {
  return (
    <div className="sk-surface-sm" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
      <Box w={80} h={10} r={4} />
      <Box w="65%" h={30} r={6} />
      <Box w="45%" h={11} r={4} />
    </div>
  );
}

/* ─── Market / question card ──────────────────────────────── */
function MarketCard() {
  return (
    <div className="sk-surface-sm" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <Box w={72} h={20} r={999} />
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="100%" h={14} />
        <Box w="75%" h={14} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Box w={36} h={11} r={4} />
          <Box w={36} h={11} r={4} />
        </div>
        <Box w="100%" h={8} r={4} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Box w={70} h={11} r={4} />
        <Box w={50} h={11} r={4} />
      </div>
    </div>
  );
}

/* ─── Markets grid ────────────────────────────────────────── */
function MarketsGrid({ count = 6 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => <MarketCard key={i} />)}
    </div>
  );
}

/* ─── Transaction row ─────────────────────────────────────── */
function TxRow({ last = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
      <Box w={38} h={38} r={10} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="55%" h={13} />
        <Box w="35%" h={10} r={4} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <Box w={65} h={13} />
        <Box w={44} h={10} r={4} />
      </div>
    </div>
  );
}

/* ─── Wallet balance card — matches the real card exactly ─── */
function WalletBalance() {
  return (
    <div style={{
      background: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16,
      padding: "22px 20px 18px",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* label + icon row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box w={80} h={9} r={4} />
        <Box w={28} h={28} r={6} />
      </div>
      {/* big balance */}
      <Box w="60%" h={40} r={7} />
      {/* usd row */}
      <Box w="35%" h={11} r={4} />
      {/* divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
      {/* address pill */}
      <Box w="100%" h={38} r={10} />
      {/* action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Box h={42} r={10} />
        <Box h={42} r={10} />
      </div>
      {/* top up */}
      <Box h={42} r={10} />
    </div>
  );
}

/* ─── Wallet price chart card ─────────────────────────────── */
function WalletPriceCard() {
  return (
    <div className="sk-surface" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <Box w={100} h={9} r={4} />
          <Box w={110} h={28} r={5} />
        </div>
        <Box w={52} h={24} r={999} />
      </div>
      {/* chart area */}
      <Box w="100%" h={130} r={8} />
      {/* stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
            <Box w="65%" h={8} r={3} />
            <Box w="75%" h={12} r={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Wallet transactions card ────────────────────────────── */
function WalletTxList({ count = 5 }) {
  return (
    <div className="sk-surface" style={{ padding: "20px 22px" }}>
      {/* header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Box w={150} h={11} r={4} />
        <Box w={70} h={26} r={6} />
      </div>
      {/* filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[80, 68, 52].map((w, i) => <Box key={i} w={w} h={28} r={999} />)}
      </div>
      {/* rows */}
      {Array.from({ length: count }).map((_, i) => (
        <TxRow key={i} last={i === count - 1} />
      ))}
    </div>
  );
}

/* ─── Position / conviction card ─────────────────────────── */
function PositionCard() {
  return (
    <div className="sk-surface-sm" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box w="65%" h={14} />
        <Box w={58} h={22} r={999} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="100%" h={13} />
        <Box w="55%" h={13} />
      </div>
      <Box w="100%" h={6} r={3} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Box w={80} h={11} r={4} />
        <Box w={58} h={11} r={4} />
      </div>
    </div>
  );
}

/* ─── Result card ─────────────────────────────────────────── */
function ResultCard() {
  return (
    <div className="sk-surface-sm" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Box w={68} h={20} r={999} />
        <Box w={68} h={20} r={999} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="100%" h={14} />
        <Box w="70%" h={14} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Box w="50%" h={44} r={10} />
        <Box w="50%" h={44} r={10} />
      </div>
    </div>
  );
}

/* ─── Reward row ──────────────────────────────────────────── */
function RewardRow({ last = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.06)",
    }}>
      <Box w={42} h={42} r={12} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        <Box w="60%" h={14} />
        <Box w="40%" h={11} r={4} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <Box w={76} h={14} />
        <Box w={88} h={30} r={8} />
      </div>
    </div>
  );
}

/* ─── Rewards page skeleton — wraps rows in the GCard surface ─ */
function RewardsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI row — 3 cols matching actual RewardsPage summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[0,1,2].map(i => (
          <div key={i} className="sk-surface-sm" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <Box w={40} h={40} r={10} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
              <Box w="50%" h={9} r={4} />
              <Box w="70%" h={20} r={5} />
            </div>
          </div>
        ))}
      </div>
      {/* reward cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="sk-surface-sm" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Box w={70} h={18} r={4} />
              <Box w={60} h={11} r={4} />
            </div>
            <Box w="100%" h={13} />
            <Box w="65%" h={13} />
            <div style={{ display: "flex", gap: 8 }}>
              <Box w={90} h={22} r={4} />
              <Box w={70} h={22} r={4} />
            </div>
            <div className="sk-surface-sm" style={{ padding: "10px 12px" }}>
              <Box w="40%" h={9} r={4} style={{ marginBottom: 6 }} />
              <Box w="55%" h={20} r={5} />
            </div>
            <Box w="100%" h={42} r={10} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Leaderboard row ─────────────────────────────────────── */
function LeaderboardRow({ last = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)",
    }}>
      <Box w={28} h={28} r={999} style={{ flexShrink: 0 }} />
      <Box w={32} h={32} r={999} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Box w="50%" h={13} />
        <Box w="32%" h={10} r={4} />
      </div>
      <Box w={56} h={13} />
    </div>
  );
}

/* ─── Dashboard home full skeleton ───────────────────────── */
function DashboardHome() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        <KpiCard /><KpiCard /><KpiCard />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[180, 180].map((h, i) => (
          <div key={i} className="sk-surface-sm" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <Box w={110} h={11} r={4} />
            <Box w="100%" h={h} r={8} />
          </div>
        ))}
      </div>
      <Box w={150} h={12} r={4} />
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
  RewardsPage,
  LeaderboardRow,
  DashboardHome,
};
