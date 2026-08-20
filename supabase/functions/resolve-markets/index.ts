/**
 * resolve-markets/index.ts
 *
 * Resolves all expired Q4 markets across ALL categories:
 *   Crypto  — CoinGecko price API
 *   Sports  — TheSportsDB API (free key 123)
 *   Weather — OpenWeatherMap current weather API
 *   Stocks  — Alpha Vantage GLOBAL_QUOTE API
 *
 * Resolution is 100% data-driven using the structured columns set at
 * market creation: coin_id / target_value / resolution_field / resolution_op
 * No question-string parsing needed.
 *
 * Payout:
 *   net_lose = losing_pool × 0.95  (5% platform fee)
 *   payout   = stake + (stake / win_pool) × net_lose
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ── Env ──────────────────────────────────────────────────────────────── */
const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const COINGECKO_API_KEY         = Deno.env.get("COINGECKO_API_KEY")         ?? "";
const SPORTSDB_API_KEY          = Deno.env.get("SPORTSDB_API_KEY")          ?? "123";
const ALPHAVANTAGE_API_KEY      = Deno.env.get("ALPHAVANTAGE_API_KEY")      ?? "";
const OPENWEATHER_API_KEY       = Deno.env.get("OPENWEATHER_API_KEY")       ?? "";

// ── On-chain config ───────────────────────────────────────────────────────────
const ORACLE_PRIVATE_KEY = Deno.env.get("ORACLE_PRIVATE_KEY") ?? "";
const FACTORY_ADDRESS    = Deno.env.get("FACTORY_ADDRESS")    ?? "";
const QUAI_RPC_URL       = Deno.env.get("QUAI_RPC_URL")       ?? "https://rpc.quai.network/cyprus1";

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const PROTOCOL_FEE = 0.05; // 5%

/* ── On-chain resolution helper ──────────────────────────────────────── */
/**
 * Calls resolveMarket(marketContractAddress, outcome) on Q4MarketFactory.
 * marketContractAddress is the address of the individual Q4Market contract
 * (stored in markets.contract_address).
 *
 * We look up the factory's internal market ID by matching the contract address,
 * OR we call resolveMarket directly on the Q4Market contract via the factory.
 *
 * The factory's resolveMarket(uint256 marketId, bool outcome) takes a sequential
 * marketId — but we don't store that. Instead we call resolve(bool) directly
 * on the individual Q4Market contract using the oracle key.
 */
async function resolveMarketOnChain(
  contractAddress: string,
  outcome: "YES" | "NO",
): Promise<string | null> {
  if (!ORACLE_PRIVATE_KEY || !contractAddress) return null;

  try {
    // @ts-ignore
    const { quais } = await import("npm:quais@1.0.0-alpha.56");
    const provider  = new quais.JsonRpcProvider(QUAI_RPC_URL, undefined, { usePathing: true });
    const signer    = new quais.Wallet("0x" + ORACLE_PRIVATE_KEY, provider);

    // Call resolve(bool) directly on the Q4Market contract
    // selector: cast sig "resolve(bool)" = 0x3fad9ae0
    const calldata = "0x3fad9ae0" + (outcome === "YES"
      ? "0000000000000000000000000000000000000000000000000000000000000001"
      : "0000000000000000000000000000000000000000000000000000000000000000");

    const tx = await signer.sendTransaction({ to: contractAddress, data: calldata });
    const receipt = await tx.wait(1);
    console.log(`[resolve-markets] resolved on-chain: ${contractAddress} → ${outcome} (tx: ${receipt.hash})`);
    return receipt.hash as string;
  } catch (err) {
    console.error(`[resolve-markets] on-chain resolve failed for ${contractAddress}:`, (err as Error).message);
    return null;
  }
}

/* ── Types ────────────────────────────────────────────────────────────── */
interface Market {
  id: string; question: string; category: string;
  status: string; deadline: string; resolved_outcome: string | null;
  data_source: string | null; contract_address: string | null;
  coin_id: string | null; target_value: number | null;
  resolution_field: string | null; resolution_op: string | null;
  target_time: string | null;
}
interface Position {
  id: string; user_id: string; market_id: string;
  side: "YES" | "NO"; amount: number;
}
interface PoolRow { outcome: string; pool_amount: number; }

