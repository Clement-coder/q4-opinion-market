/**
 * src/data/stats.js
 * User dashboard stats.
 * Replace with real Supabase / on-chain queries in src/hooks/useUserStats.js
 */

export const USER_STATS = {
  todayAnswered:    7,
  todayTotal:       10,
  totalStaked:      85.4,
  potentialRewards: 24.8,
  accuracy:         68,
  marketsWon:       32,
  marketsTotal:     47,
  weeklyPnl:        +18.6,
  allTimeEarned:    246.2,
  switchRemaining:  1,
};

/** Sparkline data — last 7 markets staked % of yes pool */
export const PORTFOLIO_BARS = [42, 68, 55, 80, 47, 91, 74];

/** Bar labels */
export const PORTFOLIO_BAR_LABELS = ["M1", "M2", "M3", "M4", "M5", "M6", "M7"];
