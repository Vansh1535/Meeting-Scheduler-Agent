-- ========================================
-- DATABASE VERIFICATION QUERIES
-- Run these in Supabase SQL Editor or psql
-- ========================================

-- Replace 'YOUR_USER_ID' with your actual user ID
-- You can find it in your browser localStorage or .env.local

-- ========================================
-- 1. CALENDAR EVENTS IN FEBRUARY 2026
-- ========================================
-- This is what the Calendar View shows
-- This is what Dashboard should count (partial)

SELECT 
    user_id,
    title,
    summary,
    start_time,
    end_time,
    category,
    DATE(start_time) as event_date
FROM calendar_events
WHERE user_id = 'YOUR_USER_ID'  -- <-- Replace this
  AND start_time >= '2026-02-01T00:00:00.000Z'
  AND start_time <= '2026-02-28T23:59:59.999Z'
ORDER BY start_time;

-- Count:
SELECT COUNT(*) as calendar_events_count
FROM calendar_events
WHERE user_id = 'YOUR_USER_ID'  -- <-- Replace this
  AND start_time >= '2026-02-01T00:00:00.000Z'
  AND start_time <= '2026-02-28T23:59:59.999Z';


-- ========================================
-- 2. ALL CALENDAR EVENTS (ANY MONTH)
-- ========================================
-- To see if events exist but in different months

SELECT 
    user_id,
    title,
    summary,
    start_time,
    category,
    DATE(start_time) as event_date,
    EXTRACT(YEAR FROM start_time) as year,
    EXTRACT(MONTH FROM start_time) as month
FROM calendar_events
WHERE user_id = 'YOUR_USER_ID'  -- <-- Replace this
ORDER BY start_time
LIMIT 20;

-- Count by month:
SELECT 
    EXTRACT(YEAR FROM start_time) as year,
    EXTRACT(MONTH FROM start_time) as month,
    COUNT(*) as count
FROM calendar_events
WHERE user_id = 'YOUR_USER_ID'  -- <-- Replace this
GROUP BY year, month
ORDER BY year, month;


-- ========================================
-- 3. AI MEETINGS (ALL STATUSES)
-- ========================================
-- Shows AI-scheduled meetings by status

-- First, get your meeting IDs:
SELECT 
    user_id,
    meeting_id,
    COUNT(*) as participation_count
FROM participant_availability
WHERE user_id = 'YOUR_USER_ID'  -- <-- Replace this
GROUP BY user_id, meeting_id;

-- Then check meeting details:
SELECT 
    m.meeting_id,
    m.status,
    m.requested_at,
    m.duration_minutes,
    m.participant_count,
    m.success,
    EXTRACT(YEAR FROM m.requested_at) as year,
    EXTRACT(MONTH FROM m.requested_at) as month
FROM meetings m
WHERE m.id IN (
    SELECT DISTINCT pa.meeting_id::uuid
    FROM participant_availability pa
    WHERE pa.user_id = 'YOUR_USER_ID'  -- <-- Replace this
)
ORDER BY m.requested_at DESC;

-- Count AI meetings by status (February 2026):
SELECT 
    m.status,
    COUNT(*) as count
FROM meetings m
WHERE m.id IN (
    SELECT DISTINCT pa.meeting_id::uuid
    FROM participant_availability pa
    WHERE pa.user_id = 'YOUR_USER_ID'  -- <-- Replace this
)
  AND m.requested_at >= '2026-02-01T00:00:00.000Z'
  AND m.requested_at <= '2026-02-28T23:59:59.999Z'
GROUP BY m.status;


-- ========================================
-- 4. EXPECTED DASHBOARD COUNT
-- ========================================
-- What should appear on Dashboard "Total Events"

SELECT 
    (
        -- Calendar events in current month
        SELECT COUNT(*)
        FROM calendar_events
        WHERE user_id = 'YOUR_USER_ID'  -- <-- Replace this
          AND start_time >= DATE_TRUNC('month', CURRENT_DATE)
          AND start_time < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ) +
    (
        -- AI meetings with status='scheduled' in current month
        SELECT COUNT(*)
        FROM meetings m
        WHERE m.status = 'scheduled'
          AND m.id IN (
              SELECT DISTINCT pa.meeting_id::uuid
              FROM participant_availability pa
              WHERE pa.user_id = 'YOUR_USER_ID'  -- <-- Replace this
          )
          AND m.requested_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND m.requested_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ) as expected_dashboard_total;


-- ========================================
-- 5. CHECK WHICH USER ID HAS DATA
-- ========================================
-- If you're not sure which user_id has the events

SELECT DISTINCT user_id, COUNT(*) as event_count
FROM calendar_events
GROUP BY user_id
ORDER BY event_count DESC;

-- Check what user IDs exist:
SELECT DISTINCT user_id
FROM participant_availability
LIMIT 10;


-- ========================================
-- 6. DETAILED BREAKDOWN
-- ========================================
-- See exactly what makes up the counts

WITH calendar_feb AS (
    SELECT 'calendar_event' as source, title, start_time
    FROM calendar_events
    WHERE user_id = 'YOUR_USER_ID'  -- <-- Replace this
      AND start_time >= '2026-02-01T00:00:00.000Z'
      AND start_time <= '2026-02-28T23:59:59.999Z'
),
meetings_feb AS (
    SELECT 'ai_meeting' as source, m.meeting_id as title, m.requested_at as start_time
    FROM meetings m
    WHERE m.status = 'scheduled'
      AND m.id IN (
          SELECT DISTINCT pa.meeting_id::uuid
          FROM participant_availability pa
          WHERE pa.user_id = 'YOUR_USER_ID'  -- <-- Replace this
      )
      AND m.requested_at >= '2026-02-01T00:00:00.000Z'
      AND m.requested_at <= '2026-02-28T23:59:59.999Z'
)
SELECT * FROM calendar_feb
UNION ALL
SELECT * FROM meetings_feb
ORDER BY start_time;