/* ── Main ─────────────────────────────────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });

  const now = new Date().toISOString();
  const processed: string[] = [], skipped: string[] = [], errors: string[] = [];

  try {
    const { data: expired, error: fetchErr } = await db
      .from("markets")
      .select(`id, question, category, status, deadline, resolved_outcome,
               data_source, contract_address, coin_id, target_value,
               resolution_field, resolution_op, target_time`)
      .in("status", ["active", "closed"])
      .lt("deadline", now);

    if (fetchErr) throw new Error(`Fetch: ${fetchErr.message}`);

    if (!expired || expired.length === 0) {
      await triggerGenerator();
      return new Response(JSON.stringify({ message: "No expired markets.", processed, skipped }),
        { status: 200, headers: { "Content-Type": "application/json" } });
    }

    for (const market of expired as Market[]) {
      try {
        if (market.status === "active") {
          await db.from("markets").update({ status: "closed", updated_at: now }).eq("id", market.id);
          market.status = "closed";
        }

        const outcome = await resolveOutcome(market);
        if (outcome === null) {
          skipped.push(`${market.id} (${market.category}): oracle unavailable`);
          continue;
        }

        await db.from("markets").update({
          status: "resolved", resolved_outcome: outcome, updated_at: now,
        }).eq("id", market.id);

        // ── Resolve on-chain (if this market has a deployed contract) ────
        let onChainTxHash: string | null = null;
        if (market.contract_address) {
          onChainTxHash = await resolveMarketOnChain(market.contract_address, outcome);
        }

        await db.from("oracle_results").insert({
          market_id: market.id, result_value: outcome, resolved_at: now,
          data_source: market.data_source ?? "auto",
        });

        await db.from("market_events").insert({
          market_id:        market.id,
          event_type:       "resolved",
          transaction_hash: onChainTxHash ?? null,
          metadata: { outcome, resolved_by: "oracle_function", on_chain: Boolean(onChainTxHash) },
        });

        const { data: pools }     = await db.from("market_outcomes").select("outcome, pool_amount").eq("market_id", market.id);
        const { data: positions } = await db.from("user_positions").select("id, user_id, market_id, side, amount").eq("market_id", market.id);

        if (!pools || !positions || positions.length === 0) {
          processed.push(`${market.id}: resolved ${outcome} — no positions`);
          continue;
        }

        const yesPool  = Number((pools as PoolRow[]).find(p => p.outcome === "YES")?.pool_amount ?? 0);
        const noPool   = Number((pools as PoolRow[]).find(p => p.outcome === "NO")?.pool_amount  ?? 0);
        const winPool  = outcome === "YES" ? yesPool : noPool;
        const losePool = outcome === "YES" ? noPool  : yesPool;
        const netLose  = losePool * (1 - PROTOCOL_FEE);

        const winners = (positions as Position[]).filter(p => p.side === outcome);
        const losers  = (positions as Position[]).filter(p => p.side !== outcome);

        if (winners.length > 0 && winPool > 0) {
          await db.from("rewards").insert(
            winners.map(p => ({
              user_id: p.user_id, market_id: market.id, position_id: p.id,
              amount: parseFloat((Number(p.amount) + (Number(p.amount) / winPool) * netLose).toFixed(6)),
              claimed: false,
            }))
          );
        }

        const notifRows = [
          ...winners.map(p => ({
            user_id: p.user_id, type: "reward" as const, read: false,
            title: "You won! 🎉",
            body: `Your ${outcome} prediction was correct. Check your rewards.`,
          })),
          ...losers.map(p => ({
            user_id: p.user_id, type: "market" as const, read: false,
            title: "Market resolved",
            body: `Market resolved ${outcome}. Your $${Number(p.amount).toFixed(2)} ${p.side} stake was forfeited.`,
          })),
        ];
        if (notifRows.length > 0) await db.from("notifications").insert(notifRows);

        processed.push(`${market.id}: ${outcome} — ${winners.length} winners, ${losers.length} losers`);
      } catch (err) {
        errors.push(`${market.id}: ${(err as Error).message}`);
      }
    }

    await triggerGenerator();
    return new Response(JSON.stringify({ success: true, processed, skipped, errors }),
      { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});

/* ════════════════════════════════════════════════════════════════════════
   ORACLE ROUTER
════════════════════════════════════════════════════════════════════════ */
async function resolveOutcome(market: Market): Promise<"YES" | "NO" | null> {
  const { resolution_field, resolution_op, target_value, coin_id, category } = market;

  // Structured resolution spec — all new markets have these
  if (resolution_field && resolution_op && target_value != null) {
    switch (resolution_field) {
      case "price":       return resolveCrypto(coin_id!, target_value, resolution_op);
      case "score":       return resolveSports(market, target_value, resolution_op);
      case "rain_mm":     return resolveWeather(market, target_value, resolution_op);
      case "temp_c":      return resolveWeather(market, target_value, resolution_op);
      case "close_price": return resolveStocks(market, target_value, resolution_op);
    }
  }

  // Legacy fallback — for markets created before structured columns
  if (category === "Crypto") return legacyCryptoResolve(market.question);
  return null;
}

