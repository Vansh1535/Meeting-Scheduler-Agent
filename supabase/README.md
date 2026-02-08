# Supabase Setup Guide

## Overview

This guide walks through setting up Supabase for the AI Meeting Scheduler to persist scheduling outputs, analytics, and explainability data.

## Prerequisites

- Supabase account (https://supabase.com)
- Project created in Supabase dashboard

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - **Name**: `meeting-scheduler-ai`
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier works for development

4. Wait for project provisioning (~2 minutes)

## Step 2: Run Database Schema

### Option A: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy contents of `supabase/schema.sql`
5. Paste into editor
6. Click **Run** (or Ctrl+Enter)
7. Verify tables created: Go to **Table Editor** → Should see 5 tables

### Option B: Command Line (psql)

```bash
# Get connection string from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres" < supabase/schema.sql
```

## Step 3: Get API Credentials

1. Go to **Settings** → **API** in Supabase dashboard
2. Copy the following (needed for Next.js `.env.local`):
   - **Project URL**: `https://[PROJECT_REF].supabase.co`
   - **anon public** key: For client-side (not used in this project)
   - **service_role** key: For server-side (⚠️ KEEP SECRET!)

## Step 4: Configure Environment Variables

Create/update `nextjs-orchestrator/.env.local`:

```env
# Python AI Service
PYTHON_SERVICE_URL=http://localhost:8000
REQUEST_TIMEOUT_MS=30000

# Supabase (Server-side only - DO NOT expose to client)
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# Optional: Enable/disable database persistence
ENABLE_DATABASE_PERSISTENCE=true
```

⚠️ **Security**: 
- `service_role` key bypasses Row Level Security
- NEVER expose this in client-side code
- Only use in Next.js API routes (server-side)

## Step 5: Verify Schema

Check that all tables and indexes were created:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected output:
-- - meetings
-- - meeting_candidates
-- - participant_availability
-- - scheduling_analytics
-- - score_breakdowns

-- List all views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';

-- Expected output:
-- - v_meeting_metrics
-- - v_score_distribution
-- - v_top_candidates
```

## Schema Overview

### Tables

**1. `meetings`** - Main scheduling requests
- Stores high-level meeting info
- Processing results (success, time, candidates)
- Status tracking (pending/scheduled/cancelled)

**2. `meeting_candidates`** - Ranked time slots
- Each candidate from AI Brain
- Full score breakdown per candidate
- Reasoning and conflict info

**3. `score_breakdowns`** - Detailed factor scores
- Availability, preference, proximity, fragmentation, optimization
- Weights used in calculation
- JSON details for explainability

**4. `scheduling_analytics`** - Per-request metrics
- Time savings estimation
- Conflict analysis
- Group preference aggregates

**5. `participant_availability`** - Per-user data
- Busy slots, preferences, patterns
- Useful for debugging and per-user analytics

### Views

**`v_top_candidates`** - Top 3 candidates across all meetings  
**`v_meeting_metrics`** - Daily aggregated success metrics  
**`v_score_distribution`** - Score bucketing and factor averages

## Step 6: Test Connection

From Next.js directory:

```bash
cd nextjs-orchestrator
npm install @supabase/supabase-js

# Test connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase.from('meetings').select('count').then(console.log);
"
```

Expected output: `{ data: [{ count: 0 }], error: null }`

## Step 7: Optional Enhancements

### Enable Row Level Security (Multi-tenant)

If building multi-tenant system where users should only see their meetings:

```sql
-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_candidates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their meetings" ON meetings
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT user_id FROM participant_availability 
            WHERE meeting_id = meetings.id
        )
    );
```

### Add Realtime Subscriptions

Enable realtime for live updates (Supabase Dashboard → Database → Replication):

```typescript
// Listen to new meetings
const subscription = supabase
  .channel('meetings')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'meetings' },
    (payload) => console.log('New meeting:', payload)
  )
  .subscribe();
```

### Create Custom Indexes

For specific query patterns:

```sql
-- If querying by participant email frequently
CREATE INDEX idx_participant_email ON participant_availability(email);

-- If filtering by date range often
CREATE INDEX idx_meetings_date_range ON meetings(earliest_date, latest_date);
```

## Troubleshooting

### Error: "relation does not exist"
- Ensure schema.sql ran successfully
- Check correct database is selected in SQL Editor
- Verify schema is `public` (default)

### Error: "permission denied"
- Use `service_role` key, not `anon` key
- Check API key is correctly copied (no extra spaces)

### Error: "connection refused"
- Verify Supabase project is active (not paused)
- Check SUPABASE_URL is correct
- Ensure no firewall blocking port 443

### Slow Queries
- Check indexes exist: `\di` in psql
- Analyze query plans: `EXPLAIN ANALYZE SELECT ...`
- Consider adding materialized views for heavy aggregations

## Backup & Recovery

### Export Data

```bash
# Export all tables
pg_dump "postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres" > backup.sql

# Export specific table
pg_dump -t meetings "postgresql://..." > meetings_backup.sql
```

### Restore Data

```bash
psql "postgresql://..." < backup.sql
```

## Monitoring

Track key metrics in Supabase Dashboard:

- **Database** → Connection pooling, query performance
- **Logs** → Database logs for errors
- **Reports** → Usage statistics

Set up alerts for:
- High query latency (>100ms)
- Connection pool exhaustion
- Storage usage approaching limits

## Next Steps

1. ✅ Schema created and verified
2. ✅ Environment variables configured
3. ➡️ Implement Next.js integration (see `lib/supabase.ts`)
4. ➡️ Test with sample scheduling request
5. ➡️ Query analytics views for insights

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
