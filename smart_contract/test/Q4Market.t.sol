// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Q4Market.sol";
import "../src/Q4MarketFactory.sol";

/**
 * @title  Q4MarketTest
 * @notice Comprehensive tests for Q4Market and Q4MarketFactory.
 *
 * Fee: 5 % of losing pool  (PROTOCOL_FEE_BPS = 500)
 *
 * Payout formula for a winner:
 *   net_lose  = losePool - (losePool * 500 / 10_000)  = losePool * 0.95
 *   payout    = stake + (stake / winPool) * net_lose
 */
contract Q4MarketTest is Test {

    Q4MarketFactory factory;
    Q4Market        market;

    address owner  = address(0x1);
    address oracle = address(0x2);
    address alice  = address(0x3);
    address bob    = address(0x4);
    address carol  = address(0x5);
    address dave   = address(0x6);

    uint256 deadline;
    uint256 marketId;

    /* ─── Helpers ──────────────────────────────────────────────────────── */

    /// @dev fee = 5 % of losePool; returns net lose pool (95 %)
    function netLose(uint256 losePool) internal pure returns (uint256) {
        return losePool - (losePool * 500) / 10_000;
    }

    /// @dev Expected payout for a winner with `stake` out of `winPool`,
    ///      given the losing side had `losePool`.
    function expectedPayout(
        uint256 stake,
        uint256 winPool,
        uint256 losePool
    ) internal pure returns (uint256) {
        return stake + (stake * netLose(losePool)) / winPool;
    }

    /* ─── setUp ─────────────────────────────────────────────────────────── */

    function setUp() public {
        vm.deal(alice, 100 ether);
        vm.deal(bob,   100 ether);
        vm.deal(carol, 100 ether);
        vm.deal(dave,  100 ether);

        vm.startPrank(owner);
        factory  = new Q4MarketFactory(oracle);
        deadline = block.timestamp + 1 days;
        (marketId, ) = factory.createMarket(
            "Will Bitcoin be above $100,000 today?",
            "Crypto",
            deadline
        );
        vm.stopPrank();

        market = Q4Market(payable(factory.getMarket(marketId)));
    }

    /* ═══════════════════════════════════════════════════════════════════════
       PREDICT — single stake
    ═══════════════════════════════════════════════════════════════════════ */

    function test_predict_yes() public {
        vm.prank(alice);
        market.predict{value: 1 ether}(true);

        (bool has, bool side, uint256 amt, bool claimed) = market.getPosition(alice);
        assertTrue(has);
        assertTrue(side);
        assertEq(amt, 1 ether);
        assertFalse(claimed);
        assertEq(market.yesPool(), 1 ether);
        assertEq(market.noPool(),  0);
    }

    function test_predict_no() public {
        vm.prank(bob);
        market.predict{value: 2 ether}(false);

        (, bool side, uint256 amt, ) = market.getPosition(bob);
        assertFalse(side);
        assertEq(amt, 2 ether);
        assertEq(market.noPool(), 2 ether);
    }

    function test_predict_reverts_zero_amount() public {
        vm.prank(alice);
        vm.expectRevert("Q4Market: zero amount");
        market.predict{value: 0}(true);
    }

    function test_predict_reverts_after_deadline() public {
        vm.warp(deadline + 1);
        vm.prank(alice);
        vm.expectRevert("Q4Market: deadline passed");
        market.predict{value: 1 ether}(true);
    }

    /* ═══════════════════════════════════════════════════════════════════════
       PREDICT — multiple positions (same side, locked)
    ═══════════════════════════════════════════════════════════════════════ */

    function test_predict_multiple_same_side_accumulates() public {
        vm.startPrank(alice);
        market.predict{value: 5 ether}(true);
        market.predict{value: 10 ether}(true);
        market.predict{value: 20 ether}(true);
        vm.stopPrank();

        (, , uint256 total, ) = market.getPosition(alice);
        assertEq(total, 35 ether);
        assertEq(market.yesPool(), 35 ether);

        // Participant list should only have one entry for alice.
        assertEq(market.getParticipants().length, 1);
    }

    function test_predict_reverts_wrong_side_after_lock() public {
        vm.startPrank(alice);
        market.predict{value: 5 ether}(true);   // locks YES

        vm.expectRevert("Q4Market: side locked");
        market.predict{value: 1 ether}(false);   // tries NO — must revert
        vm.stopPrank();
    }

    /* ═══════════════════════════════════════════════════════════════════════
       CLOSE
    ═══════════════════════════════════════════════════════════════════════ */

    function test_close_at_deadline() public {
        vm.warp(deadline);
        market.closeMarket();
        assertEq(uint(market.status()), uint(Q4Market.Status.Closed));
    }

    function test_close_reverts_before_deadline() public {
        vm.expectRevert("Q4Market: deadline not reached");
        market.closeMarket();
    }

    /* ═══════════════════════════════════════════════════════════════════════
       RESOLVE
    ═══════════════════════════════════════════════════════════════════════ */

    function test_resolve_yes() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 2 ether}(false);
        vm.warp(deadline);
        market.closeMarket();
        vm.prank(oracle);
        market.resolve(true);

        assertEq(uint(market.status()), uint(Q4Market.Status.Resolved));
        assertTrue(market.resolvedOutcome());
        // fee = 5 % of 2 ether = 0.1 ether
        assertEq(market.protocolFeesAccrued(), 0.1 ether);
    }

    function test_resolve_no() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 2 ether}(false);
        vm.warp(deadline);
        vm.prank(oracle);
        market.resolve(false);

        assertFalse(market.resolvedOutcome());
        // fee = 5 % of 1 ether = 0.05 ether
        assertEq(market.protocolFeesAccrued(), 0.05 ether);
    }

    function test_resolve_reverts_not_oracle() public {
        vm.warp(deadline);
        market.closeMarket();
        vm.prank(alice);
        vm.expectRevert("Q4Market: not oracle");
        market.resolve(true);
    }

    function test_resolve_directly_without_close() public {
        // Oracle can resolve directly after deadline without a separate closeMarket call.
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.warp(deadline);
        vm.prank(oracle);
        market.resolve(true);
        assertEq(uint(market.status()), uint(Q4Market.Status.Resolved));
    }

    /* ═══════════════════════════════════════════════════════════════════════
       CLAIM REWARD — single winner
    ═══════════════════════════════════════════════════════════════════════ */

    function test_claim_single_winner() public {
        // alice: 1 ETH YES, bob: 2 ETH NO  → YES wins
        // net_lose  = 2 - (2 * 5 %) = 1.9 ETH
        // alice payout = 1 + (1/1) * 1.9 = 2.9 ETH
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 2 ether}(false);
        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        uint256 before = alice.balance;
        vm.prank(alice);
        market.claimReward();

        assertApproxEqAbs(alice.balance - before, 2.9 ether, 1e12);
    }

    function test_claim_reverts_loser() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 2 ether}(false);
        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        vm.prank(bob);
        vm.expectRevert("Q4Market: wrong side");
        market.claimReward();
    }

    function test_claim_reverts_double_claim() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 2 ether}(false);
        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        vm.startPrank(alice);
        market.claimReward();
        vm.expectRevert("Q4Market: already claimed");
        market.claimReward();
        vm.stopPrank();
    }

    /* ═══════════════════════════════════════════════════════════════════════
       CLAIM REWARD — proportional split across multiple winners
    ═══════════════════════════════════════════════════════════════════════ */

    function test_proportional_payout_three_winners() public {
        // YES side: alice 30 ETH, carol 20 ETH, dave 10 ETH  → winPool = 60 ETH
        // NO  side: bob 40 ETH                               → losePool = 40 ETH
        // net_lose = 40 * 0.95 = 38 ETH
        // alice: 30 + (30/60)*38 = 30 + 19    = 49 ETH
        // carol: 20 + (20/60)*38 = 20 + 12.67 = 32.67 ETH
        // dave:  10 + (10/60)*38 = 10 + 6.33  = 16.33 ETH

        vm.prank(alice); market.predict{value: 30 ether}(true);
        vm.prank(carol); market.predict{value: 20 ether}(true);
        vm.prank(dave);  market.predict{value: 10 ether}(true);
        vm.prank(bob);   market.predict{value: 40 ether}(false);

        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        uint256 WIN  = 60 ether;
        uint256 LOSE = 40 ether;

        // Alice
        uint256 ab = alice.balance;
        vm.prank(alice); market.claimReward();
        assertApproxEqAbs(alice.balance - ab, expectedPayout(30 ether, WIN, LOSE), 1e12);

        // Carol
        uint256 cb = carol.balance;
        vm.prank(carol); market.claimReward();
        assertApproxEqAbs(carol.balance - cb, expectedPayout(20 ether, WIN, LOSE), 1e12);

        // Dave
        uint256 db = dave.balance;
        vm.prank(dave); market.claimReward();
        assertApproxEqAbs(dave.balance - db, expectedPayout(10 ether, WIN, LOSE), 1e12);
    }

    function test_proportional_payout_multiple_positions_per_user() public {
        // alice opens 3 positions: 5 + 10 + 20 = 35 ETH YES
        // bob stakes 40 ETH NO
        vm.startPrank(alice);
        market.predict{value:  5 ether}(true);
        market.predict{value: 10 ether}(true);
        market.predict{value: 20 ether}(true);
        vm.stopPrank();
        vm.prank(bob); market.predict{value: 40 ether}(false);

        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        // winPool = 35, losePool = 40, net_lose = 38
        // alice payout = 35 + (35/35)*38 = 73 ETH
        uint256 ab = alice.balance;
        vm.prank(alice); market.claimReward();
        assertApproxEqAbs(alice.balance - ab, expectedPayout(35 ether, 35 ether, 40 ether), 1e12);
    }

    /* ═══════════════════════════════════════════════════════════════════════
       PENDING REWARD VIEW
    ═══════════════════════════════════════════════════════════════════════ */

    function test_pending_reward_correct() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 2 ether}(false);
        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        assertApproxEqAbs(market.pendingReward(alice), 2.9 ether, 1e12);
        assertEq(market.pendingReward(bob), 0);
    }

    function test_pending_reward_zero_before_resolve() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        assertEq(market.pendingReward(alice), 0);
    }

    /* ═══════════════════════════════════════════════════════════════════════
       PROTOCOL FEES
    ═══════════════════════════════════════════════════════════════════════ */

    function test_protocol_fee_5_percent() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 4 ether}(false);
        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);
        // fee = 5 % of 4 ether = 0.2 ether
        assertEq(market.protocolFeesAccrued(), 0.2 ether);
    }

    function test_withdraw_fees_to_factory() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 4 ether}(false);
        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        uint256 ownerBefore = owner.balance;
        vm.prank(owner);
        factory.collectFees(marketId);
        // Owner should receive 0.2 ether
        assertApproxEqAbs(owner.balance - ownerBefore, 0.2 ether, 1e12);
        assertEq(market.protocolFeesAccrued(), 0);
    }

    function test_withdraw_fees_reverts_not_factory() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 4 ether}(false);
        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        vm.prank(alice);
        vm.expectRevert("Q4Market: not factory");
        market.withdrawFees();
    }

    /* ═══════════════════════════════════════════════════════════════════════
       CANCEL + REFUND
    ═══════════════════════════════════════════════════════════════════════ */

    function test_cancel_records_refunds() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 2 ether}(false);

        vm.prank(oracle);
        market.cancelMarket();

        assertEq(uint(market.status()), uint(Q4Market.Status.Cancelled));
        assertEq(market.pendingRefund(alice), 1 ether);
        assertEq(market.pendingRefund(bob),   2 ether);
    }

    function test_cancel_withdraw_refund() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(bob);   market.predict{value: 2 ether}(false);

        vm.prank(oracle); market.cancelMarket();

        uint256 ab = alice.balance;
        vm.prank(alice); market.withdrawRefund();
        assertEq(alice.balance - ab, 1 ether);
        assertEq(market.pendingRefund(alice), 0);

        uint256 bb = bob.balance;
        vm.prank(bob); market.withdrawRefund();
        assertEq(bob.balance - bb, 2 ether);
        assertEq(market.pendingRefund(bob), 0);
    }

    function test_cancel_refund_includes_multiple_positions() public {
        // Alice staked 3 times before cancel
        vm.startPrank(alice);
        market.predict{value: 5 ether}(true);
        market.predict{value: 5 ether}(true);
        market.predict{value: 5 ether}(true);
        vm.stopPrank();

        vm.prank(oracle); market.cancelMarket();
        assertEq(market.pendingRefund(alice), 15 ether);

        uint256 ab = alice.balance;
        vm.prank(alice); market.withdrawRefund();
        assertEq(alice.balance - ab, 15 ether);
    }

    function test_cancel_double_withdraw_reverts() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(oracle); market.cancelMarket();

        vm.prank(alice); market.withdrawRefund();
        vm.prank(alice);
        vm.expectRevert("Q4Market: no refund");
        market.withdrawRefund();
    }

    function test_cancel_reverts_not_oracle() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(alice);
        vm.expectRevert("Q4Market: not oracle");
        market.cancelMarket();
    }

    function test_cancel_reverts_after_resolve() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        vm.prank(oracle);
        vm.expectRevert("Q4Market: cannot cancel");
        market.cancelMarket();
    }

    /* ═══════════════════════════════════════════════════════════════════════
       FACTORY
    ═══════════════════════════════════════════════════════════════════════ */

    function test_factory_market_count() public {
        assertEq(factory.marketCount(), 1);
        assertEq(factory.getAllMarkets().length, 1);
    }

    function test_factory_create_multiple() public {
        vm.startPrank(owner);
        factory.createMarket("Will ETH > $3,000?", "Crypto", block.timestamp + 2 hours);
        factory.createMarket("Will Apple close higher today?", "Stocks", block.timestamp + 8 hours);
        vm.stopPrank();

        assertEq(factory.marketCount(), 3);
        assertEq(factory.getAllMarkets().length, 3);
    }

    function test_factory_create_reverts_unauthorized() public {
        vm.prank(alice);
        vm.expectRevert("Q4Factory: not authorized");
        factory.createMarket("test?", "Crypto", block.timestamp + 1 hours);
    }

    function test_factory_oracle_can_create() public {
        vm.prank(oracle);
        factory.createMarket("Will BTC hold above $60K?", "Crypto", block.timestamp + 3 hours);
        assertEq(factory.marketCount(), 2);
    }

    function test_factory_resolve_market() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.warp(deadline);
        vm.prank(owner);
        factory.resolveMarket(marketId, true);
        assertEq(uint(market.status()), uint(Q4Market.Status.Resolved));
        assertTrue(market.resolvedOutcome());
    }

    function test_factory_cancel_market() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(owner);
        factory.cancelMarket(marketId);
        assertEq(uint(market.status()), uint(Q4Market.Status.Cancelled));
    }

    function test_factory_set_oracle() public {
        address newOracle = address(0x99);
        vm.prank(owner);
        factory.setOracle(newOracle);
        assertEq(factory.oracle(), newOracle);
    }

    function test_factory_transfer_ownership() public {
        vm.prank(owner);
        factory.transferOwnership(alice);
        assertEq(factory.owner(), alice);

        // Old owner can no longer call owner-only functions
        vm.prank(owner);
        vm.expectRevert("Q4Factory: not owner");
        factory.setOracle(address(0x99));
    }

    function test_factory_get_market_info() public {
        (
            string memory q,
            ,
            uint256 dl,
            Q4Market.Status st,
            ,,,
        ) = factory.getMarketInfo(marketId);
        assertEq(q, "Will Bitcoin be above $100,000 today?");
        assertEq(dl, deadline);
        assertEq(uint(st), uint(Q4Market.Status.Active));
    }

    /* ═══════════════════════════════════════════════════════════════════════
       TOTAL POOL
    ═══════════════════════════════════════════════════════════════════════ */

    function test_total_pool() public {
        vm.prank(alice); market.predict{value: 3 ether}(true);
        vm.prank(bob);   market.predict{value: 7 ether}(false);
        assertEq(market.totalPool(), 10 ether);
    }

    /* ═══════════════════════════════════════════════════════════════════════
       EDGE CASES
    ═══════════════════════════════════════════════════════════════════════ */

    function test_no_losing_pool_sole_winner() public {
        // Only one side — entire pool wins (no losers), payout = stake.
        vm.prank(alice); market.predict{value: 5 ether}(true);
        vm.warp(deadline);
        vm.prank(oracle); market.resolve(true);

        // losePool = 0, net_lose = 0, payout = 5 ETH
        uint256 ab = alice.balance;
        vm.prank(alice); market.claimReward();
        assertEq(alice.balance - ab, 5 ether);
    }

    function test_participants_count() public {
        vm.prank(alice); market.predict{value: 1 ether}(true);
        vm.prank(alice); market.predict{value: 2 ether}(true); // second stake, same user
        vm.prank(bob);   market.predict{value: 1 ether}(false);

        assertEq(market.getParticipants().length, 2); // alice + bob, not 3
    }
}