/* ── Operator helper ──────────────────────────────────────────────────── */
function applyOp(actual: number, op: string, target: number): "YES" | "NO" {
  switch (op) {
    case "gt":  return actual >  target ? "YES" : "NO";
    case "gte": return actual >= target ? "YES" : "NO";
    case "lt":  return actual <  target ? "YES" : "NO";
    case "lte": return actual <= target ? "YES" : "NO";
    case "eq":  return actual === target ? "YES" : "NO";
    default:    return actual >  target ? "YES" : "NO";
  }
}

/* ════════════════════════════════════════════════════════════════════════
   CRYPTO — CoinGecko
════════════════════════════════════════════════════════════════════════ */
async function resolveCrypto(
  coinId: string, target: number, op: string
): Promise<"YES" | "NO" | null> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (COINGECKO_API_KEY) headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { headers }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = data[coinId]?.usd;
    return price != null ? applyOp(price, op, target) : null;
  } catch { return null; }
}

async function legacyCryptoResolve(question: string): Promise<"YES" | "NO" | null> {
  const assetMap: Record<string, string> = {
    bitcoin: "bitcoin", btc: "bitcoin",
    ethereum: "ethereum", eth: "ethereum",
    quai: "quai-network",
  };
  const q = question.toLowerCase();
  let coinId: string | null = null;
  for (const [k, v] of Object.entries(assetMap)) if (q.includes(k)) { coinId = v; break; }
  if (!coinId) return null;
  const match = question.match(/\$[\d,]+(\.\d+)?/);
  if (!match) return null;
  const threshold = parseFloat(match[0].replace(/[$,]/g, ""));
  const headers: Record<string, string> = { Accept: "application/json" };
  if (COINGECKO_API_KEY) headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
    { headers }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const price = data[coinId]?.usd;
  if (price == null) return null;
  if (q.includes("above") || q.includes("over") || q.includes("higher")) return price > threshold ? "YES" : "NO";
  if (q.includes("below") || q.includes("under") || q.includes("lower")) return price < threshold ? "YES" : "NO";
  return null;
}

