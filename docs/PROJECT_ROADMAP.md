# 📋 Complete Project Roadmap - Multi-User System

## ✅ PHASE 0: FOUNDATION (Completed Today)

### Architecture
- ✅ Consolidated frontend + API layer (removed redundant `nextjs-orchestrator`)
- ✅ Python AI Brain on port 8000
- ✅ Frontend with merged API routes on port 3000
- ✅ Real user context system (UserProvider)
- ✅ Database-backed user storage (Supabase)

### Code Quality
- ✅ Verified no raw LLM output - real engineering present
- ✅ 5-factor AI scoring algorithm
- ✅ Proper OAuth 2.0 architecture
- ✅ Unit tests for all agents

---

## 🔜 PHASE 1: SINGLE USER TEST (Tomorrow - Quick Start)

### Setup (5 min)
- [ ] Insert test user into Supabase:
  ```sql
  INSERT INTO user_accounts (email, display_name, is_active, calendar_sync_enabled)
  VALUES ('42vanshlilani@gmail.com', 'Test User', true, true);
  ```
- [ ] Add sample calendar events to `calendar_events` table

### OAuth Setup (10 min)
- [ ] Get Google OAuth credentials (Client ID + Secret)
- [ ] Add to `frontend/.env.local`:
  ```
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id
  GOOGLE_CLIENT_SECRET=your_secret
  ```

### API Endpoints (2-3 hours)
Basic endpoints needed:
- [ ] `/api/analytics/{userId}` - Dashboard stats
- [ ] `/api/preferences/{userId}` GET/PUT - User preferences
- [ ] `/api/availability/{userId}` GET/PUT - Availability slots
- [ ] `/api/calendar/sync/{userId}` - Sync Google Calendar
- [ ] `/api/calendar/write-back` - Create events in Calendar
- [ ] `/api/schedule/quick` - Quick scheduling endpoint

### Testing (1 hour)
- [ ] Dashboard loads with real user data
- [ ] Google Calendar sync works
- [ ] Can create meeting via AI scheduling
- [ ] Meeting appears in Google Calendar

---

## 👥 PHASE 2: MULTI-USER AUTHENTICATION (3-4 days)

### User Management
- [ ] Implement Auth0 OR Supabase Auth:
  - Decision: Use Supabase Auth (already using Supabase)
  - Easier integration, built-in JWT tokens
  
- [ ] Create auth endpoints:
  - [ ] `/api/auth/login` - Email/password signup
  - [ ] `/api/auth/logout` - Clear session
  - [ ] `/api/auth/register` - New user registration
  - [ ] `/api/auth/me` - Get current logged-in user
  - [ ] `/api/auth/refresh` - Refresh JWT token

### Session Management
- [ ] HttpOnly cookies for JWT tokens (secure)
- [ ] Session middleware to verify auth on protected routes
- [ ] Automatic token refresh before expiry

### User Registration Flow
- [ ] Signup page with email/password
- [ ] Email verification (optional but recommended)
- [ ] User profile setup (display name, timezone, preferences)
- [ ] Welcome email with onboarding

### Database RLS (Row Level Security)
- [ ] Enable RLS on all user-related tables:
  ```sql
  -- Example RLS policy
  ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Users can only see their own data" ON user_accounts
    USING (auth.uid()::uuid = id);
  
  -- Apply to all user tables:
  -- calendar_events, meetings, oauth_tokens, preferences, etc.
  ```
- [ ] Users can ONLY access their own data
- [ ] API enforces user_id validation

---

## 📅 PHASE 3: MULTI-CALENDAR & INTEGRATIONS (2-3 days)

### Multiple Google Calendar Accounts per User
- [ ] Support adding multiple Google Calendar accounts
- [ ] Store multiple OAuth tokens per user
- [ ] Sync from all calendars simultaneously
- [ ] Calendar selection when creating meetings

### Calendar Sync Improvements
- [ ] Background sync task (every 30 min)
- [ ] Sync status tracking
- [ ] Handle 404 errors (calendar/event deleted)
- [ ] Timezone handling for multi-timezone users

### Meeting Participant Management
- [ ] Support adding participants from contacts
- [ ] Contact list from Google Contacts API
- [ ] Search participants by email
- [ ] Participant availability lookup

---

## 🛡️ PHASE 4: SECURITY & PRODUCTION (2-3 days)

### Environment Variables
- [ ] Separate `.env.local` for dev (gitignored)
- [ ] GitHub Secrets for CI/CD
- [ ] Encrypt sensitive data (OAuth tokens in DB)

### API Security
- [ ] Rate limiting on all endpoints
- [ ] CORS properly configured
- [ ] Input validation on all requests
- [ ] SQL injection prevention (already using Supabase)

### Data Protection
- [ ] Encrypt OAuth tokens at rest
- [ ] PII handling compliance
- [ ] Audit logging for user actions
- [ ] Account deletion (GDPR compliance)

