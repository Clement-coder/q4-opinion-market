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

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `BlipPay PUT ${path} → ${res.status}`);
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

/**
 * Derive a deterministic QI (BIP47) payment code for a user.
 *
 * Uses the same HKDF-derived entropy as the Quai wallet (same uid + app secret),
 * but feeds it into QiHDWallet.fromMnemonic() so the payment code is permanently
 * linked to the user's Q4 identity without any external registration.
 *
 * The payment code is a 116-char PM8TJ... string (BIP47) that anyone can use
 * to send QI to this wallet in a privacy-preserving way.
 *
 * @param {string} uid  Firebase user UID
 * @returns {Promise<string>}  BIP47 QI payment code
 */
export async function deriveQiPaymentCode(uid) {
  const { QiHDWallet, Mnemonic } = await import("quais");
  const enc  = new TextEncoder();
  const salt = enc.encode(WALLET_APP_SECRET);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(uid),
    "HKDF",
    false,
    ["deriveBits"],
  );

  // Use nonce=0 always — the entropy only needs to be valid (< curve order),
  // and a 256-bit value from HKDF is virtually always valid BIP39 entropy.
  const info    = enc.encode(`q4-qi-payment-code-v1:${uid}:0`);
  const rawBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    keyMaterial,
    256,
  );

  const entropyHex = "0x" + Array.from(new Uint8Array(rawBits))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const mnemonic = Mnemonic.fromEntropy(entropyHex);
  const qiWallet = QiHDWallet.fromMnemonic(mnemonic);
  return qiWallet.getPaymentCode(0);
}


/**
 * Register (or update) this wallet address on the BlipPay referral leaderboard.
 *
 * Flow:
 *   1. POST /api/referrals/challenge  → get a message + challengeId
 *   2. Sign the message with the wallet's private key (EIP-191 personal_sign)
 *   3. PUT  /api/referrals/profile    → submit address + challengeId + signature
 *
 * @param {string} uid          Firebase user UID (used to derive the wallet key)
 * @param {string} displayName  Display name to set on the BlipPay profile
 * @returns {Promise<{ shortCode: string, shortUrl: string }>}
 */
export async function registerWalletWithBlipPay(uid, displayName) {
  const { wallet, address } = await getOrCreateWallet(uid);

  // Step 1: Get challenge
  const challenge = await post("/api/referrals/challenge", {
    referralAddress: address,
  });

  // Step 2: Sign the challenge message with the wallet's private key
  const signature = await wallet.signMessage(challenge.message);

  // Step 3: Register profile
  const profile = await put("/api/referrals/profile", {
    referralAddress: address,
    challengeId:     challenge.challengeId,
    signature,
    displayName:     displayName || "Q4 Predictor",
  });

  return profile;
}

/**
 * Fetch the current BlipPay profile for this wallet (public, no auth needed).
 * Returns null if not registered yet.
 *
 * @param {string} address  Quai wallet address (0x…)
 * @returns {Promise<object|null>}
 */
export async function getBlipPayProfile(address) {
  if (!address) return null;
  try {
    const data = await get(`/api/referrals/status?referralAddress=${encodeURIComponent(address)}`);
    return data?.profile ?? null;
  } catch {
    return null;
  }
}



/**
 * App-level wallet secret — combined with the user's Firebase UID via HKDF
 * to produce a deterministic private key.  This value is baked into the
 * client bundle, so it is NOT a secret in the cryptographic sense — anyone
 * who inspects the bundle can read it.  Its purpose is to make the derived
 * key unique to Q4 (i.e. the same UID used on a different platform produces
 * a completely different key), not to provide secrecy.
 *
 * IMPORTANT: never change this value after launch.  Changing it rotates
 * every user's private key and makes all existing wallet addresses unreachable.
 */
const WALLET_APP_SECRET = "q4-embedded-wallet-v2-quai-cyprus1";

/**
 * Derive a deterministic secp256k1 private key for a user using HKDF-SHA-256.
 *
 * Algorithm:
 *   1. Import the user's Firebase UID as HKDF key material.
 *   2. Derive 32 bytes using HKDF-SHA-256 with:
 *        salt  = UTF-8(WALLET_APP_SECRET)
 *        info  = UTF-8("q4-wallet-v2:" + uid + ":" + nonce)
 *   3. Use the 32 bytes directly as a secp256k1 private key.
 *   4. Instantiate a quais Wallet and check the address zone.
 *   5. If the address is NOT in Cyprus-1 (first byte > 0x1F), increment the
 *      nonce and repeat until we find one that is — typically ≤ 8 iterations.
 *
 * The private key and wallet are kept in an in-memory cache (Map) that lives
 * for the page session only.  Nothing is written to localStorage or any DB.
 *
 * @param {string} uid  Firebase user UID
 * @returns {Promise<{ wallet: import("quais").Wallet, address: string, privateKey: string }>}
 */
