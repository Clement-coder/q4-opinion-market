# Q4 Supabase Edge Functions

Two serverless functions that power the Q4 backend automation.

---

## Functions

### `resolve-markets`
Finds all expired markets, determines their outcome via oracle data, calculates rewards, and notifies users.

**Handles:**
- Auto-closes active markets past their deadline
- Crypto markets: fetches live price from CoinGecko and compares to question threshold
- Calculates winner rewards (98% of losing pool, proportional to stake)
- Inserts `rewards` rows for each winner
- Inserts `notifications` for all participants
- Logs `oracle_results` and `market_events`

**Sports / Weather / Stocks** markets are flagged for manual resolution via the admin panel.

### `generate-markets`
Auto-generates prediction markets from templates using live CoinGecko prices. Runs daily.

**Creates:**
- 2 Bitcoin markets (above current price and above current −$2000)
- 1 Ethereum market
- 1 Quai market
- Skips markets that already exist today

---

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
supabase login
```

### 2. Link your project

```bash
cd /path/to/Q4
supabase link --project-ref mkzqwezmksfvgpwvvbiz
```

### 3. Set secrets

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set COINGECKO_API_KEY=your_coingecko_key  # optional
supabase secrets set OPENWEATHER_API_KEY=your_key          # for weather markets
supabase secrets set ALPHAVANTAGE_API_KEY=your_key         # for stocks markets
```

### 4. Deploy

```bash
supabase functions deploy resolve-markets
supabase functions deploy generate-markets
```

---

## Run the SQL policies first

Before deploying, run `SQL/add_policies.sql` in the Supabase SQL Editor. This adds the missing RLS policies that allow the service role to insert rewards, notifications, and oracle results.

---

## Scheduling (Cron)

Call these functions on a schedule. Options:

**Option A — Supabase pg_cron** (run in SQL Editor):
```sql
-- Resolve markets every 5 minutes
select cron.schedule(
  'resolve-markets',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://mkzqwezmksfvgpwvvbiz.supabase.co/functions/v1/resolve-markets',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

-- Generate markets daily at midnight UTC
select cron.schedule(
  'generate-markets',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://mkzqwezmksfvgpwvvbiz.supabase.co/functions/v1/generate-markets',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Option B — External cron** (GitHub Actions, cron-job.org, etc.):
```bash
# Every 5 minutes
curl -X POST https://mkzqwezmksfvgpwvvbiz.supabase.co/functions/v1/resolve-markets \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## Manual trigger

```bash
# Resolve all expired markets now
curl -X POST https://mkzqwezmksfvgpwvvbiz.supabase.co/functions/v1/resolve-markets \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Generate today's markets now
curl -X POST https://mkzqwezmksfvgpwvvbiz.supabase.co/functions/v1/generate-markets \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```
