// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Q4Market.sol";

/**
 * @title  Q4MarketFactory
 * @notice Deploys and administers Q4Market instances.
 *
 * ── Roles ───────────────────────────────────────────────────────────────────
 *  owner  — deploys factory, manages oracle address, collects fees,
 *            transfers ownership.
 *  oracle — automated resolver (Supabase edge function wallet).
 *           Can create markets and resolve/cancel them.
 *
 * ── Fee collection ──────────────────────────────────────────────────────────
 *  Each market accrues 5 % of the losing pool as protocol fees on resolution.
 *  The owner calls collectFees(marketId) to pull fees from a specific market,
 *  or withdrawFees() to sweep any ETH that has already been forwarded here.
 */
contract Q4MarketFactory {

    /* ─── State ──────────────────────────────────────────────────────────── */
    address public owner;
    address public oracle;

    uint256 public marketCount;
    mapping(uint256 => address) public markets;
    address[] private _marketList;

    bool private _locked;

    /* ─── Events ─────────────────────────────────────────────────────────── */
    event MarketCreated(
        uint256 indexed marketId,
        address indexed market,
        string  question,
        string  category,
        uint256 deadline
    );
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event MarketCancelled(uint256 indexed marketId);
    event FeesCollected(uint256 indexed marketId, uint256 amount);
    event FeesWithdrawn(uint256 amount);
    event OracleUpdated(address indexed newOracle);
    event OwnershipTransferred(address indexed newOwner);

    /* ─── Modifiers ──────────────────────────────────────────────────────── */
    modifier onlyOwner() {
        require(msg.sender == owner, "Q4Factory: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == oracle, "Q4Factory: not authorized");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Q4Factory: reentrant");
        _locked = true;
        _;
        _locked = false;
    }

    /* ─── Constructor ────────────────────────────────────────────────────── */
    constructor(address _oracle) {
        require(_oracle != address(0), "Q4Factory: zero oracle");
        owner  = msg.sender;
        oracle = _oracle;
    }

    /* ─── Market creation ────────────────────────────────────────────────── */

    /**
     * @notice Deploy a new Q4Market and register it in the factory.
     * @param question  Prediction question text.
     * @param category  "Crypto" | "Sports" | "Weather" | "Stocks"
     * @param deadline  Unix timestamp when predictions close.
     * @return marketId  Sequential zero-based ID.
     * @return market    Address of the newly deployed Q4Market.
     */
    function createMarket(
        string calldata question,
        string calldata category,
        uint256         deadline
    ) external onlyAuthorized returns (uint256 marketId, address market) {
        require(bytes(question).length > 0, "Q4Factory: empty question");
        require(deadline > block.timestamp,  "Q4Factory: deadline in past");

        Q4Market newMarket = new Q4Market(
            question,
            category,
            deadline,
            oracle,
            address(this)
        );

        marketId = marketCount;
        markets[marketId] = address(newMarket);
        _marketList.push(address(newMarket));
        unchecked { marketCount++; }

        market = address(newMarket);

        emit MarketCreated(marketId, market, question, category, deadline);
    }

    /* ─── Market management ──────────────────────────────────────────────── */

    /**
     * @notice Permissionless close — passes through to Q4Market.closeMarket().
     *         Anyone may call once the deadline has passed.
     */
    function closeMarket(uint256 marketId) external {
        Q4Market(payable(_requireMarket(marketId))).closeMarket();
    }

    /**
     * @notice Resolve a market with a YES/NO outcome.
     *         Only owner or oracle may call.
     */
    function resolveMarket(uint256 marketId, bool outcome) external onlyAuthorized {
        Q4Market(payable(_requireMarket(marketId))).resolve(outcome);
        emit MarketResolved(marketId, outcome);
    }

    /**
     * @notice Cancel a market (e.g. data source failed, bad question).
     *         Triggers the pull-refund mechanism inside Q4Market.
     *         Only owner or oracle may call.
     */
    function cancelMarket(uint256 marketId) external onlyAuthorized {
        Q4Market(payable(_requireMarket(marketId))).cancelMarket();
        emit MarketCancelled(marketId);
    }

    /* ─── Fee management ─────────────────────────────────────────────────── */

    /**
     * @notice Pull protocol fees from a specific resolved market into this contract,
     *         then forward them immediately to the owner.
     */
    function collectFees(uint256 marketId) external nonReentrant onlyOwner {
        Q4Market(payable(_requireMarket(marketId))).withdrawFees();
        emit FeesCollected(marketId, address(this).balance);
        _forwardToOwner();
    }

    /**
     * @notice Sweep any ETH balance in this contract to the owner.
     *         Called automatically by collectFees; also callable independently
     *         in case fees were pushed here by other means.
     */
    function withdrawFees() external nonReentrant onlyOwner {
        _forwardToOwner();
    }

    /* ─── Oracle & ownership ─────────────────────────────────────────────── */

    /// @notice Update the global oracle address.
    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Q4Factory: zero oracle");
        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }

    /// @notice Push an oracle update to a specific market.
    function updateMarketOracle(uint256 marketId, address newOracle) external onlyOwner {
        Q4Market(payable(_requireMarket(marketId))).setOracle(newOracle);
    }

    /// @notice Transfer factory ownership to a new address.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Q4Factory: zero owner");
        owner = newOwner;
        emit OwnershipTransferred(newOwner);
    }

    /* ─── Views ──────────────────────────────────────────────────────────── */

    /// @notice Address of a market by its ID. Reverts if not found.
    function getMarket(uint256 marketId) external view returns (address) {
        return _requireMarket(marketId);
    }

    /// @notice All deployed market addresses in creation order.
    function getAllMarkets() external view returns (address[] memory) {
        return _marketList;
    }

    /**
     * @notice Full metadata for a market — convenience wrapper around
     *         Q4Market.getMarketInfo().
     */
    function getMarketInfo(uint256 marketId) external view returns (
        string memory question,
        string memory category,
        uint256 deadline,
        Q4Market.Status mStatus,
        bool resolvedOutcome,
        uint256 yesPool,
        uint256 noPool,
        uint256 participantCount
    ) {
        return Q4Market(payable(_requireMarket(marketId))).getMarketInfo();
    }

    /* ─── Internals ──────────────────────────────────────────────────────── */

    function _requireMarket(uint256 marketId) internal view returns (address m) {
        m = markets[marketId];
        require(m != address(0), "Q4Factory: market not found");
    }

    function _forwardToOwner() internal {
        uint256 bal = address(this).balance;
        if (bal == 0) return;
        (bool ok, ) = payable(owner).call{value: bal}("");
        require(ok, "Q4Factory: transfer failed");
        emit FeesWithdrawn(bal);
    }

    receive() external payable {}
}
