// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Q4MarketFactory.sol";

/**
 * @title  Deploy
 * @notice Deploys Q4MarketFactory on Quai Network mainnet (Cyprus-1).
 *
 * Required env vars (smart_contract/.env):
 *   PRIVATE_KEY      — deployer hex private key, no 0x prefix
 *   ORACLE_ADDRESS   — oracle wallet that Supabase edge functions use
 *
 * Run:
 *   source .env && forge script script/Deploy.s.sol \
 *     --rpc-url $RPC_URL \
 *     --broadcast \
 *     -vvvv
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerKey   = vm.envUint("PRIVATE_KEY");
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");

        vm.startBroadcast(deployerKey);

        Q4MarketFactory factory = new Q4MarketFactory(oracleAddress);

        console.log("========================================");
        console.log("  Q4MarketFactory deployed on Quai mainnet");
        console.log("  Address :", address(factory));
        console.log("  Owner   :", factory.owner());
        console.log("  Oracle  :", factory.oracle());
        console.log("========================================");

        vm.stopBroadcast();
    }
}
