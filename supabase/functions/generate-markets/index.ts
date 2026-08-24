/**
 * generate-markets/index.ts
 *
 * Queue-based market generator. Maintains exactly TARGET_ACTIVE_MARKETS = 10.
 *
 * Oracles wired:
 *   Crypto  — CoinGecko (BTC, ETH, QUAI)
 *   Sports  — TheSportsDB (Premier League, free key 123)
 *   Weather — OpenWeatherMap (Abuja, Lagos, London)
 *   Stocks  — Alpha Vantage (AAPL, MSFT, TSLA, NVDA)
 *
 * Every market stores a full resolution spec at creation so the resolver
 * never needs to parse the question text:
 *   coin_id          → asset / team id / city / ticker
 *   target_value     → the threshold
 *   resolution_field → "price" | "score" | "rain_mm" | "close_price" | "temp_c"
 *   resolution_op    → "gt" | "gte" | "lt" | "lte" | "eq"
 *   target_time      → when the oracle will be queried (== deadline)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ── Env ──────────────────────────────────────────────────────────────── */
const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const COINGECKO_API_KEY         = Deno.env.get("COINGECKO_API_KEY")    ?? "";
const SPORTSDB_API_KEY          = Deno.env.get("SPORTSDB_API_KEY")     ?? "123";
const ALPHAVANTAGE_API_KEY      = Deno.env.get("ALPHAVANTAGE_API_KEY") ?? "";
const OPENWEATHER_API_KEY       = Deno.env.get("OPENWEATHER_API_KEY")  ?? "";

// ── On-chain config ───────────────────────────────────────────────────────────
// ORACLE_PRIVATE_KEY: the oracle wallet private key (hex, no 0x prefix)
// Used to call createMarket() on Q4MarketFactory from the edge function.
const ORACLE_PRIVATE_KEY  = Deno.env.get("ORACLE_PRIVATE_KEY")  ?? "";
const FACTORY_ADDRESS     = Deno.env.get("FACTORY_ADDRESS")     ?? "";
const QUAI_RPC_URL        = Deno.env.get("QUAI_RPC_URL")        ?? "https://rpc.quai.network/cyprus1";
const QUAI_CHAIN_ID       = 9;
const IPFS_HASH           = "QmVEPzAtYQAiBUptVbUcVQsV8Tv7zPVPTJs2iJC1L9pCFy"; // Q4Market source CIDv0

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TARGET_ACTIVE_MARKETS = 10;

/* ── Types ────────────────────────────────────────────────────────────── */
interface MarketTemplate {
  question:         string;
  category:         string;
  data_source:      string;
  deadline:         Date;
  coin_id:          string | null;
  target_value:     number | null;
  resolution_field: string;
  resolution_op:    string;
  target_time:      Date;
  dedup_key:        string;
}

