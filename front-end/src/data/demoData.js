/**
 * demoData.js
 * ─────────────────────────────────────────────────────────────
 * Hardcoded demo data for the Q4 hackathon video.
 * Flip DEMO_MODE = true in useDemoMode.js to activate.
 * Zero database reads/writes — purely in-memory.
 * ─────────────────────────────────────────────────────────────
 */

/* ── Wallet ──────────────────────────────────────────────────── */
export const DEMO_WALLET_ADDRESS = "0x3fA8D62c5E9b4F7a1C20E456B8dA7e3F90c12bD4";

// Starting balance: $2.00 USDT.
// The QUAI equivalent is computed at runtime from the live price
// (see WalletContext demo init). This object is only the seed fallback.
export const DEMO_BALANCE = {
  quai: 0,     // overwritten by WalletContext using live price
  usd:  2.00,
};

const _now  = Date.now();
const _day  = 86_400_000;

const _prices = [
  0.001480, 0.001492, 0.001505, 0.001488, 0.001513,
  0.001527, 0.001519, 0.001534, 0.001548, 0.001541,
  0.001560, 0.001572, 0.001558, 0.001567, 0.001583,
  0.001591, 0.001579, 0.001601, 0.001595, 0.001612,
  0.001608, 0.001621, 0.001614, 0.001630, 0.001625,
  0.001638, 0.001644, 0.001637, 0.001651, 0.001658,
  0.001649, 0.001662, 0.001671, 0.001665, 0.001678,
  0.001685, 0.001677, 0.001692, 0.001700, 0.001695,
  0.001708, 0.001715, 0.001709, 0.001721, 0.001730,
  0.001724, 0.001736, 0.001745, 0.001739, 0.001501,
];

export const DEMO_PRICE_DATA = {
  current: {
    price:            0.001501,
    changePercent24h: 2.84,
    high24h:          0.001745,
    low24h:           0.001480,
    volume24h:        3_840_000,
    marketCap:        48_200_000,
    lastUpdated:      new Date().toISOString(),
  },
  history: _prices.map((price, i) => ({
    price,
    timestamp: _now - (_prices.length - 1 - i) * (_day / 7),
  })),
};

export const DEMO_TRANSACTIONS = [
  {
    id:        "tx-001",
    type:      "received",
    status:    "confirmed",
    label:     "Top-up via BlipPay",
    from:      "0xBlipPay0000000000000000000000000000001",
    to:        DEMO_WALLET_ADDRESS,
    amount:    666.2225,   // ~$1 USDT at live price
    timestamp: new Date(_now - 5 * 3_600_000).toISOString(),
  },
  {
    id:        "tx-002",
    type:      "received",
    status:    "confirmed",
    label:     "Top-up via BlipPay",
    from:      "0xBlipPay0000000000000000000000000000001",
    to:        DEMO_WALLET_ADDRESS,
    amount:    666.2225,   // ~$1 USDT at live price
    timestamp: new Date(_now - 3 * 3_600_000).toISOString(),
  },
  {
    id:        "tx-003",
    type:      "received",
    status:    "confirmed",
    label:     "Top-up via BlipPay",
    from:      "0xBlipPay0000000000000000000000000000001",
    to:        DEMO_WALLET_ADDRESS,
    amount:    666.2225,   // ~$1 USDT at live price
    timestamp: new Date(_now - 90 * 60_000).toISOString(),
  },
  {
    id:        "tx-004",
    type:      "sent",
    status:    "confirmed",
    label:     "Staked — BTC above $62K",
    from:      DEMO_WALLET_ADDRESS,
    to:        "0xQ4Market0000000000000000000000000000001",
    amount:    666.2225,   // ~$1 USDT at live price
    timestamp: new Date(_now - 45 * 60_000).toISOString(),
  },
  // Net: 3 × 666.22 − 666.22 = 1,332.44 QUAI ≈ $2.00 USDT ✓
];

export const DEMO_QI_CODE = "qicode_q4demo_0x3fA8D6_zone00_2026";