### Testing
- [ ] Unit tests for auth flows
- [ ] E2E tests for multi-user scenarios
- [ ] Permission boundary tests (user isolation)
- [ ] Security penetration testing

---

## 🚀 PHASE 5: ADVANCED FEATURES (Optional, 2-3 days)

### Team/Organization Support
- [ ] Create teams/organizations
- [ ] Add members to teams
- [ ] Role-based access (Owner, Admin, Member)
- [ ] Shared calendars
- [ ] Team scheduling

### Meeting Recommendations
- [ ] AI suggestions based on user preferences
- [ ] Recurring meeting optimization
- [ ] Best times for team (overlapping availability)
- [ ] Conflict avoidance ML model

### Analytics & Reporting
- [ ] User dashboard (meetings scheduled, time saved)
- [ ] Admin dashboard (system metrics)
- [ ] Export calendar data
- [ ] Scheduling reports

### Notification System
- [ ] Email reminders before meetings
- [ ] Calendar sync confirmations
- [ ] Meeting creation notifications
- [ ] Conflict alerts

---

## 📊 Architecture: Single vs Multi-User

### PHASE 1: Single User (Current)
```
Frontend (Port 3000)
    ↓
UserProvider with hardcoded test user
    ↓
API Endpoints (/api/*)
    ↓
Supabase (user_id query filtering)
    ↓
Database (one user's data)
```

### PHASE 2: Multi-User
```
Frontend (Port 3000)
    ↓
Login Page (Email/Password)
    ↓
Supabase Auth (JWT Token)
    ↓
Middleware (Verify JWT)
    ↓
API Endpoints (/api/*, with auth check)
    ↓
UserProvider (from JWT token)
    ↓
Supabase + RLS (user_id auto-filtered)
    ↓
Database (isolated per user)
```

---

## 📁 Files to Create/Modify

### Phase 1
- `frontend/app/api/analytics/{userId}/route.ts` - Analytics endpoint
- `frontend/app/api/preferences/{userId}/route.ts` - Preferences
- `frontend/app/api/calendar/sync/{userId}/route.ts` - Calendar sync
- Update API client to handle real responses

### Phase 2
- `frontend/app/auth/login/page.tsx` - Login page
- `frontend/app/auth/register/page.tsx` - Signup page
- `frontend/app/api/auth/login/route.ts` - Login endpoint
- `frontend/app/api/auth/register/route.ts` - Register endpoint
- `frontend/lib/auth.ts` - Auth utilities
- `frontend/middleware.ts` - Auth middleware
- Database migrations for RLS policies

### Phase 3
- `frontend/app/api/google/callback/route.ts` - OAuth callback
- `frontend/components/calendar-sync.tsx` - Sync UI
- Background jobs for periodic sync

---

## 🎯 Key Decisions to Make

1. **Authentication Provider**
   - Option A: Supabase Auth (recommended - easier, already using Supabase)
   - Option B: Auth0 (more features but overkill)
   - Option C: Custom JWT (more work, not recommended)

2. **Multi-Calendar Strategy**
   - Option A: One primary calendar per user, optional secondary
   - Option B: Support unlimited calendars, merge availability
   - Option C: Calendar selection per meeting request

3. **Team Support?**
   - Option A: Just individual users (MVP)
   - Option B: Teams/organizations (features phase)

4. **Payment Model?**
   - Option A: Free tier (basic scheduling)
   - Option B: Freemium (premium features)
   - Option C: Paid only

---

## 📈 Estimated Effort

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1 (Single User MVP) | 1 day | Medium |
| Phase 2 (Multi-User Auth) | 3-4 days | High |
| Phase 3 (Integrations) | 2-3 days | Medium |
| Phase 4 (Security) | 2-3 days | High |
| Phase 5 (Advanced) | Optional | Medium-High |

**Total for MVP with multi-user:** ~1 week

---

## ✨ Success Criteria

✅ **Phase 1 Complete:**
- Single test user can schedule meetings
- AI recommendations work
- Meetings sync to Google Calendar

✅ **Phase 2 Complete:**
- Multiple users can sign up
- Each user sees only their own data
- RLS enforces isolation

✅ **Phase 3 Complete:**
- Users can connect multiple Google Calendars
- Background sync works
- Participant lookup works

✅ **Phase 4 Complete:**
- All security vulnerabilities patched
- Rate limiting active
- Audit logging working

✅ **Full MVP Complete:**
- Production-ready multi-user meeting scheduler
- Real AI optimization
- Secure, scalable, maintainable

---

## 🚦 Next Steps

**Tomorrow morning:**
1. Pick authentication provider (recommend Supabase Auth)
2. Set up test user
3. Implement Phase 1 API endpoints
4. Do E2E test with real Gmail account

**Then proceed to Phase 2 (multi-user auth)**

---

**Remember:** Phase 1 (single user) is your MVP proof of concept. Phase 2 (multi-user) makes it production-ready. You can launch Phase 1 first, then add auth later!