/* ── Main ─────────────────────────────────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });

  const created: string[] = [], skipped: string[] = [], errors: string[] = [];

  try {
    const { count: activeCount, error: countErr } = await db
      .from("markets")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    if (countErr) throw new Error(`Count: ${countErr.message}`);

    const needed = TARGET_ACTIVE_MARKETS - (activeCount ?? 0);
    if (needed <= 0) {
      return new Response(
        JSON.stringify({ message: `Queue full — ${activeCount} active.`, created, skipped }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch all live data in parallel
    const [prices, sportsEvents, weatherData, stockData] = await Promise.allSettled([
      fetchCryptoPrices(),
      fetchSportsEvents(),
      fetchWeatherData(),
      fetchStockData(),
    ]);

    const allCandidates = buildCandidates(
      prices.status === "fulfilled"       ? prices.value       : {},
      sportsEvents.status === "fulfilled" ? sportsEvents.value : [],
      weatherData.status === "fulfilled"  ? weatherData.value  : {},
      stockData.status === "fulfilled"    ? stockData.value    : {},
    );

    let filled = 0;
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const cutoff = todayStart.toISOString();

    // Build a set of deadline hours already covered by active/closed markets today.
    // Key: "YYYY-MM-DDTHH" — one market per deadline hour is the hard cap.
    const { data: existingActive } = await db
      .from("markets")
      .select("deadline")
      .in("status", ["active", "closed"])
      .gte("created_at", cutoff);

    const occupiedHours = new Set<string>(
      (existingActive ?? []).map((m: { deadline: string }) =>
        new Date(m.deadline).toISOString().slice(0, 13)
      )
    );

    for (const t of allCandidates) {
      if (filled >= needed) break;

      // Hard cap: skip if the deadline hour is already occupied
      const deadlineHour = t.deadline.toISOString().slice(0, 13);
      if (occupiedHours.has(deadlineHour)) {
        skipped.push(`${t.question} (hour ${deadlineHour} occupied)`);
        continue;
      }

      // Skip if the deadline is less than 60 minutes away
      if (t.deadline.getTime() - Date.now() < 60 * 60 * 1000) {
        skipped.push(`${t.question} (deadline too soon)`);
        continue;
      }

      // Secondary dedup: use dedup_key (question + params hash) — faster than full text match
      const { data: existingKey } = await db
        .from("markets")
        .select("id")
        .eq("dedup_key", t.dedup_key)
        .gte("created_at", cutoff)
        .limit(1);

      if (existingKey && existingKey.length > 0) {
        skipped.push(`${t.question} (duplicate key)`);
        continue;
      }

      const deadlineUnixSec = Math.floor(t.deadline.getTime() / 1000);

      // ── Deploy Q4Market on-chain ──────────────────────────────────────
      const contractAddress = await deployMarketContract(
        t.question,
        t.category,
        deadlineUnixSec,
      );

      const { data: market, error: mErr } = await db
        .from("markets")
        .insert({
          question:         t.question,
          category:         t.category,
          status:           "active",
          deadline:         t.deadline.toISOString(),
          data_source:      t.data_source,
          coin_id:          t.coin_id,
          target_value:     t.target_value,
          resolution_field: t.resolution_field,
          resolution_op:    t.resolution_op,
          target_time:      t.target_time.toISOString(),
          // store the deployed contract address (null if on-chain deploy was skipped)
          contract_address: contractAddress,
          // dedup_key prevents duplicate markets across cron runs
          dedup_key:        t.dedup_key,
        })
        .select("id").single();

      if (mErr || !market) { errors.push(`${t.question}: ${mErr?.message}`); continue; }

      await db.from("market_outcomes").insert([
        { market_id: market.id, outcome: "YES", pool_amount: 0, participant_count: 0 },
        { market_id: market.id, outcome: "NO",  pool_amount: 0, participant_count: 0 },
      ]);

      await db.from("market_events").insert({
        market_id:        market.id,
        event_type:       "created",
        transaction_hash: contractAddress ? `factory:${contractAddress}` : null,
        metadata: {
          created_by:       "generate_function",
          category:         t.category,
          contract_address: contractAddress,
        },
      });

      // Mark this deadline hour as occupied so the current run doesn't
      // create a second market into the same slot
      occupiedHours.add(deadlineHour);

      created.push(t.question);
      filled++;
    }

    return new Response(
      JSON.stringify({ success: true, active_before: activeCount, needed, created, skipped, errors }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});

/* ════════════════════════════════════════════════════════════════════════
   ON-CHAIN: deploy a Q4Market via Q4MarketFactory.createMarket()
   Uses quais.js (Quai's ethers fork) which handles zone-aware checksums
   and protobuf transaction encoding.
════════════════════════════════════════════════════════════════════════ */

// Lazy import quais only when ORACLE_PRIVATE_KEY is set, so the function
// boots fast when on-chain features are disabled.
async function getQuaisLib() {
  // @ts-ignore — deno import
  const { quais } = await import("npm:quais@1.0.0-alpha.56");
  return quais;
}

/**
 * Deploy a Q4Market contract via Q4MarketFactory.createMarket().
 * Returns the deployed market contract address, or null on failure.
 */
