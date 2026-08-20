// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Q4MarketFactory.sol";

/**
 * @title  Deploy
 * @notice Deployment script for Q4MarketFactory on Quai Network.
 *
 * ── Required environment variables ──────────────────────────────────────────
 *   PRIVATE_KEY      — deployer wallet private key (hex, no 0x prefix)
 *   ORACLE_ADDRESS   — address of the oracle wallet (Supabase edge function)
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   forge script script/Deploy.s.sol \
 *     --rpc-url $RPC_URL \
 *     --broadcast \
 *     --verify          (optional — only if block explorer supports it)
 *
 * ── What this deploys ────────────────────────────────────────────────────────
 *   1. Q4MarketFactory   — owner = deployer, oracle = $ORACLE_ADDRESS
 *   2. One sample market — "Will Bitcoin be above $100,000 at 11:59 PM today?"
 *      (deadline = 24 hours from deploy time)
 *
 * The sample market is optional for production. Remove it after testing.
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerKey   = vm.envUint("PRIVATE_KEY");
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");

        vm.startBroadcast(deployerKey);

        /* 1. Deploy factory */
        Q4MarketFactory factory = new Q4MarketFactory(oracleAddress);
        console.log("Q4MarketFactory deployed at:", address(factory));
        console.log("Owner  :", factory.owner());
        console.log("Oracle :", factory.oracle());

        /* 2. Deploy one sample market (24-hour deadline) */
        uint256 sampleDeadline = block.timestamp + 24 hours;
        (uint256 id, address mkt) = factory.createMarket(
            "Will Bitcoin be above $100,000 at 11:59 PM today?",
            "Crypto",
            sampleDeadline
        );
        console.log("Sample market ID      :", id);
        console.log("Sample market address :", mkt);
        console.log("Sample market deadline:", sampleDeadline);

        vm.stopBroadcast();
    }
}
