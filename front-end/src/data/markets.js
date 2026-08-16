/**
 * src/data/markets.js
 * All market/poll data in one place.
 * When you connect to Supabase or a smart contract indexer,
 * replace these arrays with API calls in src/hooks/useMarkets.js
 */

export const CATEGORIES = [
  { key: "all",        label: "All Categories",    emoji: "🌐" },
  { key: "politics",   label: "Politics",           emoji: "🏛️" },
  { key: "general",    label: "General Knowledge",  emoji: "💡" },
  { key: "math",       label: "Math",               emoji: "🔢" },
  { key: "psychology", label: "Psychology",         emoji: "🧠" },
  { key: "crypto",     label: "Crypto",             emoji: "₿"  },
  { key: "science",    label: "Science",            emoji: "🔬" },
  { key: "sports",     label: "Sports",             emoji: "⚽" },
];

export const CATEGORY_STYLES = {
  Politics:             { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  Crypto:               { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  "General Knowledge":  { color: "#38bdf8", bg: "rgba(56,189,248,0.12)"  },
  Math:                 { color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  Psychology:           { color: "#fb7185", bg: "rgba(251,113,133,0.12)" },
  Science:              { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  Sports:               { color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
};

export const MARKETS = [
  {
    id: "us-election-2024",
    category: "Politics",
    question: "Will the United States hold presidential elections in 2024?",
    closes: "1h 24m",
    yes: 70, no: 30,
    yesPool: 7000, noPool: 3000, totalPool: 10000,
    yourPosition: "YES", yourStake: 1.5,
    resolves: 'Resolves "Yes" if US presidential election occurs in 2024.',
    resolution: "Based on official US election authority announcements.",
    featured: true,
  },
  {
    id: "global-recession",
    category: "Politics",
    question: "Will a global recession begin in 2025?",
    closes: "1h 30m",
    yes: 65, no: 35,
    yesPool: 4030, noPool: 2170, totalPool: 6200,
  },
  {
    id: "element-o",
    category: "General Knowledge",
    question: "Which element has the chemical symbol 'O'?",
    closes: "6h 45m",
    yes: 84, no: 16,
    yesPool: 2352, noPool: 448, totalPool: 2800,
  },
  {
    id: "is-97-prime",
    category: "Math",
    question: "Is 97 a prime number?",
    closes: "6h 20m",
    yes: 92, no: 8,
    yesPool: 1702, noPool: 148, totalPool: 1850,
  },
  {
    id: "first-impressions",
    category: "Psychology",
    question: "Do first impressions shape our long-term perception?",
    closes: "1d 2h",
    yes: 58, no: 42,
    yesPool: 2088, noPool: 1512, totalPool: 3600,
  },
  {
    id: "ethereum-10k",
    category: "Crypto",
    question: "Will Ethereum reach $10,000 before 2026?",
    closes: "1d 8h",
    yes: 71, no: 29,
    yesPool: 6390, noPool: 2610, totalPool: 9000,
  },
];

export const FEATURED_MARKET = MARKETS.find((m) => m.featured) ?? MARKETS[0];