/* ── Markets ─────────────────────────────────────────────────── */
const _mkt = (id, q, cat, yesPool, noPool, hoursLeft) => {
  const deadline  = new Date(_now + hoursLeft * 3_600_000).toISOString();
  const h = Math.floor(hoursLeft);
  const m = Math.round((hoursLeft - h) * 60);
  return {
    id,
    question:        q,
    category:        cat,
    status:          "active",
    deadline,
    totalPool:       yesPool + noPool,
    yesPool,
    noPool,
    yesCount:        Math.round(yesPool / 8),
    noCount:         Math.round(noPool  / 8),
    closes:          h > 0 ? `${h}h ${m}m` : `${m}m`,
    data_source:     "CoinGecko",
    contractAddress: null,
  };
};

export const DEMO_MARKETS = [
  _mkt("mkt-001", "Will BTC close above $62,000 today?",              "Crypto", 3840, 2160, 3.5),
  _mkt("mkt-002", "Will ETH price exceed $2,400 by market close?",    "Crypto", 2200, 2800, 5.2),
  _mkt("mkt-003", "Will QUAI rise more than 3% in the next 6 hours?", "Crypto", 1500, 1800, 6.0),
  _mkt("mkt-004", "Will BTC dominance stay above 52% today?",         "Crypto", 2900, 1100, 2.8),
  _mkt("mkt-005", "Will SOL trade above $145 before midnight UTC?",    "Crypto", 1750, 2250, 4.1),
  _mkt("mkt-006", "Will ETH gas fees drop below 10 Gwei tonight?",    "Crypto",  980, 1420, 7.3),
  _mkt("mkt-007", "Will BNB close above $580 today?",                 "Crypto", 2100, 1900, 3.9),
  _mkt("mkt-008", "Will MATIC gain more than 5% in 24h?",             "Crypto", 1200, 1600, 8.0),
  _mkt("mkt-009", "Will total crypto market cap stay above $2.1T?",   "Crypto", 3200,  800, 1.5),
  _mkt("mkt-010", "Will Bitcoin Fear & Greed index stay above 65?",   "Crypto", 1800, 1200, 6.5),
];

/* ── Positions ───────────────────────────────────────────────── */
const _pos = (id, q, cat, side, amount, pool, status, closesLabel, won = null) => ({
  id,
  question:        q,
  category:        cat,
  side,
  amount,
  totalPool:       pool,
  status,
  closesLabel,
  stakeTxHash:     null,
  refundTxHash:    null,
  contractAddress: null,
  won: status === "resolved" ? (won !== null ? won : side === "YES") : null,
});

export const DEMO_POSITIONS = [
  _pos("pos-001", "Will BTC close above $62,000 today?",              "Crypto", "YES", 25.00, 6000, "active",   "3h 30m"),
  _pos("pos-002", "Will ETH price exceed $2,400 by market close?",    "Crypto", "NO",  15.00, 5000, "active",   "5h 12m"),
  _pos("pos-003", "Will QUAI rise more than 3% in the next 6 hours?", "Crypto", "YES", 10.00, 3300, "active",   "6h 00m"),
  _pos("pos-004", "Will BTC dominance stay above 52% today?",         "Crypto", "YES", 20.00, 4000, "closed",   "Closes soon"),
  // ── this one matches res-001 and rwd-001 ──────────────────────────────
  // side=NO, outcome=NO → user picked the winning side → won=true
  _pos("pos-005", "Will SOL trade above $145 before midnight UTC?",   "Crypto", "NO",  12.00, 4000, "resolved", "Aug 19, 18:00", true),
  // side=YES, outcome=NO → user picked the losing side → won=false
  _pos("pos-006", "Will ETH gas fees drop below 10 Gwei tonight?",    "Crypto", "YES",  8.00, 2400, "resolved", "Aug 18, 22:00", false),
];