/* ════════════════════════════════════════════════════════════════════════
   SPORTS — TheSportsDB (free key 123)
   
   Market metadata used for resolution:
     coin_id       → TheSportsDB team ID (stored as string, e.g. "133604")
     target_value  → target goals/points threshold (e.g. 0 = "score at least 1")
     resolution_op → "gt" (scored > 0 means YES), "gte", etc.
     resolution_field → "score" | "home_score" | "away_score" | "total_score"
   
   The market generator stores the team ID and side (home/away) so the
   resolver knows exactly which team's score to check.
════════════════════════════════════════════════════════════════════════ */
async function resolveSports(
  market: Market, target: number, op: string
): Promise<"YES" | "NO" | null> {
  // coin_id stores the TheSportsDB team ID for sports markets
  const teamId = market.coin_id;
  if (!teamId) return null;

  try {
    // Fetch the last event for this team
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventslast.php?id=${teamId}`
    );
    if (!res.ok) return null;
    const data = await res.json();

    // eventslast returns "results" or "events"
    const events = data.results ?? data.events ?? [];
    if (!events.length) return null;

    // Find the most recent event that matches the market deadline
    const marketDate = market.deadline.slice(0, 10); // YYYY-MM-DD
    const event = events.find((e: Record<string, string>) =>
      e.dateEvent === marketDate && e.strStatus === "FT"
    ) ?? events[0]; // fallback to most recent finished event

    if (!event || event.strStatus !== "FT") return null; // not finished yet

    // Determine which score to use based on resolution_field
    let actualScore: number;
    const isHome = event.idHomeTeam?.toString() === teamId.toString();

    switch (market.resolution_field) {
      case "home_score":
        actualScore = parseInt(event.intHomeScore ?? "0", 10);
        break;
      case "away_score":
        actualScore = parseInt(event.intAwayScore ?? "0", 10);
        break;
      case "total_score":
        actualScore = parseInt(event.intHomeScore ?? "0", 10) +
                      parseInt(event.intAwayScore ?? "0", 10);
        break;
      case "score":
      default:
        // Use the score for the team whose ID we stored
        actualScore = isHome
          ? parseInt(event.intHomeScore ?? "0", 10)
          : parseInt(event.intAwayScore ?? "0", 10);
        break;
    }

    return applyOp(actualScore, op, target);
  } catch { return null; }
}

/* ════════════════════════════════════════════════════════════════════════
   WEATHER — OpenWeatherMap
   
   Market metadata:
     coin_id          → city name or "lat,lon" (e.g. "Abuja" or "9.07,7.40")
     target_value     → threshold value
     resolution_field → "rain_mm" | "temp_c" | "humidity"
     resolution_op    → "gt" | "lt" | etc.
════════════════════════════════════════════════════════════════════════ */
async function resolveWeather(
  market: Market, target: number, op: string
): Promise<"YES" | "NO" | null> {
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY.startsWith("REPLACE")) return null;

  const location = market.coin_id; // city name stored in coin_id
  if (!location) return null;

  try {
    // Current weather endpoint (free tier)
    const url = location.includes(",")
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${location.split(",")[0]}&lon=${location.split(",")[1]}&appid=${OPENWEATHER_API_KEY}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    let actual: number;
    switch (market.resolution_field) {
      case "rain_mm":
        // rain.1h = mm of rain in the last hour (0 if not raining)
        actual = data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0;
        break;
      case "temp_c":
        actual = data.main?.temp ?? 0;
        break;
      case "humidity":
        actual = data.main?.humidity ?? 0;
        break;
      default:
        actual = data.rain?.["1h"] ?? 0;
    }

    return applyOp(actual, op, target);
  } catch { return null; }
}

/* ════════════════════════════════════════════════════════════════════════
   STOCKS — Alpha Vantage GLOBAL_QUOTE
   
   Market metadata:
     coin_id          → stock ticker symbol (e.g. "AAPL", "MSFT")
     target_value     → price threshold
     resolution_field → "close_price"
     resolution_op    → "gt" | "lt" | etc.
════════════════════════════════════════════════════════════════════════ */
async function resolveStocks(
  market: Market, target: number, op: string
): Promise<"YES" | "NO" | null> {
  if (!ALPHAVANTAGE_API_KEY) return null;

  const symbol = market.coin_id; // ticker stored in coin_id
  if (!symbol) return null;

  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHAVANTAGE_API_KEY}`
    );
    if (!res.ok) return null;
    const data = await res.json();

    const quote = data["Global Quote"];
    if (!quote) return null;

    // Use closing price (or current price if market is still open)
    const price = parseFloat(quote["05. price"] ?? quote["08. previous close"] ?? "0");
    if (!price) return null;

    return applyOp(price, op, target);
  } catch { return null; }
}

/* ── Trigger generator ────────────────────────────────────────────────── */
async function triggerGenerator(): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/generate-markets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
  } catch { /* non-fatal */ }
}
