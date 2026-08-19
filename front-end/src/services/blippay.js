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
 * @param {string} address  Cyprus-1 zone Quai address (0x00–0x1F prefix)
 * @returns {{ quai: number }}
 */
export async function getWalletBalance(address) {
  try {
    // Normalize to lowercase — the Quai RPC rejects EIP-55 mixed-case checksums
    const addr = address?.toLowerCase();
    if (!addr || !addr.startsWith("0x")) return { quai: 0 };
    const hex  = await quaiRpc("quai_getBalance", [addr, "latest"]);
    const wei  = BigInt(hex);
    const quai = Number(wei) / 1e18;
    return { quai: parseFloat(quai.toFixed(6)) };
  } catch {
    return { quai: 0 };
  }
}

/**
 * Fetch recent transactions for a Quai address.
 * Uses quai_getBlockByNumber to scan recent blocks for transactions involving
 * the address. Returns up to 20 recent txs.
 *
 * @param {string} address
 * @returns {Promise<Array<Transaction>>}
 */
export async function getTransactions(address) {
  try {
    const latestHex   = await quaiRpc("eth_blockNumber", []);
    const latestBlock = parseInt(latestHex, 16);
    const addr        = address.toLowerCase();
    const txs         = [];
    const scanDepth   = 200; // scan last 200 blocks

    for (let i = latestBlock; i > Math.max(0, latestBlock - scanDepth) && txs.length < 20; i--) {
      const block = await quaiRpc("quai_getBlockByNumber", [`0x${i.toString(16)}`, true]);
      if (!block || !block.transactions) continue;

      for (const tx of block.transactions) {
        const from = (tx.from || "").toLowerCase();
        const to   = (tx.to   || "").toLowerCase();
        if (from !== addr && to !== addr) continue;

        const type   = from === addr ? "sent" : "received";
        const weiVal = BigInt(tx.value || "0x0");
        const amount = parseFloat((Number(weiVal) / 1e18).toFixed(6));

        txs.push({
          id:        tx.hash,
          type,
          label:     type === "sent" ? "Sent QUAI" : "Received QUAI",
          amount,
          from:      tx.from,
          to:        tx.to,
          hash:      tx.hash,
          timestamp: new Date(parseInt(block.timestamp || "0", 16) * 1000),
          status:    "confirmed",
          blockNumber: i,
        });

        if (txs.length >= 20) break;
      }
    }

    return txs;
  } catch (e) {
    console.warn("[getTransactions] failed:", e.message);
    return [];
  }
}
