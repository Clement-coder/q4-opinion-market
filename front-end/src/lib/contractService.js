/**
 * contractService.js
 * High-level contract interaction layer for Q4.
 *
 * Key design decisions:
 * ─────────────────────
 * • Wallet derivation is handled exclusively by blippay.js (getOrCreateWallet).
 *   This guarantees the on-chain signing address always matches the address
 *   shown in the UI and stored in the wallet balance display.
 *
 * • contractService never derives its own keys — doing so with a different
 *   algorithm (the old v1/SHA-256 path) produced a different address from
 *   blippay's v2/HKDF path, causing staked funds to arrive from an unknown
 *   address that the user could never recover from.
 *
 * • All on-chain writes use quais.js Wallet.sendTransaction() which handles
 *   Quai's protobuf transaction encoding and zone-aware signing automatically.
 *
 * • Read-only calls use the hand-rolled ABI encoder/decoder in contracts.js
 *   via quai_call (Quai-specific RPC method, not eth_call).
 *
 * Flow for every write:
 *   1. Retrieve the user's wallet (derived + cached by blippay.getOrCreateWallet).
 *   2. Connect it to a JsonRpcProvider for Cyprus-1.
 *   3. Call signer.sendTransaction({ to, data, value }) — quais auto-populates
 *      nonce, gasPrice, chainId, and serialises with protobuf.
 *   4. Await tx.wait(1) for one confirmation.
 */

import { quais }          from "quais";
import { getOrCreateWallet } from "../services/blippay";
import {
  QUAI_RPC,
  ethCall,
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

// ─── Signer ───────────────────────────────────────────────────────────────────

/**
 * Get a quais Wallet connected to the Cyprus-1 provider for a given Firebase UID.
 * Uses blippay.getOrCreateWallet so the signing address is ALWAYS the same
 * address shown in the wallet UI and stored on-chain.
 *
 * @param {string} uid  Firebase UID
 * @returns {Promise<quais.Wallet>}
 */
async function getSigner(uid) {
  const { wallet } = await getOrCreateWallet(uid);
  return wallet.connect(getProvider());
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch the on-chain position for a user on a specific Q4Market contract.
 *
 * @param {string} marketContractAddress  Q4Market contract address.
 * @param {string} userWalletAddress      User's Quai wallet address.
 * @returns {Promise<{hasPosition:boolean, side:boolean, totalAmount:bigint, claimed:boolean}>}
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
 * Send a signed transaction via quais.js.
 * quais.Wallet.sendTransaction handles:
 *   • auto-populating nonce, gasPrice, chainId
 *   • Quai's protobuf (QuaiTransaction) serialisation
 *   • zone-aware address validation
 *
 * @param {quais.Wallet} signer   Connected quais Wallet (must have provider).
 * @param {string}       to       Contract address.
 * @param {string}       data     Hex calldata string with 0x prefix.
 * @param {bigint}       [value]  QUAI value in wei to send with the call.
 * @returns {Promise<{hash:string, receipt:object}>}
 */
async function sendTx(signer, to, data, value = 0n) {
  const txReq = { to, data, value };
  // sendTransaction auto-populates: nonce, gasPrice, chainId, type
  const tx      = await signer.sendTransaction(txReq);
  console.log(`[contractService] tx sent: ${tx.hash}`);
  const receipt = await tx.wait(1);
  return { hash: tx.hash, receipt };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Call predict(isYes) on a Q4Market contract.
 *
 * IMPORTANT: The contract uses QUAI as the staking token (msg.value).
 * amountQuai must be the QUAI equivalent of the user's intended USDT stake.
 * The DashboardPage converts USDT → QUAI using the live QUAI/USD price before
 * calling this function.
 *
 * @param {object} params
 * @param {string}  params.uid                   Firebase UID.
 * @param {string}  params.marketContractAddress  Q4Market contract address.
 * @param {boolean} params.isYes                  true = YES, false = NO.
 * @param {number}  params.amountQuai             Stake in QUAI (float, e.g. 12.5).
 * @returns {Promise<{hash:string, receipt:object}>}
 */
export async function onChainPredict({ uid, marketContractAddress, isYes, amountQuai }) {
  if (!marketContractAddress) throw new Error("Market has no on-chain contract address.");
  if (!uid)                   throw new Error("User UID is required.");
  if (!amountQuai || amountQuai <= 0) throw new Error("Stake amount must be greater than zero.");

  const signer   = await getSigner(uid);
  const calldata = encodePredict(isYes);

  // Convert QUAI float → wei BigInt (18 decimals)
  // Use Math.floor to avoid floating-point precision issues
  const weiValue = BigInt(Math.floor(amountQuai * 1e18));

  console.log(
    `[contractService] predict(${isYes}) — ${amountQuai} QUAI (${weiValue} wei)` +
    ` on ${marketContractAddress} from ${signer.address}`
  );

  return sendTx(signer, marketContractAddress, calldata, weiValue);
}

/**
 * Call claimReward() on a Q4Market contract.
 * Only callable after the market is resolved and the user is on the winning side.
 *
 * @param {object} params
 * @param {string}  params.uid                   Firebase UID.
 * @param {string}  params.marketContractAddress  Q4Market contract address.
 * @returns {Promise<{hash:string, receipt:object}>}
 */
export async function onChainClaimReward({ uid, marketContractAddress }) {
  if (!marketContractAddress) throw new Error("Market has no on-chain contract address.");
  if (!uid)                   throw new Error("User UID is required.");

  const signer   = await getSigner(uid);
  const calldata = encodeClaimReward();

  console.log(`[contractService] claimReward() on ${marketContractAddress} from ${signer.address}`);

  return sendTx(signer, marketContractAddress, calldata);
}

/**
 * Call withdrawRefund() on a Q4Market contract.
 * Only callable after the market has been cancelled.
 *
 * @param {object} params
 * @param {string}  params.uid                   Firebase UID.
 * @param {string}  params.marketContractAddress  Q4Market contract address.
 * @returns {Promise<{hash:string, receipt:object}>}
 */
export async function onChainWithdrawRefund({ uid, marketContractAddress }) {
  if (!marketContractAddress) throw new Error("Market has no on-chain contract address.");
  if (!uid)                   throw new Error("User UID is required.");

  const signer   = await getSigner(uid);
  const calldata = encodeWithdrawRefund();

  console.log(`[contractService] withdrawRefund() on ${marketContractAddress} from ${signer.address}`);

  return sendTx(signer, marketContractAddress, calldata);
}
