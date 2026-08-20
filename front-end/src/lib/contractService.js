/**
 * contractService.js
 * High-level contract interaction layer for Q4.
 *
 * Architecture
 * ────────────
 * The frontend uses a deterministic "embedded wallet" derived from the user's
 * Firebase UID (see blippay.js → deriveWalletAddress).  That derivation only
 * produces an address; the corresponding private key lives in the browser
 * memory via the same deterministic derivation so we can sign txs.
 *
 * All on-chain writes follow this pattern:
 *   1. Build calldata (ABI-encoded).
 *   2. Get nonce + gas price from the Quai RPC.
 *   3. Sign the transaction locally with the user's derived key.
 *   4. Broadcast via eth_sendRawTransaction.
 *   5. Poll for receipt (waitForReceipt).
 *
 * The quais.js SDK is used for signing because it handles Quai's custom
 * transaction serialisation (protobuf-encoded, with address grinding for
 * zone-correct contract addresses).
 *
 * Read-only calls use the tiny hand-rolled ABI encoder in contracts.js to
 * avoid pulling the full quais bundle into hot paths.
 */

import { quais } from "quais";
import {
  FACTORY_ADDRESS,
  QUAI_RPC,
  ethCall,
  quaiCall,
  waitForReceipt,
  encodePredict,
  encodeClaimReward,
  encodeWithdrawRefund,
  encodeGetPosition,
  encodePendingReward,
  encodePendingRefund,
  decodeABI,
} from "./contracts.js";

// ─── Provider (singleton) ─────────────────────────────────────────────────────

let _provider = null;
function getProvider() {
  if (!_provider) {
    _provider = new quais.JsonRpcProvider(QUAI_RPC, undefined, { usePathing: true });
  }
  return _provider;
}

// ─── Signer cache ─────────────────────────────────────────────────────────────
// One Wallet instance per private key (keyed by lowercase address).

const _signers = new Map();

/**
 * Derive the private key from a Firebase UID (same algorithm as deriveWalletAddress
 * in blippay.js, but returning the raw key bytes as a hex string).
 *
 * We iterate SHA-256 with a nonce suffix until the DERIVED ADDRESS (not the key
 * bytes) has its first byte in the Cyprus-1 range (0x00–0x1F). This exactly
 * matches the address derivation in blippay.js → deriveWalletAddress().
 *
 * Note: blippay.js checks the SHA-256 hash bytes[0] <= 0x1f and uses the first
 * 20 bytes of the hash directly as an address (not as a private key). Here we
 * do the same: use the hash bytes as the private key, then verify the resulting
 * EC address is also in Cyprus-1 zone.
 *
 * @param {string} uid  Firebase UID
 * @returns {Promise<{privateKey: string, address: string}>}
 */
export async function deriveKeyFromUID(uid) {
  const encoder = new TextEncoder();
  for (let nonce = 0; nonce < 10000; nonce++) {
    const data       = encoder.encode(`q4-wallet-v1:${uid}:${nonce}`);
    const hash       = await crypto.subtle.digest("SHA-256", data);
    const bytes      = Array.from(new Uint8Array(hash));
    const privateKey = "0x" + bytes.map(b => b.toString(16).padStart(2, "0")).join("");
    const wallet     = new quais.Wallet(privateKey);
    const address    = wallet.address;
    // Check the ECDSA-derived address is in Cyprus-1 zone (first byte 0x00–0x1F)
    // so the user can transact with contracts on Cyprus-1 shard.
    const firstByte  = parseInt(address.slice(2, 4), 16);
    if (firstByte <= 0x1f) {
      return { privateKey, address };
    }
  }
  throw new Error("deriveKeyFromUID: could not find Cyprus-1 address in 10000 nonces");
}

/**
 * Get (or create) a quais Wallet signer for the given Firebase UID.
 * The wallet is connected to the Quai Cyprus-1 provider.
 */
