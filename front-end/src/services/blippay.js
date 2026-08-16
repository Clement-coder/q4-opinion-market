/**
 * blippay.js — BlipPay API service layer
 * Base: https://blippay.me/api
 *
 * All endpoints are pure API calls — no localStorage, no side-effects.
 * Wallet address derivation is deterministic from Firebase UID; callers
 * are responsible for their own caching strategy.
 */

const BASE = "https://blippay.me";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`BlipPay ${path} → ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `BlipPay POST ${path} → ${res.status}`);
  }
  return res.json();
}

// ─── price ───────────────────────────────────────────────────────────────────

/**
 * Current Quai price ticker.
 * @returns {{ price, change24h, changePercent24h, high24h, low24h, volume24h, marketCap, lastUpdated }}
 */
export async function getQuaiPrice() {
  return get("/api/price");
}

/**
 * Price + 7-day history in one call.
 * @param {number} days
 * @returns {{ current: PriceTicker, history: Array<{timestamp: number, price: number}> }}
 */
export async function getQuaiPriceFull(days = 7) {
  return get(`/api/price/full?days=${days}`);
}

/**
 * Price history only.
 * @param {number} days
 * @returns {Array<{timestamp: number, price: number}>}
 */
export async function getQuaiPriceHistory(days = 7) {
  return get(`/api/price/history?days=${days}`);
}

// ─── feed / news ─────────────────────────────────────────────────────────────

/**
 * All feed items (news + events + social).
 * @returns {Array<FeedItem>}
 */
export async function getFeed() {
  return get("/api/feed");
}

/**
 * News feed only.
 * @returns {Array<FeedItem>}
 */
export async function getFeedNews() {
  return get("/api/feed/news");
}

/**
 * Events feed.
 * @returns {Array<FeedItem>}
 */
export async function getFeedEvents() {
  return get("/api/feed/events");
}

/**
 * Social feed.
 * @returns {Array<FeedItem>}
 */
export async function getFeedSocial() {
  return get("/api/feed/social");
}

// ─── ramp ────────────────────────────────────────────────────────────────────

/**
 * Check if the managed-quai on-ramp is available.
 * @returns {{ available: boolean, invoiceAvailable: boolean, baseUrl: string }}
 */
export async function getRampStatus() {
  return get("/api/ramp/managed-quai/status");
}

/**
 * Create a Stripe checkout session for buying Quai with fiat.
 * @param {string} address      Quai wallet address (0x…)
 * @param {number} amountCents  Amount in USD cents (e.g. 2500 = $25.00)
 * @param {string} [email]      Optional customer email pre-fill
 * @returns {{ url: string, session_id: string }}
 */
export async function createCheckout(address, amountCents, email) {
  const body = { address, amount_cents: amountCents };
  if (email) body.customer_email = email;
  return post("/api/ramp/managed-quai/checkout", body);
}

/**
 * Poll the payment/funding status for a checkout session.
 * @param {string} sessionId  Stripe checkout session ID (cs_…)
 * @param {string} address    Quai wallet address
 */
export async function getFundingStatus(sessionId, address) {
  return get(
    `/api/ramp/managed-quai/funding-status?session_id=${encodeURIComponent(sessionId)}&q=${encodeURIComponent(address)}`
  );
}

/**
 * Build the hosted invoice page URL (no network call — pure URL construction).
 */
export function buildInvoicePageUrl({ invoiceRef, quaiAddress, amountCents, title = "Q4 Wallet Top-Up", paymentToken = "USDT" }) {
  const params = new URLSearchParams({
    i: invoiceRef,
    q: quaiAddress,
    c: String(amountCents),
    t: title,
    p: paymentToken,
  });
  return `${BASE}/api/ramp/managed-quai/invoice-page?${params}`;
}

// ─── referrals / leaderboard ─────────────────────────────────────────────────

/**
 * Referral leaderboard from BlipPay.
 * @param {number}  limit
 * @param {string}  [countryCode]  Optional ISO-2 country filter
 * @returns {{ entries: Array<LeaderboardEntry> }}
 */
export async function getBlipLeaderboard(limit = 50, countryCode) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (countryCode) params.set("countryCode", countryCode);
  return get(`/api/referrals/leaderboard?${params}`);
}

// ─── wallet helpers ───────────────────────────────────────────────────────────

/**
 * Derive a deterministic embedded wallet address from a Firebase UID.
 * Uses SHA-256 via the Web Crypto API — no external dependencies.
 * In production replace with a proper MPC / custodial wallet system.
 *
 * @param {string} uid  Firebase user UID
 * @returns {Promise<string>}  Quai-compatible 0x address (42 chars)
 */
export async function deriveWalletAddress(uid) {
  const encoder = new TextEncoder();
  const data    = encoder.encode(`q4-wallet-v1:${uid}`);
  const hash    = await crypto.subtle.digest("SHA-256", data);
  const bytes   = Array.from(new Uint8Array(hash));
  const hex     = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex.slice(0, 40)}`;
}

/**
 * Derive or retrieve the wallet address for a user.
 * Uses an in-memory Map as a lightweight session cache so we don't re-hash
 * on every render, but we never write to localStorage.
 */
const _addressCache = new Map();
export async function getOrCreateWallet(uid) {
  if (_addressCache.has(uid)) return _addressCache.get(uid);
  const address = await deriveWalletAddress(uid);
  _addressCache.set(uid, address);
  return address;
}

/**
 * Fetch the on-chain QUAI balance for a wallet address.
 * In production this calls the Quai Network JSON-RPC:
 *   POST https://rpc.quai.network  { jsonrpc:"2.0", method:"eth_getBalance", params:[address,"latest"], id:1 }
 * For the MVP we return a deterministic demo value.
 *
 * @param {string} address
 * @returns {{ quai: number }}
 */
export async function getWalletBalance(address) {
  // TODO: replace with real Quai RPC call
  const seed = parseInt(address.slice(2, 10), 16);
  const quai = parseFloat(((seed % 10000) / 100).toFixed(4));
  return { quai };
}

/**
 * Fetch transaction history for an address from the Quai Network indexer.
 * In production replace with a real indexer query.
 * Returns an array of normalised transaction objects.
 *
 * @param {string} address
 * @returns {Promise<Array<Transaction>>}
 */
export async function getTransactions(address) {
  const seed = parseInt(address.slice(2, 10), 16);
  const now  = Date.now();

  const templates = [
    { type: "received", label: "Received QUAI",  from: "0x" + address.slice(2, 10).split("").reverse().join("") + "abc123", to: address },
    { type: "sent",     label: "Sent QUAI",       from: address, to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
    { type: "received", label: "Market Reward",   from: "0xQ4Contract000000000000000000000000000000", to: address },
    { type: "sent",     label: "Market Stake",    from: address, to: "0xQ4MarketPool0000000000000000000000000001" },
    { type: "failed",   label: "Failed Transfer", from: address, to: "0x000000000000000000000000000000000000dead" },
  ];

  return templates.map((t, i) => ({
    id:        `${address.slice(2, 8)}-tx-${i}`,
    type:      t.type,
    label:     t.label,
    amount:    parseFloat(((seed % 500) / 100 + i * 0.5 + 0.1).toFixed(4)),
    from:      t.from,
    to:        t.to,
    hash:      `0x${(seed + i).toString(16).padStart(64, "0")}`,
    timestamp: new Date(now - (i + 1) * 3_600_000 * (i + 1)),
    status:    t.type === "failed" ? "failed" : "confirmed",
  }));
}
