// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  Q4Market
 * @notice Individual prediction market for the Q4 Opinion Market protocol.
 *
 * ── Rules ──────────────────────────────────────────────────────────────────
 *  • Users stake QUAI on YES or NO.
 *  • A user may open MULTIPLE positions on the SAME market.
 *  • Once a user has staked, their chosen side (YES/NO) is permanently locked —
 *    all future positions from that address must be on the same side.
 *  • When the market resolves:
 *      – Losers forfeit their entire stake.
 *      – 5% platform fee is taken from the losing pool.
 *      – The remaining 95% is distributed proportionally to winners,
 *        based on each winner's share of the total winning pool.
 *      – Winners also receive their original stakes back.
 *  • If the market is cancelled, all stakers receive a full refund (pull pattern).
 *
 * ── Security ───────────────────────────────────────────────────────────────
 *  • Checks-Effects-Interactions pattern throughout.
 *  • Custom reentrancy guard (no external dependencies).
 *  • Pull-payment for refunds and rewards — no unbounded push loops.
 *  • Solidity 0.8 built-in overflow/underflow protection.
 */
contract Q4Market {

    /* ─── Enums ──────────────────────────────────────────────────────────── */
    enum Status { Active, Closed, Resolved, Cancelled }

    /* ─── Structs ────────────────────────────────────────────────────────── */

    /**
     * @notice Aggregated position per address.
     *         Multiple predict() calls accumulate into totalAmount.
     *         Side is locked after the very first call.
     */
    struct Position {
        bool    exists;       // true after the first stake
        bool    side;         // true = YES | false = NO  (locked on first stake)
        uint256 totalAmount;  // cumulative stake from this address
        bool    claimed;      // true after claimReward() or withdrawRefund()
    }

    /* ─── Constants ──────────────────────────────────────────────────────── */
    /// @notice 5 % platform fee taken from the losing pool on resolution.
    uint256 public constant PROTOCOL_FEE_BPS = 500;    // 500 / 10_000 = 5 %
    uint256 public constant BPS_DENOM        = 10_000;

    /* ─── Immutables ─────────────────────────────────────────────────────── */
    address public immutable factory;

    /* ─── Storage ────────────────────────────────────────────────────────── */
    address public oracle;

    string  public question;
    string  public category;
    uint256 public deadline;

    Status  public status;
    bool    public resolvedOutcome;

    uint256 public yesPool;
    uint256 public noPool;
    uint256 public protocolFeesAccrued;

    mapping(address => Position) private _positions;
    address[] private _participants;  // unique addresses, one entry per user

    /// @dev Pull-refund ledger — populated by cancelMarket(), consumed by withdrawRefund().
    mapping(address => uint256) private _refunds;

    bool private _locked; // reentrancy guard

    /* ─── Events ─────────────────────────────────────────────────────────── */
    event PositionOpened(address indexed user, bool side, uint256 amount, uint256 newTotal);
    event MarketClosed();
    event MarketResolved(bool outcome, uint256 winPool, uint256 losePool, uint256 fee);
    event RewardClaimed(address indexed user, uint256 reward);
    event MarketCancelled();
    event RefundWithdrawn(address indexed user, uint256 amount);
    event FeesWithdrawn(uint256 amount);
    event OracleUpdated(address newOracle);

    /* ─── Modifiers ──────────────────────────────────────────────────────── */
    modifier nonReentrant() {
        require(!_locked, "Q4Market: reentrant");
        _locked = true;
        _;
        _locked = false;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle || msg.sender == factory, "Q4Market: not oracle");
        _;
    }

    modifier onlyActive() {
        require(status == Status.Active, "Q4Market: not active");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Q4Market: not factory");
        _;
    }

    /* ─── Constructor ────────────────────────────────────────────────────── */
    constructor(
        string memory _question,
        string memory _category,
        uint256       _deadline,
        address       _oracle,
        address       _factory
    ) {
        require(bytes(_question).length > 0,  "Q4Market: empty question");
        require(_deadline > block.timestamp,   "Q4Market: deadline in past");
        require(_oracle  != address(0),        "Q4Market: zero oracle");
        require(_factory != address(0),        "Q4Market: zero factory");

        question = _question;
        category = _category;
        deadline = _deadline;
        oracle   = _oracle;
        factory  = _factory;
        status   = Status.Active;
    }

    /* ─── User actions ───────────────────────────────────────────────────── */

    /**
     * @notice Open (or add to) a position on YES or NO.
     *
     *         First call:       Records the side and pushes the user to _participants.
     *         Subsequent calls: Must pass the SAME side — the answer is locked.
     *                           Adds msg.value to the existing position.
     *
     * @param isYes  true = stake on YES, false = stake on NO.
     */
    function predict(bool isYes) external payable nonReentrant onlyActive {
        require(block.timestamp < deadline, "Q4Market: deadline passed");
        require(msg.value > 0,              "Q4Market: zero amount");

        Position storage pos = _positions[msg.sender];

        if (!pos.exists) {
            // First stake — lock the side, register participant.
            pos.exists      = true;
            pos.side        = isYes;
            pos.totalAmount = msg.value;
            _participants.push(msg.sender);
        } else {
            // Additional stake — enforce the locked side.
            require(pos.side == isYes, "Q4Market: side locked");
            pos.totalAmount += msg.value;
        }

        if (isYes) yesPool += msg.value;
        else       noPool  += msg.value;

        emit PositionOpened(msg.sender, isYes, msg.value, pos.totalAmount);
    }

    /* ─── Market lifecycle ───────────────────────────────────────────────── */

    /**
     * @notice Close the market once the deadline has passed.
     *         Permissionless — anyone may call this.
     */
    function closeMarket() external onlyActive {
        require(block.timestamp >= deadline, "Q4Market: deadline not reached");
        status = Status.Closed;
        emit MarketClosed();
    }

    /**
     * @notice Resolve the market YES (true) or NO (false).
     *         May be called directly after the deadline — auto-closes if still Active.
     *         Only callable by oracle or factory.
     */
    function resolve(bool outcome) external nonReentrant onlyOracle {
        require(
            status == Status.Active || status == Status.Closed,
            "Q4Market: cannot resolve"
        );
        if (status == Status.Active) {
            require(block.timestamp >= deadline, "Q4Market: deadline not reached");
            status = Status.Closed;
            emit MarketClosed();
        }

        status          = Status.Resolved;
        resolvedOutcome = outcome;

        uint256 losePool = outcome ? noPool : yesPool;
        uint256 fee      = (losePool * PROTOCOL_FEE_BPS) / BPS_DENOM;
        protocolFeesAccrued += fee;

        emit MarketResolved(outcome, outcome ? yesPool : noPool, losePool, fee);
    }

    /**
     * @notice Cancel the market (data source unavailable, bad question, etc.).
     *         Records every participant's refund (pull pattern).
     *         Users then call withdrawRefund() to collect their QUAI.
     *         Only callable by oracle or factory.
     */
    function cancelMarket() external nonReentrant onlyOracle {
        require(
            status == Status.Active || status == Status.Closed,
            "Q4Market: cannot cancel"
        );
        status = Status.Cancelled;

        uint256 len = _participants.length;
        for (uint256 i = 0; i < len; ) {
            address p = _participants[i];
            Position storage pos = _positions[p];
            if (pos.exists && !pos.claimed && pos.totalAmount > 0) {
                _refunds[p] += pos.totalAmount;
                pos.claimed  = true; // prevent double-credit
            }
            unchecked { ++i; }
        }

        emit MarketCancelled();
    }

    /**
     * @notice Claim the payout for a winning position.
     *
     *         Payout formula:
     *           net_lose  = losing_pool × 0.95  (after 5 % fee)
     *           payout    = totalAmount + (totalAmount / winPool) × net_lose
     */
    function claimReward() external nonReentrant {
        require(status == Status.Resolved,          "Q4Market: not resolved");

        Position storage pos = _positions[msg.sender];
        require(pos.exists,                          "Q4Market: no position");
        require(!pos.claimed,                        "Q4Market: already claimed");
        require(pos.side == resolvedOutcome,         "Q4Market: wrong side");

        uint256 winPool  = resolvedOutcome ? yesPool : noPool;
        uint256 losePool = resolvedOutcome ? noPool  : yesPool;
        require(winPool > 0, "Q4Market: empty win pool");

        uint256 netLose = losePool - (losePool * PROTOCOL_FEE_BPS) / BPS_DENOM;
        uint256 share   = (pos.totalAmount * netLose) / winPool;
        uint256 payout  = pos.totalAmount + share;

        // Effects before interactions.
        pos.claimed = true;

        (bool ok, ) = payable(msg.sender).call{value: payout}("");
        require(ok, "Q4Market: transfer failed");

        emit RewardClaimed(msg.sender, payout);
    }

    /**
     * @notice Withdraw a refund after the market has been cancelled.
     *         Each user calls this individually (pull pattern — no admin push).
     */
    function withdrawRefund() external nonReentrant {
        require(status == Status.Cancelled, "Q4Market: not cancelled");

        uint256 amount = _refunds[msg.sender];
        require(amount > 0, "Q4Market: no refund");

        // Effects before interactions.
        _refunds[msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Q4Market: refund failed");

        emit RefundWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Withdraw accrued protocol fees to the factory.
     *         Only the factory may call this; factory forwards to owner.
     */
    function withdrawFees() external nonReentrant onlyFactory {
        uint256 fees = protocolFeesAccrued;
        require(fees > 0, "Q4Market: no fees");
        protocolFeesAccrued = 0;
        (bool ok, ) = payable(factory).call{value: fees}("");
        require(ok, "Q4Market: fee transfer failed");
        emit FeesWithdrawn(fees);
    }

    /* ─── Admin ──────────────────────────────────────────────────────────── */

    /// @notice Update the oracle address. Only callable by factory.
    function setOracle(address newOracle) external onlyFactory {
        require(newOracle != address(0), "Q4Market: zero oracle");
        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }

    /* ─── Views ──────────────────────────────────────────────────────────── */

    /// @notice Returns the aggregated position for a given address.
    function getPosition(address user) external view returns (
        bool    hasPosition,
        bool    side,
        uint256 totalAmount,
        bool    claimed
    ) {
        Position storage pos = _positions[user];
        return (pos.exists, pos.side, pos.totalAmount, pos.claimed);
    }

    /// @notice Full market metadata in one call.
    function getMarketInfo() external view returns (
        string memory _question,
        string memory _category,
        uint256       _deadline,
        Status        _status,
        bool          _resolvedOutcome,
        uint256       _yesPool,
        uint256       _noPool,
        uint256       _participantCount
    ) {
        return (
            question, category, deadline, status,
            resolvedOutcome, yesPool, noPool, _participants.length
        );
    }

    /// @notice All unique participant addresses.
    function getParticipants() external view returns (address[] memory) {
        return _participants;
    }

    /// @notice Combined pool size.
    function totalPool() external view returns (uint256) {
        return yesPool + noPool;
    }

    /// @notice Pending refund amount for a cancelled market.
    function pendingRefund(address user) external view returns (uint256) {
        return _refunds[user];
    }

    /**
     * @notice Estimated payout for a winning user if they claimed right now.
     *         Returns 0 if the market is not resolved, the user is on the
     *         losing side, or the user has already claimed.
     */
    function pendingReward(address user) external view returns (uint256) {
        if (status != Status.Resolved) return 0;
        Position storage pos = _positions[user];
        if (!pos.exists || pos.claimed || pos.side != resolvedOutcome) return 0;

        uint256 winPool  = resolvedOutcome ? yesPool : noPool;
        uint256 losePool = resolvedOutcome ? noPool  : yesPool;
        if (winPool == 0) return 0;

        uint256 netLose = losePool - (losePool * PROTOCOL_FEE_BPS) / BPS_DENOM;
        return pos.totalAmount + (pos.totalAmount * netLose) / winPool;
    }

    /* ─── Receive ────────────────────────────────────────────────────────── */
    receive() external payable {}
}
