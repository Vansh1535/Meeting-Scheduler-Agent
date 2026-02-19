# Event Count Verification Guide

This guide helps you cross-verify why Dashboard shows different counts than Calendar.

## Quick Verification Steps

### 1. **Check Browser User ID**

Open your browser console (F12) on the Dashboard page and paste this:
```javascript
localStorage.getItem('userId') || localStorage.getItem('user')
```

Copy the result - this is your **USER_ID**.

OR run the full diagnostic:
```javascript
// Copy and paste the contents of test/verify_browser_user.js
```

---

### 2. **Check API Responses** (if Next.js dev server is running)

Run the PowerShell script:
```powershell
./test/verify_counts_local.ps1
```

This shows:
- Calendar events for February 2026
- Analytics API response (current month)
- Analytics API response (last 30 days)

---

### 3. **Check Database Directly** (most accurate)

Go to your Supabase SQL Editor:
1. Open [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to SQL Editor
4. Open `test/verify_database_queries.sql`
5. Replace `'YOUR_USER_ID'` with the user ID from step 1
6. Run the queries

This shows:
- ✅ Exact calendar events in February 2026
- ✅ All calendar events (any month)
- ✅ AI meetings by status (scheduled/pending/cancelled)
- ✅ Expected dashboard total

---

## What to Look For

### Calendar Shows: **7 events**
- This comes from `calendar_events` table
- Filtered to current month (February 2026)
- Query: `WHERE start_time >= '2026-02-01' AND start_time <= '2026-02-28'`

### Dashboard Shows: **15 events** (or different number)

Possible causes:
1. **Including events from other months** - Check SQL Query #2
2. **Including pending AI meetings** - Check SQL Query #3 (should only count status='scheduled')
3. **Wrong user ID** - Check which user_id has data (SQL Query #5)
4. **Including future months** - Was bug, now fixed with upper date bound

---

## Expected Results

After our fixes, Dashboard should count:

```
Calendar Events (Feb 1-28, 2026)     = X
+ AI Meetings (status='scheduled')    = Y
-----------------------------------------
Total Events (Dashboard)              = X + Y
```

Calendar page should show: **X events** (same as calendar_events count)

---

## Files Created

1. **verify_counts_local.ps1** - Test via API (local server must be running)
2. **verify_database_queries.sql** - Test via Supabase SQL (most reliable)
3. **verify_browser_user.js** - Get user ID from browser console

---

## Common Issues

### Issue: No events showing
**Check:** Is Google Calendar synced? Go to Settings > Connect Google Calendar

### Issue: Counts don't match
**Check:** Run SQL Query #6 (Detailed Breakdown) to see all events side-by-side

### Issue: Dashboard shows old count
**Check:** Hard refresh browser (Ctrl+Shift+R) to clear cache

### Issue: API returns 0 but Supabase shows data
**Check:** User ID mismatch - browser using different user than database

---

## Need More Help?

Run this to see everything:
```powershell
# 1. Get browser user ID (open browser console)
# See: test/verify_browser_user.js

# 2. Test local APIs
./test/verify_counts_local.ps1

# 3. Query database directly
# Use: test/verify_database_queries.sql in Supabase SQL Editor
```
