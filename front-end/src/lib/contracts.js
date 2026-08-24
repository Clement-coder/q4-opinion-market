/**
 * contracts.js
 * ABIs, addresses, and a low-level Quai RPC encoder/decoder.
 *
 * Quai Network quirks handled here:
 *  1. Zone-aware address checksum (not EIP-55) — we always pass the
 *     exact mixed-case form from the env var, never re-checksum it.
 *  2. Quai RPC only accepts lowercase addresses in call params.
 *  3. ABI encoding / decoding is done with a tiny hand-rolled helper
 *     so we avoid pulling ethers/viem into the browser bundle.
 */

// ─── Addresses ────────────────────────────────────────────────────────────────

export const FACTORY_ADDRESS =
  (import.meta.env.VITE_FACTORY_ADDRESS ?? "").toLowerCase();

export const QUAI_RPC = "https://rpc.quai.network/cyprus1";

// ─── ABIs ─────────────────────────────────────────────────────────────────────

export const Q4_MARKET_ABI = [{"type":"constructor","inputs":[{"name":"_question","type":"string","internalType":"string"},{"name":"_category","type":"string","internalType":"string"},{"name":"_deadline","type":"uint256","internalType":"uint256"},{"name":"_oracle","type":"address","internalType":"address"},{"name":"_factory","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"BPS_DENOM","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"PROTOCOL_FEE_BPS","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"cancelMarket","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"category","inputs":[],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"function","name":"claimReward","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"closeMarket","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deadline","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getMarketInfo","inputs":[],"outputs":[{"name":"_question","type":"string","internalType":"string"},{"name":"_category","type":"string","internalType":"string"},{"name":"_deadline","type":"uint256","internalType":"uint256"},{"name":"_status","type":"uint8","internalType":"enum Q4Market.Status"},{"name":"_resolvedOutcome","type":"bool","internalType":"bool"},{"name":"_yesPool","type":"uint256","internalType":"uint256"},{"name":"_noPool","type":"uint256","internalType":"uint256"},{"name":"_participantCount","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getParticipants","inputs":[],"outputs":[{"name":"","type":"address[]","internalType":"address[]"}],"stateMutability":"view"},{"type":"function","name":"getPosition","inputs":[{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"hasPosition","type":"bool","internalType":"bool"},{"name":"side","type":"bool","internalType":"bool"},{"name":"totalAmount","type":"uint256","internalType":"uint256"},{"name":"claimed","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"noPool","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"oracle","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"pendingRefund","inputs":[{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"pendingReward","inputs":[{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"predict","inputs":[{"name":"isYes","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"protocolFeesAccrued","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"question","inputs":[],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"function","name":"resolve","inputs":[{"name":"outcome","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"resolvedOutcome","inputs":[],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"setOracle","inputs":[{"name":"newOracle","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"status","inputs":[],"outputs":[{"name":"","type":"uint8","internalType":"enum Q4Market.Status"}],"stateMutability":"view"},{"type":"function","name":"totalPool","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"withdrawFees","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdrawRefund","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"yesPool","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"event","name":"FeesWithdrawn","inputs":[{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"MarketCancelled","inputs":[],"anonymous":false},{"type":"event","name":"MarketClosed","inputs":[],"anonymous":false},{"type":"event","name":"MarketResolved","inputs":[{"name":"outcome","type":"bool","indexed":false,"internalType":"bool"},{"name":"winPool","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"losePool","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"fee","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OracleUpdated","inputs":[{"name":"newOracle","type":"address","indexed":false,"internalType":"address"}],"anonymous":false},{"type":"event","name":"PositionOpened","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"side","type":"bool","indexed":false,"internalType":"bool"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"newTotal","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"RefundWithdrawn","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"RewardClaimed","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"reward","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false}];

export const Q4_FACTORY_ABI = [{"type":"constructor","inputs":[{"name":"_oracle","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"cancelMarket","inputs":[{"name":"marketId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"closeMarket","inputs":[{"name":"marketId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"collectFees","inputs":[{"name":"marketId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"createMarket","inputs":[{"name":"question","type":"string","internalType":"string"},{"name":"category","type":"string","internalType":"string"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"marketId","type":"uint256","internalType":"uint256"},{"name":"market","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"getAllMarkets","inputs":[],"outputs":[{"name":"","type":"address[]","internalType":"address[]"}],"stateMutability":"view"},{"type":"function","name":"getMarket","inputs":[{"name":"marketId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getMarketInfo","inputs":[{"name":"marketId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"question","type":"string","internalType":"string"},{"name":"category","type":"string","internalType":"string"},{"name":"deadline","type":"uint256","internalType":"uint256"},{"name":"mStatus","type":"uint8","internalType":"enum Q4Market.Status"},{"name":"resolvedOutcome","type":"bool","internalType":"bool"},{"name":"yesPool","type":"uint256","internalType":"uint256"},{"name":"noPool","type":"uint256","internalType":"uint256"},{"name":"participantCount","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"marketCount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"markets","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"oracle","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"resolveMarket","inputs":[{"name":"marketId","type":"uint256","internalType":"uint256"},{"name":"outcome","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setOracle","inputs":[{"name":"newOracle","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"updateMarketOracle","inputs":[{"name":"marketId","type":"uint256","internalType":"uint256"},{"name":"newOracle","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdrawFees","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"FeesCollected","inputs":[{"name":"marketId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"FeesWithdrawn","inputs":[{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"MarketCancelled","inputs":[{"name":"marketId","type":"uint256","indexed":true,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"MarketCreated","inputs":[{"name":"marketId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"market","type":"address","indexed":true,"internalType":"address"},{"name":"question","type":"string","indexed":false,"internalType":"string"},{"name":"category","type":"string","indexed":false,"internalType":"string"},{"name":"deadline","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"MarketResolved","inputs":[{"name":"marketId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"outcome","type":"bool","indexed":false,"internalType":"bool"}],"anonymous":false},{"type":"event","name":"OracleUpdated","inputs":[{"name":"newOracle","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false}];

// ─── Tiny ABI encoder / decoder ───────────────────────────────────────────────
// Handles the subset of Solidity types we actually need:
//   encode: bool, uint256, address
//   decode: bool, uint256, address, string, uint8, bytes32, tuple/array (simple)
//
// This avoids adding ethers/viem to the frontend bundle while keeping the code
// auditable and correct for our specific use-cases.

/** Left-pad a hex string to 32 bytes (64 hex chars), no 0x prefix. */
function pad32(hex) {
  return hex.replace(/^0x/, "").padStart(64, "0");
}

/** Keccak-256 4-byte selectors, pre-computed with `cast sig` and verified against the deployed ABI. */
export const SELECTORS = {
  // Q4Market
  "predict(bool)":        "0x0a990f54",
  "claimReward()":        "0xb88a802f",
  "withdrawRefund()":     "0x110f8874",
  "getPosition(address)": "0x16c19739",
  "getMarketInfo()":      "0x23341a05",
  "pendingReward(address)":"0xf40f0f52",
  "pendingRefund(address)":"0x99d82c5f",
  // Q4MarketFactory (read-only calls only — writes go through resolve-markets edge fn)
  "getMarket(uint256)":   "0xeb44fdd3",
  "getAllMarkets()":       "0xb0772d0b",
  "marketCount()":        "0xec979082",
};

/** Encode a bool as a 32-byte ABI word. */
function encodeBool(v) { return pad32(v ? "1" : "0"); }

/** Encode a uint256 BigInt as a 32-byte ABI word. */
function encodeUint256(v) { return pad32(BigInt(v).toString(16)); }

/** Encode an address (lowercase, strip 0x) as a 32-byte ABI word. */
function encodeAddress(addr) { return pad32(addr.replace(/^0x/, "").toLowerCase()); }

/**
 * Build the full calldata hex string for a known function.
 *
 * @param {string} sel   4-byte selector, e.g. "0x6f1d4ea4"
 * @param {string[]} words  Array of already-encoded 32-byte words (no 0x).
 * @returns {string}  Full hex calldata with 0x prefix.
 */
export function buildCalldata(sel, words = []) {
  return sel + words.join("");
}

/**
 * Decode a raw hex response from eth_call into typed values.
 *
 * @param {string} hex   Raw 0x-prefixed result from eth_call.
 * @param {string[]} types  Array of type strings: "uint256" | "bool" | "address" | "string"
 * @returns {any[]}  Decoded values in order.
 */
export function decodeABI(hex, types) {
  const raw  = hex.replace(/^0x/, "");
  const words = [];
  for (let i = 0; i < raw.length; i += 64) {
    words.push(raw.slice(i, i + 64));
  }

  const result = [];
  for (let i = 0; i < types.length; i++) {
    const word = words[i] ?? "0".repeat(64);
    const t    = types[i];
    if (t === "bool") {
      result.push(parseInt(word, 16) !== 0);
    } else if (t === "uint256" || t === "uint8") {
      result.push(BigInt("0x" + word));
    } else if (t === "address") {
      result.push("0x" + word.slice(24));
    } else if (t === "string") {
      // ABI-encoded string: word[i] = offset, then at offset: length word + UTF-8 data
      const offset     = parseInt(word, 16) * 2; // byte offset → hex char offset
      const lenHex     = raw.slice(offset, offset + 64);
      const byteLen    = parseInt(lenHex, 16);
      const strHex     = raw.slice(offset + 64, offset + 64 + byteLen * 2);
      const bytes      = new Uint8Array(strHex.match(/.{2}/g).map(h => parseInt(h, 16)));
      result.push(new TextDecoder().decode(bytes));
    } else {
      // Unknown: return raw hex word
      result.push("0x" + word);
    }
  }
  return result;
}

// ─── Low-level RPC helpers ────────────────────────────────────────────────────

let _rpcId = 100;

/**
 * Send a raw JSON-RPC call to the Quai Cyprus-1 node.
 * Always uses lowercase addresses in params to satisfy Quai's checksum.
 */
export async function quaiCall(method, params) {
  const res = await fetch(QUAI_RPC, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ jsonrpc: "2.0", method, params, id: _rpcId++ }),
  });
  if (!res.ok) throw new Error(`Quai RPC HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? JSON.stringify(json.error));
  return json.result;
}

/**
 * eth_call — read-only contract call.
 * Uses quai_call (Quai-specific RPC method) which is zone-aware.
 * Falls back to eth_call if quai_call is not available on the node.
 *
 * @param {string} to        Contract address (will be lowercased).
 * @param {string} calldata  Hex calldata with 0x prefix.
 * @returns {string}  Raw 0x-prefixed hex result.
 */
export async function ethCall(to, calldata) {
  try {
    return await quaiCall("quai_call", [{ to: to.toLowerCase(), data: calldata }, "latest"]);
  } catch (e) {
    // Some nodes may not support quai_call — fall back to eth_call
    if (e.message?.includes("quai_call") || e.message?.includes("method not found")) {
      return quaiCall("eth_call", [{ to: to.toLowerCase(), data: calldata }, "latest"]);
    }
    throw e;
  }
}

/**
 * eth_sendRawTransaction — broadcast a signed transaction.
 * @param {string} signedTx  0x-prefixed signed tx hex.
 * @returns {string}  Transaction hash.
 */
export async function sendRawTx(signedTx) {
  return quaiCall("eth_sendRawTransaction", [signedTx]);
}

/**
 * Poll for a transaction receipt until mined or timeout.
 * @param {string}  txHash
 * @param {number}  [maxWaitMs=60000]
 * @returns {object}  Receipt object.
 */
export async function waitForReceipt(txHash, maxWaitMs = 60_000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2500));
    const receipt = await quaiCall("eth_getTransactionReceipt", [txHash]);
    if (receipt && receipt.blockNumber) return receipt;
  }
  throw new Error(`Transaction ${txHash} not confirmed within ${maxWaitMs / 1000}s`);
}

// ─── Convenience encoders ─────────────────────────────────────────────────────

/** Encode calldata for predict(bool isYes) */
export function encodePredict(isYes) {
  return buildCalldata(SELECTORS["predict(bool)"], [encodeBool(isYes)]);
}

/** Encode calldata for claimReward() */
export function encodeClaimReward() {
  return buildCalldata(SELECTORS["claimReward()"]);
}

/** Encode calldata for withdrawRefund() */
export function encodeWithdrawRefund() {
  return buildCalldata(SELECTORS["withdrawRefund()"]);
}

/** Encode calldata for getPosition(address) */
export function encodeGetPosition(userAddr) {
  return buildCalldata(SELECTORS["getPosition(address)"], [encodeAddress(userAddr)]);
}

/** Encode calldata for pendingReward(address) */
export function encodePendingReward(userAddr) {
  return buildCalldata(SELECTORS["pendingReward(address)"], [encodeAddress(userAddr)]);
}

/** Encode calldata for pendingRefund(address) */
export function encodePendingRefund(userAddr) {
  return buildCalldata(SELECTORS["pendingRefund(address)"], [encodeAddress(userAddr)]);
}

/** Encode calldata for getMarket(uint256) on the factory */
export function encodeGetMarket(marketId) {
  return buildCalldata(SELECTORS["getMarket(uint256)"], [encodeUint256(marketId)]);
}
