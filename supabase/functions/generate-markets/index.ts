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
    const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

    for (const t of allCandidates) {
      if (filled >= needed) break;

      // Dedup — skip if same question was created in the last 25h
      const { data: existing } = await db
        .from("markets")
        .select("id")
        .ilike("question", `%${t.dedup_key}%`)
        .gte("created_at", cutoff)
        .limit(1);

      if (existing && existing.length > 0) { skipped.push(t.question); continue; }

      const { data: market, error: mErr } = await db
        .from("markets")
        .insert({
          question: t.question, category: t.category, status: "active",
          deadline: t.deadline.toISOString(), data_source: t.data_source,
          coin_id: t.coin_id, target_value: t.target_value,
          resolution_field: t.resolution_field, resolution_op: t.resolution_op,
          target_time: t.target_time.toISOString(),
        })
        .select("id").single();

      if (mErr || !market) { errors.push(`${t.question}: ${mErr?.message}`); continue; }

      await db.from("market_outcomes").insert([
        { market_id: market.id, outcome: "YES", pool_amount: 0, participant_count: 0 },
        { market_id: market.id, outcome: "NO",  pool_amount: 0, participant_count: 0 },
      ]);

      await db.from("market_events").insert({
        market_id: market.id, event_type: "created",
        metadata: { created_by: "generate_function", category: t.category },
      });

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
  const deadlines = nextDeadlines(6);

  /* ── CRYPTO ─────────────────────────────────────────────────────────── */
  const btc = prices["bitcoin"];
  if (btc) {
    for (const dl of deadlines.slice(0, 4)) {
      const above = roundSig(btc * 1.005, 4);
      const below = roundSig(btc * 0.995, 4);
      candidates.push(makeCrypto("Bitcoin", "bitcoin", above, "gt", dl));
      candidates.push(makeCrypto("Bitcoin", "bitcoin", below, "gt", dl));
    }
  }
  const eth = prices["ethereum"];
  if (eth) {
    for (const dl of deadlines.slice(0, 3)) {
      candidates.push(makeCrypto("Ethereum", "ethereum", roundSig(eth * 1.005, 3), "gt", dl));
      candidates.push(makeCrypto("Ethereum", "ethereum", roundSig(eth * 0.995, 3), "gt", dl));
    }
  }
  const quai = prices["quai-network"];
  if (quai) {
    const eod = endOfDay();
    candidates.push(makeCrypto("Quai", "quai-network", parseFloat((quai * 1.03).toFixed(5)), "gt", eod));
  }

  /* ── SPORTS ─────────────────────────────────────────────────────────── */
  for (const ev of sports) {
    const matchTime = new Date(`${ev.dateEvent}T22:00:00Z`); // after typical match end
    const dl = matchTime > new Date() ? matchTime : endOfDay();

    // "Will X score at least 1 goal?"
    candidates.push({
      question:         `Will ${ev.teamName} score in their match against ${ev.opponent}?`,
      category:         "Sports",
      data_source:      `TheSportsDB — ${ev.leagueName}`,
      deadline:         dl,
      coin_id:          ev.teamId,
      target_value:     0,           // score > 0 = YES
      resolution_field: "score",
      resolution_op:    "gt",
      target_time:      dl,
      dedup_key:        `${ev.teamName}-score-${ev.dateEvent}`,
    });

    // "Will the match have more than 2 goals total?"
    candidates.push({
      question:         `Will the ${ev.teamName} vs ${ev.opponent} match have more than 2 goals?`,
      category:         "Sports",
      data_source:      `TheSportsDB — ${ev.leagueName}`,
      deadline:         dl,
      coin_id:          ev.teamId,
      target_value:     2,           // total_score > 2 = YES
      resolution_field: "total_score",
      resolution_op:    "gt",
      target_time:      dl,
      dedup_key:        `${ev.teamName}-total-goals-${ev.dateEvent}`,
    });
  }

  /* ── WEATHER ─────────────────────────────────────────────────────────── */
  for (const [city, w] of Object.entries(weather)) {
    const eod = endOfDay();

    // Rain market
    candidates.push({
      question:         `Will it rain in ${city} before ${fmtTime(eod)}?`,
      category:         "Weather",
      data_source:      `OpenWeatherMap — ${city}`,
      deadline:         eod,
      coin_id:          city,
      target_value:     0.1,         // rain_mm > 0.1 = YES
      resolution_field: "rain_mm",
      resolution_op:    "gt",
      target_time:      eod,
      dedup_key:        `Weather-${city}-rain-${eod.toISOString().slice(0,10)}`,
    });

    // Temperature market — will it be above current + 2°C?
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
      dedup_key:        `Weather-${city}-temp-${tempTarget}-${eod.toISOString().slice(0,10)}`,
    });
  }

  /* ── STOCKS ─────────────────────────────────────────────────────────── */
  for (const [symbol, s] of Object.entries(stocks)) {
    const eod = marketCloseTime(); // 9 PM UTC ~ after US market close
    const above = parseFloat((s.price * 1.005).toFixed(2)); // 0.5% above current

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
      dedup_key:        `Stock-${symbol}-${above}-${eod.toISOString().slice(0,10)}`,
    });
  }

  return candidates;
}

/* ── Template helper for crypto ─────────────────────────────────────── */
function makeCrypto(
  name: string, coinId: string, target: number, op: string, dl: Date
): MarketTemplate {
  const dir = op === "gt" ? "above" : "below";
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
    dedup_key:        `${name}-${target}-${dl.toISOString()}`,
  };
}

/* ── Deadline helpers ────────────────────────────────────────────────── */
function nextDeadlines(count: number): Date[] {
  const deadlines: Date[] = [];
  const now  = new Date();
  const base = new Date(now);
  base.setUTCMinutes(0, 0, 0);
  base.setUTCHours(base.getUTCHours() + 1);

  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setUTCHours(base.getUTCHours() + i * 2);
    if (d.getUTCDate() !== now.getUTCDate()) break;
    deadlines.push(d);
  }

  const eod = endOfDay();
  if (!deadlines.find(d => Math.abs(d.getTime() - eod.getTime()) < 60_000))
    deadlines.push(eod);

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
