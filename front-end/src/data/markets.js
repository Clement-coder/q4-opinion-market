/**
 * src/data/markets.js
 * All market/prediction data in one place.
 * When you connect to Supabase or a smart contract indexer,
 * replace these arrays with API calls in src/hooks/useMarkets.js
 */

export const CATEGORIES = [
  { key: "all",     label: "All Categories", emoji: "🌐" },
  { key: "crypto",  label: "Crypto",         emoji: "₿"  },
  { key: "sports",  label: "Sports",         emoji: "⚽" },
  { key: "weather", label: "Weather",        emoji: "🌤️" },
  { key: "stocks",  label: "Stocks",         emoji: "📈" },
];

export const CATEGORY_STYLES = {
  Crypto:  { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  Sports:  { color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  Weather: { color: "#38bdf8", bg: "rgba(56,189,248,0.12)"  },
  Stocks:  { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
};

export const MARKETS = [
  {
    id: "btc-above-118k",
    category: "Crypto",
    question: "Will Bitcoin be above $118,000 at 11:59 PM today?",
    closes: "6h 35m",
    yes: 62, no: 38,
    yesPool: 6200, noPool: 3800, totalPool: 10000,
    yourPosition: "YES", yourStake: 1.5,
    resolves: 'Resolves "YES" if BTC price is above $118,000 at 11:59 PM.',
    resolution: "Based on the agreed BTC/USD price source at deadline.",
    featured: true,
  },
  {
    id: "eth-up-2pct",
    category: "Crypto",
    question: "Will Ethereum increase by more than 2% today?",
    closes: "8h 10m",
    yes: 55, no: 45,
    yesPool: 4125, noPool: 3375, totalPool: 7500,
  },
  {
    id: "sol-above-200",
    category: "Crypto",
    question: "Will Solana trade above $200 before midnight?",
    closes: "5h 48m",
    yes: 47, no: 53,
    yesPool: 2350, noPool: 2650, totalPool: 5000,
  },
  {
    id: "arsenal-first-half",
    category: "Sports",
    question: "Will Arsenal score in the first half?",
    closes: "3h 20m",
    yes: 58, no: 42,
    yesPool: 2900, noPool: 2100, totalPool: 5000,
  },
  {
    id: "match-goals-2-5",
    category: "Sports",
    question: "Will there be more than 2.5 goals in today's match?",
    closes: "4h 05m",
    yes: 64, no: 36,
    yesPool: 3840, noPool: 2160, totalPool: 6000,
  },
  {
    id: "rain-abuja",
    category: "Weather",
    question: "Will it rain in Abuja before 8 PM today?",
    closes: "2h 55m",
    yes: 43, no: 57,
    yesPool: 1720, noPool: 2280, totalPool: 4000,
  },
  {
    id: "lagos-temp-30",
    category: "Weather",
    question: "Will Lagos temperature exceed 30°C today?",
    closes: "7h 30m",
    yes: 71, no: 29,
    yesPool: 2840, noPool: 1160, totalPool: 4000,
  },
  {
    id: "apple-close-higher",
    category: "Stocks",
    question: "Will Apple stock close higher today?",
    closes: "9h 15m",
    yes: 53, no: 47,
    yesPool: 5300, noPool: 4700, totalPool: 10000,
  },
  {
    id: "btc-dominance-60",
    category: "Stocks",
    question: "Will Bitcoin dominance be above 60% at midnight?",
    closes: "11h 00m",
    yes: 66, no: 34,
    yesPool: 3300, noPool: 1700, totalPool: 5000,
  },
];

export const FEATURED_MARKET = MARKETS.find((m) => m.featured) ?? MARKETS[0];