async function deployMarketContract(
  question: string,
  category: string,
  deadlineTs: number, // Unix timestamp (seconds)
): Promise<string | null> {
  if (!ORACLE_PRIVATE_KEY || !FACTORY_ADDRESS) return null;

  try {
    const quais    = await getQuaisLib();
    const provider = new quais.JsonRpcProvider(QUAI_RPC_URL, undefined, { usePathing: true });
    const signer   = new quais.Wallet("0x" + ORACLE_PRIVATE_KEY, provider);

    // createMarket(string question, string category, uint256 deadline)
    const factoryAbi = [
      "function createMarket(string question, string category, uint256 deadline) returns (uint256 marketId, address market)"
    ];
    const factory = new quais.Contract(FACTORY_ADDRESS, factoryAbi, signer);

    // quais ContractFactory requires IPFS hash; for a plain Contract call we just send the tx
    const tx = await signer.sendTransaction({
      to:   FACTORY_ADDRESS,
      data: factory.interface.encodeFunctionData("createMarket", [
        question,
        category,
        BigInt(deadlineTs),
      ]),
    });

    // Wait for 1 confirmation
    const receipt = await tx.wait(1);

    // Find MarketCreated event to extract the deployed market address
    // Event sig: MarketCreated(uint256 indexed marketId, address indexed market, ...)
    const MARKET_CREATED_TOPIC = "0xb964ec62ce8297156f9b8af2d30a75fe682aa65bdc010b422c15b3feda3db103";
    const log = receipt.logs?.find((l: { topics: string[] }) => l.topics[0] === MARKET_CREATED_TOPIC);
    if (log) {
      // topics[2] = market address (indexed), padded to 32 bytes
      const marketAddress = "0x" + log.topics[2].slice(26);
      console.log(`[generate-markets] Q4Market deployed: ${marketAddress} (tx: ${receipt.hash})`);
      return marketAddress;
    }

    // Fallback: derive from receipt if available
    console.warn("[generate-markets] MarketCreated log not found — receipt:", JSON.stringify(receipt));
    return null;
  } catch (err) {
    console.error("[generate-markets] deployMarketContract failed:", (err as Error).message);
    return null;
  }
}

/* ════════════════════════════════════════════════════════════════════════
   DATA FETCHERS
════════════════════════════════════════════════════════════════════════ */

async function fetchCryptoPrices(): Promise<Record<string, number>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (COINGECKO_API_KEY) headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,quai-network&vs_currencies=usd",
    { headers }
  );
  if (!res.ok) return {};
  const raw: Record<string, { usd: number }> = await res.json();
  const out: Record<string, number> = {};
  for (const [id, d] of Object.entries(raw)) out[id] = d.usd;
  return out;
}

interface SportsEvent {
  teamId: string; teamName: string; opponent: string;
  isHome: boolean; dateEvent: string; leagueName: string;
}

async function fetchSportsEvents(): Promise<SportsEvent[]> {
  // Premier League teams that generate interesting markets
  const teams = [
    { id: "133604", name: "Arsenal" },
    { id: "133613", name: "Manchester City" },
    { id: "133616", name: "Liverpool" },
    { id: "133612", name: "Chelsea" },
    { id: "133606", name: "Manchester United" },
  ];

  const events: SportsEvent[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const team of teams) {
    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsnext.php?id=${team.id}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      const ev = (data.events ?? [])[0];
      if (!ev) continue;
      // Only include events happening today or tomorrow
      const diff = (new Date(ev.dateEvent).getTime() - Date.now()) / 86400000;
      if (diff > 2 || diff < -0.5) continue;
      events.push({
        teamId:    team.id,
        teamName:  team.name,
        opponent:  ev.idHomeTeam === team.id ? ev.strAwayTeam : ev.strHomeTeam,
        isHome:    ev.idHomeTeam === team.id,
        dateEvent: ev.dateEvent,
        leagueName: ev.strLeague ?? "Football",
      });
    } catch { /* skip this team */ }
  }
  return events;
}

interface WeatherReading {
  city: string; countryCode: string;
  rain1h: number; tempC: number; description: string;
}

async function fetchWeatherData(): Promise<Record<string, WeatherReading>> {
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY.startsWith("REPLACE")) return {};

  const cities = ["Abuja,NG", "Lagos,NG", "London,GB"];
  const out: Record<string, WeatherReading> = {};

  for (const city of cities) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      if (!res.ok) continue;
      const d = await res.json();
      const key = city.split(",")[0];
      out[key] = {
        city: key, countryCode: city.split(",")[1],
        rain1h:      d.rain?.["1h"] ?? 0,
        tempC:       d.main?.temp  ?? 20,
        description: d.weather?.[0]?.description ?? "",
      };
    } catch { /* skip */ }
  }
  return out;
}

interface StockReading { symbol: string; price: number; prevClose: number; }

