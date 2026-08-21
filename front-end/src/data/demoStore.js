/**
 * demoStore.js
 * ─────────────────────────────────────────────────────────────
 * LocalStorage-backed store for all mutable demo state.
 * The seed data comes from demoData.js — on first load it is
 * written to localStorage; subsequent loads read from there.
 *
 * Exports:
 *   demoStore.get(key)         → current value
 *   demoStore.set(key, value)  → persist + return new value
 *   demoStore.reset()          → wipe localStorage, re-seed
 *
 * Keys: "positions" | "transactions" | "rewards" | "notifications" | "balance"
 * ─────────────────────────────────────────────────────────────
 */

import {
  DEMO_BALANCE,
  DEMO_TRANSACTIONS,
  DEMO_POSITIONS,
  DEMO_REWARDS,
  DEMO_NOTIFICATIONS,
} from "./demoData";

const NS = "q4_demo_";          // localStorage namespace
const VERSION = "v2";           // bump to force re-seed
const VER_KEY = NS + "version";

// ── seed defaults ─────────────────────────────────────────────
const SEEDS = {
  balance:       DEMO_BALANCE,
  transactions:  DEMO_TRANSACTIONS,
  positions:     DEMO_POSITIONS,
  rewards:       DEMO_REWARDS,
  notifications: DEMO_NOTIFICATIONS,
};

function seed() {
  for (const [key, value] of Object.entries(SEEDS)) {
    localStorage.setItem(NS + key, JSON.stringify(value));
  }
  localStorage.setItem(VER_KEY, VERSION);
}

// ── initialise once per session ───────────────────────────────
if (localStorage.getItem(VER_KEY) !== VERSION) {
  seed();
}

// ── public API ────────────────────────────────────────────────
export const demoStore = {
  get(key) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw ? JSON.parse(raw) : SEEDS[key];
    } catch {
      return SEEDS[key];
    }
  },

  set(key, value) {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return value;
  },

  reset() {
    seed();
  },
};

// ── live price cache ──────────────────────────────────────────
// Written by WalletContext when it fetches the real QUAI price.
// Falls back to the last known demo price if unavailable.
const FALLBACK_QUAI_PRICE = 0.001501;
let _cachedQuaiPrice = FALLBACK_QUAI_PRICE;

export function setCachedQuaiPrice(price) {
  if (price && price > 0) _cachedQuaiPrice = price;
}

export function getCachedQuaiPrice() {
  return _cachedQuaiPrice;
}
export function demoStake({ market, side, amtNum }) {
  const QUAI_PRICE = getCachedQuaiPrice();
  const quaiAmt    = parseFloat((amtNum / QUAI_PRICE).toFixed(4));

  // 1. Add position
  const positions = demoStore.get("positions");
  const newPos = {
    id:              "pos-" + Date.now(),
    question:        market.question,
    category:        market.category,
    side,
    amount:          amtNum,
    totalPool:       market.totalPool + amtNum,
    status:          "active",
    closesLabel:     market.closes,
    stakeTxHash:     null,
    refundTxHash:    null,
    contractAddress: null,
    won:             null,
  };
  demoStore.set("positions", [newPos, ...positions]);

  // 2. Add outgoing transaction
  const txs = demoStore.get("transactions");
  const newTx = {
    id:        "tx-" + Date.now(),
    type:      "sent",
    status:    "confirmed",
    label:     "Staked on market",
    from:      "0x3fA8D62c5E9b4F7a1C20E456B8dA7e3F90c12bD4",
    to:        "0xQ4MarketContract" + market.id,
    amount:    quaiAmt,
    timestamp: new Date().toISOString(),
  };
  demoStore.set("transactions", [newTx, ...txs]);

  // 3. Deduct balance
  const bal = demoStore.get("balance");
  demoStore.set("balance", {
    quai: parseFloat((bal.quai - quaiAmt).toFixed(4)),
    usd:  parseFloat((bal.usd  - amtNum).toFixed(2)),
  });

  // 4. Add notification
  const notifs = demoStore.get("notifications");
  demoStore.set("notifications", [
    {
      id:    "notif-" + Date.now(),
      type:  "system",
      title: "✅ Position confirmed",
      body:  `Your ${side} stake of $${amtNum.toFixed(2)} on "${market.question.slice(0, 50)}…" was recorded.`,
      time:  "just now",
      read:  false,
    },
    ...notifs,
  ]);
}

/** Called when user claims a reward in demo mode */
export function demoClaim(rewardId) {
  const QUAI_PRICE = getCachedQuaiPrice();
  const rewards  = demoStore.get("rewards");
  const reward   = rewards.find(r => r.id === rewardId);
  if (!reward) return;

  const fakeTxHash = "0xdemo" + Date.now().toString(16).padStart(16, "0");

  // 1. Mark reward claimed
  demoStore.set(
    "rewards",
    rewards.map(r =>
      r.id === rewardId ? { ...r, claimed: true, txHash: fakeTxHash } : r
    )
  );

  // 2. Add incoming transaction
  const txs    = demoStore.get("transactions");
  const quaiAmt = parseFloat((reward.reward / QUAI_PRICE).toFixed(4));
  demoStore.set("transactions", [
    {
      id:        "tx-" + Date.now(),
      type:      "received",
      status:    "confirmed",
      label:     "Reward claimed",
      from:      "0xQ4RewardsContract000000000000000000000001",
      to:        "0x3fA8D62c5E9b4F7a1C20E456B8dA7e3F90c12bD4",
      amount:    quaiAmt,
      timestamp: new Date().toISOString(),
    },
    ...txs,
  ]);

  // 3. Credit balance
  const bal = demoStore.get("balance");
  demoStore.set("balance", {
    quai: parseFloat((bal.quai + quaiAmt).toFixed(4)),
    usd:  parseFloat((bal.usd  + reward.reward).toFixed(2)),
  });

  // 4. Add notification
  const notifs = demoStore.get("notifications");
  demoStore.set("notifications", [
    {
      id:    "notif-" + Date.now(),
      type:  "reward",
      title: "💰 Reward claimed!",
      body:  `+${reward.reward.toFixed(2)} QUAI from "${reward.question.slice(0, 50)}…"`,
      time:  "just now",
      read:  false,
    },
    ...notifs,
  ]);
}