async function deriveWalletKeypair(uid) {
  const { Wallet } = await import("quais");
  const enc  = new TextEncoder();
  const salt = enc.encode(WALLET_APP_SECRET);

  // Import UID as raw HKDF key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(uid),
    "HKDF",
    false,
    ["deriveKey", "deriveBits"],
  );

  for (let nonce = 0; nonce < 256; nonce++) {
    const info = enc.encode(`q4-wallet-v2:${uid}:${nonce}`);

    const rawBits = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info },
      keyMaterial,
      256, // 32 bytes
    );

    const privateKey = "0x" + Array.from(new Uint8Array(rawBits))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    let wallet;
    try {
      wallet = new Wallet(privateKey);
    } catch {
      // Invalid scalar (> curve order) — extremely rare, skip
      continue;
    }

    // Cyprus-1 zone: first byte of address must be 0x00–0x1F
    const firstByte = parseInt(wallet.address.slice(2, 4), 16);
    if (firstByte <= 0x1f) {
      return { wallet, address: wallet.address, privateKey };
    }
  }

  // Fallback: should never happen in practice (probability ≈ 1/32^256)
  throw new Error("Could not derive a Cyprus-1 wallet address after 256 iterations.");
}

// In-memory session cache — keyed by Firebase UID
const _walletCache = new Map(); // uid → { wallet, address, privateKey }

/**
 * Retrieve (or derive on first call) the embedded Quai wallet for a user.
 * Result is memoised for the page session; the private key is never persisted.
 *
 * @param {string} uid  Firebase user UID
 * @returns {Promise<{ wallet: import("quais").Wallet, address: string, privateKey: string }>}
 */
export async function getOrCreateWallet(uid) {
  if (_walletCache.has(uid)) return _walletCache.get(uid);
  const result = await deriveWalletKeypair(uid);
  _walletCache.set(uid, result);
  return result;
}

/**
 * Convenience: return only the wallet address for a UID.
 * Used by WalletContext to populate the address display without exposing the key.
 */
export async function deriveWalletAddress(uid) {
  const { address } = await getOrCreateWallet(uid);
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
 * no event logs index). The only way to find txs is to scan blocks one by one.
 *
 * This implementation scans the last 20 blocks in parallel with a hard
 * 10-second timeout so the wallet page always loads quickly. Users with recent
 * transactions in the last 20 blocks will see them; otherwise the list is empty.
 * A "View on Quaiscan" link is provided in the UI for full history.
 *
 * Block structure note: Quai blocks do NOT have a root-level `timestamp` or `number`.
 * Both live under `block.woHeader.timestamp` and `block.woHeader.number`.
 *
 * @param {string} address
 * @returns {Promise<Array<Transaction>>}
 */
export async function getTransactions(address) {
  if (!address) return [];
  try {
    const addr      = address.toLowerCase();
    const latestHex = await Promise.race([
      quaiRpc("eth_blockNumber", []),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
    ]);
    const latestBlock = parseInt(latestHex, 16);

    // Fetch the last 20 blocks in parallel
    const SCAN_DEPTH = 20;
    const blockNums  = Array.from({ length: SCAN_DEPTH }, (_, k) => latestBlock - k);

    const blockResults = await Promise.allSettled(
      blockNums.map(n =>
        Promise.race([
          quaiRpc("quai_getBlockByNumber", [`0x${n.toString(16)}`, true]),
          new Promise((_, rej) => setTimeout(() => rej(new Error("block timeout")), 8000)),
        ])
      )
    );

    const txs = [];
    for (const result of blockResults) {
      if (result.status !== "fulfilled" || !result.value?.transactions) continue;
      const block = result.value;

      // Quai block structure: timestamp and number are in woHeader, not root
      const woHeader    = block.woHeader ?? {};
      const tsHex       = woHeader.timestamp ?? "0x0";
      const blockNumHex = woHeader.number    ?? "0x0";
      const blockTs     = new Date(parseInt(tsHex, 16) * 1000);
      const blockNum    = parseInt(blockNumHex, 16);

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
          timestamp:   blockTs,
          status:      "confirmed",
          blockNumber: blockNum,
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

// ─── send transaction ─────────────────────────────────────────────────────────

/**
 * Sign and broadcast a QUAI transfer on Cyprus-1.
 *
 * The wallet is derived from the user's Firebase UID via HKDF — the private
 * key never leaves memory and is never passed in by the caller.
 *
 * @param {{ uid: string, to: string, amountQuai: number }} opts
 * @returns {Promise<{ hash: string, from: string }>}
 */
export async function sendQuai({ uid, to, amountQuai }) {
  if (!uid || !to || !amountQuai) throw new Error("uid, to, and amountQuai are required");

  const { wallet } = await getOrCreateWallet(uid);
  const { JsonRpcProvider } = await import("quais");

  // Connect wallet to the Cyprus-1 provider
  const provider      = new JsonRpcProvider(QUAI_RPC);
  const connectedWallet = wallet.connect(provider);

  // Get nonce and gas price from the network
  const [nonceHex, gasPriceHex] = await Promise.all([
    quaiRpc("quai_getTransactionCount", [wallet.address, "pending"]),
    quaiRpc("eth_gasPrice", []),
  ]);

  const nonce    = parseInt(nonceHex, 16);
  const gasPrice = BigInt(gasPriceHex);
  const gasLimit = BigInt(21_000);

  // Convert QUAI amount to Wei (18 decimals) — Math.floor avoids rounding up past balance
  const valueWei = BigInt(Math.floor(amountQuai * 1e18));

  const tx = {
    to,
    value:    valueWei,
    nonce,
    gasPrice,
    gasLimit,
    chainId:  BigInt(9),  // Quai mainnet Cyprus-1
    type:     0,
  };

  const signedTx   = await connectedWallet.signTransaction(tx);
  const txHash     = await quaiRpc("quai_sendRawTransaction", [signedTx]);

  return { hash: txHash, from: wallet.address };
}