async function fetchStockData(): Promise<Record<string, StockReading>> {
  if (!ALPHAVANTAGE_API_KEY) return {};

  // Note: Alpha Vantage "demo" key only works for IBM and MSFT.
  // Replace ALPHAVANTAGE_API_KEY secret with a real free key from alphavantage.co
  // to unlock AAPL, TSLA, NVDA, etc.
  const tickers = ALPHAVANTAGE_API_KEY === "demo"
    ? ["IBM", "MSFT"]            // demo key only supports these two
    : ["AAPL", "MSFT", "TSLA", "NVDA", "IBM"]; // real key — full list

  const out: Record<string, StockReading> = {};

  for (const symbol of tickers) {
    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHAVANTAGE_API_KEY}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      const q = data["Global Quote"];
      if (!q || !q["05. price"]) continue;
      out[symbol] = {
        symbol,
        price:     parseFloat(q["05. price"]),
        prevClose: parseFloat(q["08. previous close"] ?? q["05. price"]),
      };
      // Alpha Vantage free tier: 5 req/min — small delay
      await new Promise(r => setTimeout(r, 300));
    } catch { /* skip */ }
  }
  return out;
}

/* ════════════════════════════════════════════════════════════════════════
   CANDIDATE BUILDER
════════════════════════════════════════════════════════════════════════ */
function buildCandidates(
  prices:  Record<string, number>,
  sports:  SportsEvent[],
  weather: Record<string, WeatherReading>,
  stocks:  Record<string, StockReading>,
): MarketTemplate[] {
  const candidates: MarketTemplate[] = [];
  // Generate 10 deadline slots — enough to fill the full queue from any state
  const deadlines = nextDeadlines(10);

  if (deadlines.length === 0) {
    // No valid deadlines left today — nothing to create
    return candidates;
  }

  /* ── CRYPTO ─────────────────────────────────────────────────────────── */
  const btc = prices["bitcoin"];
  if (btc) {
    // BTC gets every other slot (0, 2, 4, 6, 8), alternating above/below
    for (let i = 0; i < deadlines.length; i += 2) {
      const isEven = (i / 2) % 2 === 0;
      const target = roundSig(btc * (isEven ? 1.005 : 0.995), 4);
      candidates.push(makeCrypto("Bitcoin", "bitcoin", target, "gt", deadlines[i]));
    }
  }

  const eth = prices["ethereum"];
  if (eth) {
    // ETH gets odd slots (1, 5, 9)
    for (let i = 1; i < deadlines.length; i += 4) {
      const target = roundSig(eth * 1.005, 3);
      candidates.push(makeCrypto("Ethereum", "ethereum", target, "gt", deadlines[i]));
    }
  }

  const quai = prices["quai-network"];
  if (quai) {
    // QUAI gets slot 3 and 7
    for (let i = 3; i < deadlines.length; i += 4) {
      const target = parseFloat((quai * 1.03).toFixed(5));
      candidates.push(makeCrypto("Quai", "quai-network", target, "gt", deadlines[i]));
    }
  }

  /* ── SPORTS ─────────────────────────────────────────────────────────── */
  for (const ev of sports) {
    const matchTime = new Date(`${ev.dateEvent}T22:00:00Z`);
    const dl = matchTime > new Date() ? matchTime : deadlines[0];

    candidates.push({
      question:         `Will ${ev.teamName} score in their match against ${ev.opponent}?`,
      category:         "Sports",
      data_source:      `TheSportsDB — ${ev.leagueName}`,
      deadline:         dl,
      coin_id:          ev.teamId,
      target_value:     0,
      resolution_field: "score",
      resolution_op:    "gt",
      target_time:      dl,
      // Date-based dedup so the same fixture never duplicates across cron runs
      dedup_key:        `${ev.teamName}-score-${ev.dateEvent}`,
    });

    candidates.push({
      question:         `Will the ${ev.teamName} vs ${ev.opponent} match have more than 2 goals?`,
      category:         "Sports",
      data_source:      `TheSportsDB — ${ev.leagueName}`,
      deadline:         dl,
      coin_id:          ev.teamId,
      target_value:     2,
      resolution_field: "total_score",
      resolution_op:    "gt",
      target_time:      dl,
      dedup_key:        `${ev.teamName}-total-goals-${ev.dateEvent}`,
    });
  }

  /* ── WEATHER ─────────────────────────────────────────────────────────── */
  for (const [city, w] of Object.entries(weather)) {
    const eod  = endOfDay();
    const today = eod.toISOString().slice(0, 10);

    candidates.push({
      question:         `Will it rain in ${city} before ${fmtTime(eod)}?`,
      category:         "Weather",
      data_source:      `OpenWeatherMap — ${city}`,
      deadline:         eod,
      coin_id:          city,
      target_value:     0.1,
      resolution_field: "rain_mm",
      resolution_op:    "gt",
      target_time:      eod,
      dedup_key:        `weather-${city}-rain-${today}`,
    });

    const tempTarget = Math.round(w.tempC + 2);
    candidates.push({
      question:         `Will the temperature in ${city} exceed ${tempTarget}°C today?`,
      category:         "Weather",
      data_source:      `OpenWeatherMap — ${city}`,
      deadline:         eod,
      coin_id:          city,
      target_value:     tempTarget,
      resolution_field: "temp_c",
      resolution_op:    "gt",
      target_time:      eod,
      dedup_key:        `weather-${city}-temp${tempTarget}-${today}`,
    });
  }

  /* ── STOCKS ─────────────────────────────────────────────────────────── */
  for (const [symbol, s] of Object.entries(stocks)) {
    const eod   = marketCloseTime();
    const today = eod.toISOString().slice(0, 10);
    const above = parseFloat((s.price * 1.005).toFixed(2));

    candidates.push({
      question:         `Will ${symbol} close above $${fmt(above)} today?`,
      category:         "Stocks",
      data_source:      `Alpha Vantage — ${symbol}`,
      deadline:         eod,
      coin_id:          symbol,
      target_value:     above,
      resolution_field: "close_price",
      resolution_op:    "gt",
      target_time:      eod,
      dedup_key:        `stock-${symbol}-${above}-${today}`,
    });
  }

  return candidates;
}

