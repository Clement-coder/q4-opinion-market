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

// ─── wallet QI payment code ──────────────────────────────────────────────────

/**
 * Fetch the QI (BIP47) reusable payment code for a Quai wallet address.
 *
 * BlipPay profiles are registered with the user's own external wallet address
 * stored as `contactQuaiAddress`. We search the leaderboard for an entry whose
 * `contactQuaiAddress` matches the given address (case-insensitive), then return
 * its `contactQiPaymentCode`.
 *
 * Falls back to null if no matching profile is found.
 *
 * @param {string} address  Quai wallet address (0x…)
 * @returns {Promise<string|null>}  QI payment code string, or null if none registered
 */
export async function getWalletQiCode(address) {
  if (!address) return null;
  const normalised = address.toLowerCase();
  try {
    // Fetch a broad leaderboard slice and look for a matching contactQuaiAddress
    const data = await get("/api/referrals/leaderboard?limit=200");
    const entries = data?.entries ?? [];
    const match = entries.find(
      (e) => e.contactQuaiAddress?.toLowerCase() === normalised
    );
    return match?.contactQiPaymentCode ?? null;
  } catch {
    return null;
  }
}

// ─── wallet helpers ───────────────────────────────────────────────────────────

/**
 * Derive a deterministic embedded wallet address for a user.
 * Forces the address into Cyprus-1 zone (first byte 0x00–0x1F) so that
 * quai_getBalance works against the public RPC at rpc.quai.network/cyprus1.
 * We iterate SHA-256 with a nonce suffix until the first byte is in range.
 *
 * @param {string} uid  Firebase user UID
 * @returns {Promise<string>}  Quai Cyprus-1 compatible 0x address (42 chars)
 */
export async function deriveWalletAddress(uid) {
  const encoder = new TextEncoder();
  for (let nonce = 0; nonce < 256; nonce++) {
    const data  = encoder.encode(`q4-wallet-v1:${uid}:${nonce}`);
    const hash  = await crypto.subtle.digest("SHA-256", data);
    const bytes = Array.from(new Uint8Array(hash));
    // Cyprus-1 zone: first byte must be 0x00–0x1F
    if (bytes[0] <= 0x1f) {
      return `0x${bytes.slice(0, 20).map(b => b.toString(16).padStart(2, "0")).join("")}`;
    }
  }
  // Fallback: force first byte to 0x00
  const data  = encoder.encode(`q4-wallet-v1:${uid}:0`);
  const hash  = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(hash));
  bytes[0] = 0x00;
  return `0x${bytes.slice(0, 20).map(b => b.toString(16).padStart(2, "0")).join("")}`;
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

// ─── Quai Network RPC ────────────────────────────────────────────────────────

const QUAI_RPC = "https://rpc.quai.network/cyprus1";
let _rpcId = 1;

async function quaiRpc(method, params) {
  try {
    const res = await fetch(QUAI_RPC, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ jsonrpc: "2.0", method, params, id: _rpcId++ }),
    });
    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
  } catch (e) {
    console.warn(`[quaiRpc] ${method} failed:`, e.message);
    throw e;
  }
}

/**
 * Fetch the on-chain QUAI balance for a wallet address via quai_getBalance.
 * Returns balance in QUAI (converted from Wei, 18 decimals).
 *
 * Quai RPC only accepts its own zone-aware checksum format, NOT EIP-55.
 * We use quai_getBalance which works with the mixed-case Quai-checksummed
 * address directly, and falls back to lowercase if that fails.
 *
 * @param {string} address  Cyprus-1 zone Quai address
 * @returns {{ quai: number }}
 */
export async function getWalletBalance(address) {
  if (!address || !address.startsWith("0x")) return { quai: 0 };
  try {
    // Try Quai-checksummed address first (the format Quai RPC expects)
    const hex  = await quaiRpc("quai_getBalance", [address, "latest"]);
    const wei  = BigInt(hex);
    const quai = Number(wei) / 1e18;
    return { quai: parseFloat(quai.toFixed(6)) };
  } catch {
    try {
      // Fallback: lowercase (works on some Quai RPC implementations)
      const hex  = await quaiRpc("quai_getBalance", [address.toLowerCase(), "latest"]);
      const quai = Number(BigInt(hex)) / 1e18;
      return { quai: parseFloat(quai.toFixed(6)) };
    } catch {
      return { quai: 0 };
    }
  }
}

/**
 * Fetch recent transactions for a Quai address.
 *
 * NOTE: Quai Network has no transaction-index API (no eth_getTransactionsByAddress,
 * no event logs index). The only way to find txs is to scan blocks one by one,
 * which takes 200+ seconds for a 200-block window — completely unusable in a browser.
 *
 * This implementation uses a small parallel batch (10 blocks max) with a hard
 * 8-second timeout so the wallet page always loads quickly. Users with recent
 * transactions in the last 10 blocks will see them; otherwise the list is empty.
 * A "View on Quaiscan" link is provided in the UI for full history.
 *
 * @param {string} address
 * @returns {Promise<Array<Transaction>>}
 */
export async function getTransactions(address) {
  if (!address) return [];
  try {
    const addr       = address.toLowerCase();
    const latestHex  = await Promise.race([
      quaiRpc("eth_blockNumber", []),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
    ]);
    const latestBlock = parseInt(latestHex, 16);

    // Fetch the last 10 blocks in parallel (each block takes ~1.4s, 10 in parallel ≈ 2s)
    const SCAN_DEPTH = 10;
    const blockNums  = Array.from({ length: SCAN_DEPTH }, (_, k) => latestBlock - k);

    const blockResults = await Promise.allSettled(
      blockNums.map(n =>
        Promise.race([
          quaiRpc("quai_getBlockByNumber", [`0x${n.toString(16)}`, true]),
          new Promise((_, rej) => setTimeout(() => rej(new Error("block timeout")), 6000)),
        ])
      )
    );

    const txs = [];
    for (const result of blockResults) {
      if (result.status !== "fulfilled" || !result.value?.transactions) continue;
      const block = result.value;

      for (const tx of block.transactions) {
        const from = (tx.from || "").toLowerCase();
        const to   = (tx.to   || "").toLowerCase();
        if (from !== addr && to !== addr) continue;

        const type   = from === addr ? "sent" : "received";
        const weiVal = BigInt(tx.value || "0x0");
        const amount = parseFloat((Number(weiVal) / 1e18).toFixed(6));

        txs.push({
          id:          tx.hash,
          type,
          label:       type === "sent" ? "Sent QUAI" : "Received QUAI",
          amount,
          from:        tx.from,
          to:          tx.to,
          hash:        tx.hash,
          timestamp:   new Date(parseInt(block.timestamp || "0", 16) * 1000),
          status:      "confirmed",
          blockNumber: parseInt(block.number || "0x0", 16),
        });

        if (txs.length >= 20) break;
      }
      if (txs.length >= 20) break;
    }

    return txs;
  } catch (e) {
    console.warn("[getTransactions] failed:", e.message);
    return [];
  }
}