/* ── Results ─────────────────────────────────────────────────── */
// res-001 matches pos-005 and rwd-001:
//   question  = "Will SOL trade above $145 before midnight UTC?"
//   outcome   = NO  (market resolved NO)
//   yourSide  = NO  (user picked NO → won)
//   yourStake = 12.00 (matches pos-005 amount)
//   reward    = 8.74  (matches rwd-001 reward)
export const DEMO_RESULTS = [
  {
    id:        "res-001",
    question:  "Will SOL trade above $145 before midnight UTC?",
    category:  "Crypto",
    outcome:   "NO",
    yourSide:  "NO",
    yourStake: 12.00,
    totalPool: 4000,
    reward:    8.74,
    won:       true,
    consensus: 56,
    settledAt: "Aug 19, 18:00",
  },
  {
    id:        "res-002",
    question:  "Will ETH gas fees drop below 10 Gwei tonight?",
    category:  "Crypto",
    outcome:   "NO",
    yourSide:  "YES",
    yourStake: 8.00,
    totalPool: 2400,
    reward:    0,
    won:       false,
    consensus: 62,
    settledAt: "Aug 18, 22:00",
  },
  {
    id:        "res-003",
    question:  "Will BTC close above $61,000 yesterday?",
    category:  "Crypto",
    outcome:   "YES",
    yourSide:  "YES",
    yourStake: 20.00,
    totalPool: 7200,
    reward:    15.20,
    won:       true,
    consensus: 71,
    settledAt: "Aug 18, 00:00",
  },
  {
    id:        "res-004",
    question:  "Will MATIC gain more than 5% in 24h?",
    category:  "Crypto",
    outcome:   "NO",
    yourSide:  "NO",
    yourStake: 5.00,
    totalPool: 2800,
    reward:    4.18,
    won:       true,
    consensus: 58,
    settledAt: "Aug 17, 12:00",
  },
];

/* ── Rewards ─────────────────────────────────────────────────── */
// rwd-001 matches pos-005 and res-001:
//   question  = "Will SOL trade above $145 before midnight UTC?"
//   outcome   = NO
//   reward    = 8.74
//   settledAt = "Aug 19, 18:00"
export const DEMO_REWARDS = [
  {
    id:        "rwd-001",
    question:  "Will SOL trade above $145 before midnight UTC?",
    category:  "Crypto",
    outcome:   "NO",
    reward:    8.74,
    claimed:   false,
    settledAt: "Aug 19, 18:00",
    txHash:    null,
  },
  {
    id:        "rwd-002",
    question:  "Will BTC close above $61,000 yesterday?",
    category:  "Crypto",
    outcome:   "YES",
    reward:    15.20,
    claimed:   false,
    settledAt: "Aug 18, 00:00",
    txHash:    null,
  },
  {
    id:        "rwd-003",
    question:  "Will MATIC gain more than 5% in 24h?",
    category:  "Crypto",
    outcome:   "NO",
    reward:    4.18,
    claimed:   true,
    settledAt: "Aug 17, 12:00",
    txHash:    "0xabc123def456aaa000111222333444555666777888999aaabbbccc000111222333",
  },
];

/* ── Notifications ───────────────────────────────────────────── */
export const DEMO_NOTIFICATIONS = [
  {
    id:    "notif-001",
    type:  "reward",
    title: "🎉 You won! Claim your reward",
    body:  "SOL stayed below $145. Your NO position earned 8.74 QUAI.",  // matches pos-005 / res-001 / rwd-001
    time:  "2h ago",
    read:  false,
  },
  {
    id:    "notif-002",
    type:  "reward",
    title: "🏆 Reward available",
    body:  "BTC closed above $61K. Your YES position earned 15.20 QUAI.",
    time:  "1d ago",
    read:  false,
  },
  {
    id:    "notif-003",
    type:  "market",
    title: "⏰ Market closing soon",
    body:  "BTC dominance above 52% closes in 30 minutes.",
    time:  "30m ago",
    read:  true,
  },
  {
    id:    "notif-004",
    type:  "system",
    title: "✅ Position confirmed",
    body:  "Your YES stake of $25 on BTC > $62K was recorded.",
    time:  "3h ago",
    read:  true,
  },
];