/* ── Template helper for crypto ─────────────────────────────────────── */
function makeCrypto(
  name: string, coinId: string, target: number, op: string, dl: Date
): MarketTemplate {
  const dir = op === "gt" ? "above" : "below";
  // Dedup key: asset + target price + deadline date+hour (not full ISO timestamp)
  // This prevents duplicates when the cron regenerates within the same hour
  const dedupHour = dl.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
  return {
    question:         `Will ${name} be ${dir} $${fmt(target)} at ${fmtTime(dl)}?`,
    category:         "Crypto",
    data_source:      `CoinGecko ${name}/USD`,
    deadline:         dl,
    coin_id:          coinId,
    target_value:     target,
    resolution_field: "price",
    resolution_op:    op,
    target_time:      dl,
    dedup_key:        `${coinId}-${target}-${dedupHour}`,
  };
}

/* ── Deadline helpers ────────────────────────────────────────────────── */

/**
 * Returns up to `count` whole-hour UTC deadlines spaced MIN_SPACING_HRS apart.
 * Starts 2 hours from now and extends across today AND tomorrow, so the
 * generator always has enough candidate slots to fill the 10-market queue
 * even if most of today's hours are already taken.
 *
 * The hard limit is MIN_LEAD_MS: we never create a market that resolves
 * in less than 90 minutes.
 */
const MIN_LEAD_MS     = 90 * 60 * 1000; // 90-minute minimum lead time
const MIN_SPACING_HRS = 2;              // 2-hour gap between deadline slots

function nextDeadlines(count: number): Date[] {
  const deadlines: Date[] = [];
  const now  = new Date();

  // Snap to next whole hour, then add 2 h to ensure MIN_LEAD_MS is met
  const base = new Date(now);
  base.setUTCMinutes(0, 0, 0);
  base.setUTCHours(base.getUTCHours() + 2);

  let cursor = base;
  // Scan up to 48 hours forward — guarantees enough slots even at end-of-day
  const limit = new Date(now.getTime() + 48 * 3600 * 1000);

  while (deadlines.length < count && cursor < limit) {
    if (cursor.getTime() - now.getTime() >= MIN_LEAD_MS) {
      deadlines.push(new Date(cursor));
    }
    cursor = new Date(cursor.getTime() + MIN_SPACING_HRS * 3600 * 1000);
  }

  return deadlines;
}

function endOfDay(): Date {
  const d = new Date(); d.setUTCHours(23, 59, 0, 0); return d;
}

function marketCloseTime(): Date {
  // US market closes ~21:00 UTC
  const d = new Date(); d.setUTCHours(21, 30, 0, 0); return d;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC",
  }) + " UTC";
}

function roundSig(n: number, sig: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - sig + 1);
  return Math.round(n / mag) * mag;
}

function fmt(n: number): string {
  return n % 1 === 0
    ? n.toLocaleString("en-US")
    : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 });
}