export async function getSigner(uid) {
  if (_signers.has(uid)) return _signers.get(uid);
  const { privateKey } = await deriveKeyFromUID(uid);
  const signer = new quais.Wallet(privateKey, getProvider());
  _signers.set(uid, signer);
  return signer;
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch the on-chain position for a user on a specific Q4Market contract.
 *
 * @param {string} marketContractAddress  Q4Market contract address (from markets.contract_address).
 * @param {string} userWalletAddress      User's Quai wallet address.
 * @returns {Promise<{hasPosition: boolean, side: boolean, totalAmount: bigint, claimed: boolean}>}
 */
export async function getOnChainPosition(marketContractAddress, userWalletAddress) {
  try {
    const calldata = encodeGetPosition(userWalletAddress);
    const raw      = await ethCall(marketContractAddress, calldata);
    const [hasPosition, side, totalAmount, claimed] = decodeABI(raw, ["bool", "bool", "uint256", "bool"]);
    return { hasPosition, side, totalAmount, claimed };
  } catch (e) {
    console.warn("[contractService] getOnChainPosition failed:", e.message);
    return { hasPosition: false, side: false, totalAmount: 0n, claimed: false };
  }
}

/**
 * Get the pending claimable reward for a user on a resolved market.
 *
 * @param {string} marketContractAddress
 * @param {string} userWalletAddress
 * @returns {Promise<bigint>}  Reward in wei (0n if none).
 */
export async function getOnChainPendingReward(marketContractAddress, userWalletAddress) {
  try {
    const calldata = encodePendingReward(userWalletAddress);
    const raw      = await ethCall(marketContractAddress, calldata);
    const [amount] = decodeABI(raw, ["uint256"]);
    return amount;
  } catch (e) {
    console.warn("[contractService] getOnChainPendingReward failed:", e.message);
    return 0n;
  }
}

/**
 * Get the pending refund for a user on a cancelled market.
 *
 * @param {string} marketContractAddress
 * @param {string} userWalletAddress
 * @returns {Promise<bigint>}  Refund in wei (0n if none).
 */
export async function getOnChainPendingRefund(marketContractAddress, userWalletAddress) {
  try {
    const calldata = encodePendingRefund(userWalletAddress);
    const raw      = await ethCall(marketContractAddress, calldata);
    const [amount] = decodeABI(raw, ["uint256"]);
    return amount;
  } catch (e) {
    console.warn("[contractService] getOnChainPendingRefund failed:", e.message);
    return 0n;
  }
}

// ─── Write helpers ────────────────────────────────────────────────────────────

/**
 * Send a signed transaction using quais.js (handles Quai's protobuf encoding).
 *
 * @param {quais.Wallet} signer        Connected quais Wallet.
 * @param {string}       to            Contract address (Quai-checksummed or lowercase).
 * @param {string}       calldata      Hex calldata string with 0x prefix.
 * @param {bigint}       [value=0n]    QUAI value in wei to send.
 * @returns {Promise<{hash: string, receipt: object}>}
 */
async function sendTx(signer, to, calldata, value = 0n) {
  // Use quais.js sendTransaction which handles Quai's protobuf tx format
  const tx = await signer.sendTransaction({
    to,
    data:  calldata,
    value,
  });

  console.log(`[contractService] tx sent: ${tx.hash}`);
  const receipt = await tx.wait(1);
  return { hash: tx.hash, receipt };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Call predict(isYes) on a Q4Market contract.
 * Sends the QUAI stake value along with the transaction.
 *
 * @param {object} params
 * @param {string}  params.uid                  Firebase UID of the user.
 * @param {string}  params.marketContractAddress Address of the specific Q4Market contract.
 * @param {boolean} params.isYes                true = YES, false = NO.
 * @param {number}  params.amountQuai           Stake amount in QUAI (float, e.g. 2.5).
 * @returns {Promise<{hash: string, receipt: object}>}
 */
export async function onChainPredict({ uid, marketContractAddress, isYes, amountQuai }) {
  if (!marketContractAddress) throw new Error("Market contract address is required");
  if (!uid)                   throw new Error("User UID is required");

  const signer   = await getSigner(uid);
  const calldata = encodePredict(isYes);

  // Convert QUAI float → wei BigInt (18 decimals)
  const weiValue = BigInt(Math.round(amountQuai * 1e18));

  console.log(
    `[contractService] predict(${isYes}) on ${marketContractAddress}` +
    ` — ${amountQuai} QUAI (${weiValue} wei)`
  );

  return sendTx(signer, marketContractAddress, calldata, weiValue);
}

/**
 * Call claimReward() on a Q4Market contract.
 * Only callable after the market is resolved and the user is on the winning side.
 *
 * @param {object} params
 * @param {string}  params.uid                  Firebase UID of the user.
 * @param {string}  params.marketContractAddress Address of the Q4Market contract.
 * @returns {Promise<{hash: string, receipt: object}>}
 */
export async function onChainClaimReward({ uid, marketContractAddress }) {
  if (!marketContractAddress) throw new Error("Market contract address is required");
  if (!uid)                   throw new Error("User UID is required");

  const signer   = await getSigner(uid);
  const calldata = encodeClaimReward();

  console.log(`[contractService] claimReward() on ${marketContractAddress}`);

  return sendTx(signer, marketContractAddress, calldata);
}

/**
 * Call withdrawRefund() on a Q4Market contract.
 * Only callable after the market has been cancelled.
 *
 * @param {object} params
 * @param {string}  params.uid                  Firebase UID of the user.
 * @param {string}  params.marketContractAddress Address of the Q4Market contract.
 * @returns {Promise<{hash: string, receipt: object}>}
 */
export async function onChainWithdrawRefund({ uid, marketContractAddress }) {
  if (!marketContractAddress) throw new Error("Market contract address is required");
  if (!uid)                   throw new Error("User UID is required");

  const signer   = await getSigner(uid);
  const calldata = encodeWithdrawRefund();

  console.log(`[contractService] withdrawRefund() on ${marketContractAddress}`);

  return sendTx(signer, marketContractAddress, calldata);
}
