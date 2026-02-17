# Real User Setup - No Mock Data

## ✅ What I've Done

I've replaced all mock data with a **real user system**. Now the frontend will:

1. **Use a single test user**: `42vanshlilani@gmail.com`
2. **Fetch real data from backend/database** instead of hardcoded mock data
3. **Store all user data in Supabase** for persistence
4. **Support calendar integration** with the Gmail account

---

## 📋 Setup Steps

### Step 1: Set Up Test User in Supabase

You need to insert the test user into your Supabase database. Run this SQL in Supabase:

```sql
-- Insert test user
INSERT INTO user_accounts (email, display_name, is_active, calendar_sync_enabled)
VALUES ('42vanshlilani@gmail.com', 'Test User', true, true)
ON CONFLICT(email) DO NOTHING;
```

Or use the Supabase dashboard:
1. Go to `user_accounts` table
2. Click "Insert row"
3. Add:
   - `email`: `42vanshlilani@gmail.com`
   - `display_name`: `Test User`
   - `is_active`: true
   - `calendar_sync_enabled`: true

### Step 2: Test Sample Data (Optional)

To test with real meeting data, insert some test events:

```sql
-- Get your test user ID first
SELECT id FROM user_accounts WHERE email = '42vanshlilani@gmail.com';

-- Then insert a sample calendar event (replace USER_ID below)
INSERT INTO calendar_events (
  user_id,
  google_event_id,
  google_calendar_id,
  title,
  start_time,
  end_time,
  timezone,
  status,
  is_organizer,
  attendee_count
) VALUES (
  'USER_ID_HERE',
  'event-sample-001',
  'primary',
  'Team Standup',
  NOW() + INTERVAL '1 day 10:00',
  NOW() + INTERVAL '1 day 10:30',
  'America/New_York',
  'confirmed',
  true,
  3
);
```

### Step 3: Start the Services

```powershell
# Terminal 1: Python AI Brain
cd C:\Users\lilan\Desktop\ScaleDown_Proj\python-service
python main.py  # Runs on port 8000

# Terminal 2: Frontend (with API routes)
cd C:\Users\lilan\Desktop\ScaleDown_Proj\frontend
npm run dev  # Runs on port 3000
```

### Step 4: Add Gmail to OAuth (When Ready)

When you want to test Google Calendar integration:

1. In `frontend/.env.local`, add:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

2. The system will automatically link the Gmail account to the test user

---

## 🏗️ Architecture Changes

### Before (Mock Data)
```
Frontend Component
    ↓
useAnalytics() hook
    ↓
Hardcoded demo data → Display to user
```

### After (Real Data)
```
Frontend Component
    ↓
useAnalytics(userId) hook
    ↓
API call: /api/analytics/{userId}
    ↓
Backend: Fetch from Supabase
    ↓
Real data → Display to user
```

---

## 🔄 Data Flow

1. **User Context (`UserProvider`)** 
   - Initializes with test user: `42vanshlilani@gmail.com`
   - Fetches/creates user in `user_accounts` table
   - Makes user available to all components via `useUser()` hook

2. **API Hooks** (Updated)
   - `useAnalytics()` → Fetches from `/api/analytics/{userId}`
   - `useCalendarEvents()` → Fetches from `/api/calendar/events`
   - `usePreferences()` → Fetches from `/api/preferences/{userId}`
   - All include `userId` from `useUser()` context

3. **Backend Endpoints** (New)
   - `/api/auth/user` → Get/create user from email
   - `/api/calendar/events` → Fetch user's calendar events
   - `/api/analytics/{userId}` → Fetch user analytics (if implemented)

4. **Database** (Supabase)
   - `user_accounts` → Test user profile
   - `calendar_events` → Real calendar events
   - `meetings` → Scheduling results
   - All queries filtered by `user_id`

---

## 🧪 Testing Checklist

- [ ] Test user created in `user_accounts` table
- [ ] Frontend loads without errors
- [ ] Dashboard shows "Loading..." initially
- [ ] Analytics cards load real data (or show warning if backend down)
- [ ] Upcoming Events fetches from `calendar_events` table
- [ ] No mock data hardcoded anywhere
- [ ] User email `42vanshlilani@gmail.com` displays in headers/settings
- [ ] Calendar sync works when you add Gmail credentials

---

## 📝 File Changes Summary

### Created:
- `contexts/user-context.tsx` - User management context
- `app/api/auth/user/route.ts` - Get/create user endpoint
- `app/api/calendar/events/route.ts` - Fetch calendar events endpoint

### Modified:
- `app/layout.tsx` - Added `UserProvider`
- `hooks/use-api.ts` - Updated all hooks to use real user from context
- `components/dashboard/stats-cards.tsx` - Fetch real analytics
- `components/dashboard/upcoming-events.tsx` - Fetch real calendar events
- `lib/api.ts` - Updated API endpoints

---

## ✨ Next Steps

1. ✅ Set up test user in Supabase
2. ✅ Start services (Python + Frontend)
3. ✅ Test dashboard with real data
4. 🔜 Add Google Calendar OAuth credentials
5. 🔜 Sync real calendar data
6. 🔜 Run full scheduling pipeline with real events

---

**Everything is now ready for real data!** The system is built to use a single test user with real backing from the database.
