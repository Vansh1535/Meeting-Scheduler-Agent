# 🎨 Premium Minimalist Scheduling App - Complete Build Prompt

**Target**: Multi-page responsive app where users spend < 2 minutes scheduling meetings  
**Approach**: Two user personas - Quick users (30 seconds) and Planners (2 minutes)  
**Style**: Premium minimalist, seamless UI, works on all devices

---

## 📋 App Requirements

### Core Principles
- ✅ **Multi-page application** with 5 distinct pages
- ✅ **Fully responsive** for mobile, tablet, and desktop
- ✅ **Two user flows**: Quick (⚡ 30s) and Planner (📅 2min)
- ✅ **Premium minimalist design** with smooth animations
- ✅ **Dark mode support** from day 1
- ✅ **Seamless UX** with optimistic UI and micro-interactions

### User Goals
1. **Quick User**: Schedule a meeting in 30 seconds with minimal clicks
2. **Planner User**: Review calendar, analyze options, fine-tune preferences in 2 minutes
3. **Analytics User**: See time saved, meeting quality, and scheduling insights

---

## 🏗️ App Structure (5 Pages)

```
┌─────────────────────────────────────────────┐
│           NAVIGATION STRUCTURE               │
└─────────────────────────────────────────────┘

/                    → Home/Dashboard
/quick               → Quick Schedule (Fast Flow)
/calendar            → Calendar Planner (Deep Flow)
/analytics           → Analytics & Insights
/settings            → Settings & Preferences

[Bottom Navigation on Mobile]
🏠 Home | ⚡ Quick | 📅 Calendar | 📊 Analytics
```

### Page Details

#### **1. Home/Dashboard (`/`)**
**Purpose**: Landing page with quick stats and two CTAs

**Layout**:
```
┌────────────────────────────────────────────┐
│  🤖 Smart Scheduler              [⚙️] 👤  │
├────────────────────────────────────────────┤
│                                            │
│  📊 Today's Summary                        │
│  ┌────────────────────────────────────┐   │
│  │  3 meetings scheduled              │   │
│  │  ⏱️ 45 min saved this week          │   │
│  │  ✅ 100% success rate              │   │
│  └────────────────────────────────────┘   │
│                                            │
│  Choose Your Flow                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │   ⚡ Quick   │  │  📅 Planner  │      │
│  │   Schedule   │  │   Mode       │      │
│  │              │  │              │      │
│  │  30 seconds  │  │  2 minutes   │      │
│  │  Perfect for │  │  Full control│      │
│  │  urgent      │  │  over details│      │
│  └──────────────┘  └──────────────┘      │
│                                            │
│  📋 Recent Activity                        │
│  ┌────────────────────────────────────┐   │
│  │ ✓ Team Sync                        │   │
│  │   Today at 2:00 PM with @alice     │   │
│  │   Score: 95 • No conflicts         │   │
│  ├────────────────────────────────────┤   │
│  │ ✓ 1:1 with Bob                     │   │
│  │   Tomorrow at 10:00 AM             │   │
│  │   Score: 88 • Morning slot         │   │
│  ├────────────────────────────────────┤   │
│  │ ⏰ Planning Session                 │   │
│  │   Friday at 3:00 PM                │   │
│  │   Score: 82 • After lunch          │   │
│  └────────────────────────────────────┘   │
│                                            │
│  [View All Meetings →]                     │
│                                            │
└────────────────────────────────────────────┘
```

**Components**:
- Stats cards (meetings today, time saved, success rate)
- Two large CTA buttons (Quick vs Planner)
- Recent activity list (last 5 meetings)
- Bottom navigation

**API Endpoints**:
- `GET /api/analytics?user_id=xxx` - Get stats
- `GET /api/analytics/recent-activity?user_id=xxx` - Get recent meetings

---

#### **2. Quick Schedule (`/quick`)**
**Purpose**: Ultra-fast scheduling with AI-suggested slots

**Flow**:
```
Step 1: Natural language input
        ↓
Step 2: AI analyzes and suggests 3 best slots
        ↓
Step 3: One-click confirm
        ↓
Step 4: Success! Calendar event created
```

**Layout**:
```
┌────────────────────────────────────────────┐
│  ← Back                                    │
├────────────────────────────────────────────┤
│                                            │
│         ⚡ Quick Schedule                  │
│         Schedule in 30 seconds             │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │ 💬 Team sync with @alice @bob      │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│           👆 Describe your meeting         │
│                                            │
│  ⏱️ Duration: [60 min ▾]                   │
│                                            │
│  🎯 AI suggests these top slots:           │
│                                            │
│  ┌─────────────────────────────────┐      │
│  │ 🥇 Today, 2:00 PM                │      │
│  │ Score: 95/100                    │      │
│  │ ✓ All available                  │      │
│  │ ✓ Good preference alignment      │      │
│  │ ✓ No conflicts                   │      │
│  │                                  │      │
│  │     [Schedule This] ←────────    │      │
│  └─────────────────────────────────┘      │
│                                            │
│  ┌─────────────────────────────────┐      │
│  │ 🥈 Tomorrow, 10:00 AM            │      │
│  │ Score: 88/100                    │      │
│  │ ✓ All available                  │      │
│  │ ⚠️ Morning slot                   │      │
│  │ ✓ No conflicts                   │      │
│  └─────────────────────────────────┘      │
│                                            │
│  ┌─────────────────────────────────┐      │
│  │ 🥉 Friday, 3:00 PM               │      │
│  │ Score: 82/100                    │      │
│  │ ⚠️ 1 conflict (moveable)          │      │
│  │ ✓ After lunch                    │      │
│  │ ✓ End of week                    │      │
│  └─────────────────────────────────┘      │
│                                            │
│  [View More Options →]                     │
│                                            │
└────────────────────────────────────────────┘

[After clicking "Schedule This"]
┌────────────────────────────────────────────┐
│                                            │
│            ✅ Meeting Scheduled!            │
│                                            │
│         Team Sync with Alice, Bob          │
│         Today at 2:00 PM                   │
│                                            │
│     📧 Invites sent to all participants    │
│     🔗 Google Meet link added              │
│     📅 Added to your calendar              │
│                                            │
│     [View in Calendar] [Schedule Another]  │
│                                            │
└────────────────────────────────────────────┘
```

**Features**:
- Natural language input with @mentions for participants
- Auto-suggest participants from recent contacts
- Duration dropdown (15, 30, 60, 90 min)
- Show top 3 AI-ranked candidates with scores
- Score breakdown on hover/tap
- One-click scheduling with optimistic UI
- Success animation with confetti
- Auto-redirect to calendar after 3 seconds

**Components**:
- Text input with autocomplete
- Select dropdown for duration
- Candidate cards with score badges
- Modal for success confirmation
- Loading skeleton while AI processes

**API Endpoints**:
- `POST /api/schedule` - Schedule meeting with AI
- `POST /api/calendar/write-back` - Create calendar event

---

#### **3. Calendar Planner (`/calendar`)**
**Purpose**: Full calendar view with visual scheduling

**Layout (Desktop)**:
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back       📅 Week of Feb 10-16, 2026    [Today] [⚙️] 👤 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Day] [Week] [Month]                      [+ New Meeting]   │
│                                                               │
│  🕐   Mon 10    Tue 11    Wed 12    Thu 13    Fri 14         │
│  ────────────────────────────────────────────────────────────│
│  8am                                                          │
│  ────────────────────────────────────────────────────────────│
│  9am  ┌────────┐                   ┌────────┐               │
│       │ Team   │                   │ 1:1    │               │
│ 10am  │ Sync   │           [+]     │ Alice  │               │
│       │ 2hr    │                   │ 1hr    │               │
│ 11am  └────────┘                   └────────┘               │
│  ────────────────────────────────────────────────────────────│
│ 12pm                      ┌────────┐                         │
│                           │ Lunch  │                         │
│  1pm                      │ Break  │                         │
│                           └────────┘                         │
│  ────────────────────────────────────────────────────────────│
│  2pm                                          ┌────────┐     │
│                                               │ Review │     │
│  3pm                                          │ 1hr    │     │
│                                               └────────┘     │
│  ────────────────────────────────────────────────────────────│
│  4pm                                                          │
│  ────────────────────────────────────────────────────────────│
│  5pm                                                          │
│  ────────────────────────────────────────────────────────────│
│                                                               │
│  👆 Click empty slot to schedule • Drag to reschedule        │
│                                                               │
└──────────────────────────────────────────────────────────────┘

[Modal when clicking empty slot]
┌───────────────────────────────────────────┐
│  Schedule Meeting                    [×]  │
├───────────────────────────────────────────┤
│                                           │
│  📅 Wednesday, Feb 12                     │
│  🕐 11:00 AM - 12:00 PM                   │
│                                           │
│  👥 Participants                          │
│  [@alice] [@bob] [@charlie]               │
│  + Add participant                        │
│                                           │
│  📝 Title                                 │
│  [Team Planning Session          ]        │
│                                           │
│  ⏱️ Duration                              │
│  [60 minutes ▾]                           │
│                                           │
│  🎯 AI Recommendations                    │
│  ┌─────────────────────────────────┐     │
│  │ ✓ Wed 11am (Score: 95) ← Current│     │
│  │ ○ Wed 2pm (Score: 88)           │     │
│  │ ○ Thu 10am (Score: 85)          │     │
│  │ ○ Fri 3pm (Score: 80)           │     │
│  └─────────────────────────────────┘     │
│                                           │
│  🛡️ Enforcement Checks                    │
│  ✓ Buffer time: 15 min before/after      │
│  ✓ No travel conflicts                   │
│  ✓ Cancellation risk: Low (12%)          │
│                                           │
│  [Cancel]  [Schedule Meeting →]           │
│                                           │
└───────────────────────────────────────────┘
```

**Layout (Mobile)**:
```
┌────────────────────────┐
│  ← Feb 12, 2026   ≡    │
├────────────────────────┤
│                        │
│  [Day] [Week] [Month]  │
│                        │
│  Wednesday, Feb 12     │
│  ─────────────────────│
│                        │
│  8:00 AM               │
│  ─────────────────────│
│  9:00 AM               │
│  ┌──────────────────┐ │
│  │ Team Sync        │ │
│  │ 9:00 - 11:00 AM  │ │
│  │ with @alice      │ │
│  └──────────────────┘ │
│  ─────────────────────│
│ 11:00 AM              │
│      [+]              │
│  ─────────────────────│
│ 12:00 PM              │
│  ┌──────────────────┐ │
│  │ Lunch Break      │ │
│  └──────────────────┘ │
│  ─────────────────────│
│  2:00 PM              │
│      [+]              │
│                        │
│  [+ New Meeting]       │
│                        │
└────────────────────────┘
```

**Features**:
- Week/Month view toggle (Day view on mobile)
- Click empty slot to open scheduling modal
- Drag-and-drop to reschedule meetings
- Visual conflict indicators (red border)
- Color-coded events by type
- Sync with Google Calendar in real-time
- Show AI scores on existing meetings
- Hover to see enforcement checks

**Components**:
- Calendar component (React Big Calendar or FullCalendar)
- Modal for new meeting
- Participant selector with autocomplete
- AI candidate list with radio buttons
- Enforcement status badges
- Drag handles for rescheduling

**API Endpoints**:
- `GET /api/calendar/events?user_id=xxx&start=xxx&end=xxx` - Get calendar events
- `POST /api/schedule` - Get AI recommendations
- `POST /api/calendar/write-back` - Create event
- `PUT /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event

---

#### **4. Analytics (`/analytics`)**
**Purpose**: Show time saved, meeting quality, and insights

**Layout**:
```
┌────────────────────────────────────────────┐
│  ← Back          Analytics          [👤]   │
├────────────────────────────────────────────┤
│                                            │
│  📊 This Month                [Feb 2026 ▾] │
│                                            │
│  ⏱️ Time Saved                             │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  │         3 hours 45 min             │   │
│  │                                    │   │
│  │    ▁▃▅▇█▇▅▃▁ (sparkline chart)    │   │
│  │                                    │   │
│  │  vs last month: +25% ↑             │   │
│  └────────────────────────────────────┘   │
│                                            │
│  🎯 Meeting Quality Score                  │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  │         87 / 100                   │   │
│  │     ████████████████▒▒▒            │   │
│  │                                    │   │
│  │  ✓ 28 successful meetings          │   │
│  │  ⚠️  2 rescheduled                  │   │
│  │  ❌ 0 cancelled                     │   │
│  └────────────────────────────────────┘   │
│                                            │
│  📈 Key Metrics                            │
│  ┌──────────────┐  ┌──────────────┐      │
│  │ Conflicts    │  │ Iterations   │      │
│  │ Avoided      │  │ Saved        │      │
│  │              │  │              │      │
│  │     12       │  │     45       │      │
│  └──────────────┘  └──────────────┘      │
│                                            │
│  📅 Meeting Breakdown                      │
│  ┌────────────────────────────────────┐   │
│  │  Quick Scheduled:    18 (60%)      │   │
│  │  Planner Mode:       10 (33%)      │   │
│  │  Manual:              2 (7%)       │   │
│  │                                    │   │
│  │  [Bar chart visualization]         │   │
│  └────────────────────────────────────┘   │
│                                            │
│  🔄 Recurring Optimization                 │
│  ┌────────────────────────────────────┐   │
│  │  💡 3 recurring meetings could be  │   │
│  │     optimized for better slots     │   │
│  │                                    │   │
│  │  [View Suggestions →]              │   │
│  └────────────────────────────────────┘   │
│                                            │
│  🏆 Best Scheduling Days                   │
│  ┌────────────────────────────────────┐   │
│  │  Tuesday:    Avg score 92          │   │
│  │  Thursday:   Avg score 89          │   │
│  │  Friday:     Avg score 85          │   │
│  └────────────────────────────────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

**Features**:
- Time period selector (This Week, This Month, Last 3 Months)
- Large metric cards with trends
- Sparkline charts for time saved over time
- Meeting quality score with breakdown
- Conflicts avoided counter
- Scheduling method breakdown (pie/bar chart)
- Recurring optimization suggestions
- Best days/times analysis
- Export report button

**Components**:
- Stat cards with icons
- Line/sparkline charts (Recharts)
- Bar chart for breakdown
- Progress bars
- Trend indicators (↑↓)
- Date range selector

**API Endpoints**:
- `GET /api/analytics?user_id=xxx` - Get main analytics
- `GET /api/analytics/scheduling?user_id=xxx` - Get scheduling stats
- `GET /api/analytics/performance?user_id=xxx` - Get performance metrics

---

#### **5. Settings (`/settings`)**
**Purpose**: Configure account, preferences, and integrations

**Layout**:
```
┌────────────────────────────────────────────┐
│  ← Back          Settings           [👤]   │
├────────────────────────────────────────────┤
│                                            │
│  [Account] [Preferences] [Integrations]    │
│                                            │
│  Account Settings                          │
│  ┌────────────────────────────────────┐   │
│  │  Profile                           │   │
│  │  ┌──────┐                          │   │
│  │  │ 👤   │  John Doe               │   │
│  │  └──────┘  john@example.com       │   │
│  │                                    │   │
│  │  [Edit Profile]                    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  🗓️ Google Calendar                        │
│  ┌────────────────────────────────────┐   │
│  │  ✅ Connected                       │   │
│  │  john@gmail.com                    │   │
│  │  Last synced: 2 min ago            │   │
│  │                                    │   │
│  │  [Sync Now]  [Disconnect]          │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ⏰ Working Hours                           │
│  ┌────────────────────────────────────┐   │
│  │  Start: [9:00 AM ▾]                │   │
│  │  End:   [6:00 PM ▾]                │   │
│  │                                    │   │
│  │  Timezone: [PST - Los Angeles ▾]   │   │
│  └────────────────────────────────────┘   │
│                                            │
│  🎯 Scheduling Preferences                 │
│  ┌────────────────────────────────────┐   │
│  │  Default Meeting Duration          │   │
│  │  [60 minutes ▾]                    │   │
│  │                                    │   │
│  │  Buffer Time                       │   │
│  │  [15 minutes ▾]                    │   │
│  │  ▒▒▒▒▒▒▒▒░░░ 15 min               │   │
│  │                                    │   │
│  │  Max Travel Time                   │   │
│  │  [30 minutes ▾]                    │   │
│  │                                    │   │
│  │  Cancellation Risk Threshold       │   │
│  │  Block meetings above: [70% ▾]     │   │
│  └────────────────────────────────────┘   │
│                                            │
│  🔔 Notifications                           │
│  ┌────────────────────────────────────┐   │
│  │  [✓] Meeting reminders             │   │
│  │  [✓] Schedule change alerts        │   │
│  │  [✓] AI suggestions                │   │
│  │  [ ] Weekly summary                │   │
│  └────────────────────────────────────┘   │
│                                            │
│  🎨 Appearance                             │
│  ┌────────────────────────────────────┐   │
│  │  Theme                             │   │
│  │  ( ) Light  (•) Dark  ( ) Auto     │   │
│  └────────────────────────────────────┘   │
│                                            │
│  [Save Changes]                            │
│                                            │
└────────────────────────────────────────────┘
```

**Features**:
- OAuth connection status for Google Calendar
- One-click "Connect Google Calendar" button
- Working hours configuration
- Timezone selector
- Default preferences (duration, buffer, travel time)
- Cancellation risk threshold slider
- Notification toggles
- Theme selector (Light/Dark/Auto)
- Save button with loading state

**Components**:
- Tabs for different settings sections
- Toggle switches
- Select dropdowns
- Slider for buffer time
- Radio buttons for theme
- OAuth button
- Success/error toasts

**API Endpoints**:
- `GET /api/auth/google/initiate` - Start OAuth flow
- `GET /api/user/preferences?user_id=xxx` - Get user preferences
- `PUT /api/user/preferences` - Update preferences
- `POST /api/calendar/sync` - Trigger manual sync

---

## 🎨 Design System

### **Color Palette**

```css
/* Light Mode */
:root {
  --background: #FFFFFF;
  --surface: #F8F9FA;
  --surface-hover: #E9ECEF;
  --border: #E5E7EB;
  
  --primary: #6366F1; /* Indigo */
  --primary-hover: #4F46E5;
  --primary-light: #EEF2FF;
  
  --success: #10B981;
  --success-light: #D1FAE5;
  --warning: #F59E0B;
  --warning-light: #FEF3C7;
  --danger: #EF4444;
  --danger-light: #FEE2E2;
  
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark Mode */
.dark {
  --background: #0F172A;
  --surface: #1E293B;
  --surface-hover: #334155;
  --border: #334155;
  
  --primary: #818CF8;
  --primary-hover: #A5B4FC;
  --primary-light: #312E81;
  
  --success: #34D399;
  --success-light: #064E3B;
  --warning: #FBBF24;
  --warning-light: #78350F;
  --danger: #F87171;
  --danger-light: #7F1D1D;
  
  --text-primary: #F1F5F9;
  --text-secondary: #CBD5E1;
  --text-muted: #64748B;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}
```

### **Typography**

```css
/* Font Families */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### **Spacing Scale**

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### **Border Radius**

```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 0.75rem;  /* 12px */
--radius-xl: 1rem;     /* 16px */
--radius-full: 9999px; /* Fully rounded */
```

### **Animations & Transitions**

```css
/* Transition Durations */
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* Easing Functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Common Transitions */
.transition-all {
  transition: all var(--duration-normal) var(--ease-in-out);
}

.transition-colors {
  transition: color var(--duration-normal), 
              background-color var(--duration-normal),
              border-color var(--duration-normal);
}

/* Hover Effects */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.hover-scale:hover {
  transform: scale(1.02);
}
```

### **Component Styles**

```css
/* Buttons */
.btn-primary {
  background: var(--primary);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all var(--duration-normal);
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Cards */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal);
}

.card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

/* Inputs */
.input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  transition: all var(--duration-fast);
}

.input:focus {
  border-color: var(--primary);
  outline: 2px solid var(--primary-light);
  outline-offset: 2px;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.badge-success {
  background: var(--success-light);
  color: var(--success);
}

.badge-warning {
  background: var(--warning-light);
  color: var(--warning);
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */

/* Extra Small (Mobile) */
@media (min-width: 0px) {
  .container { max-width: 100%; padding: var(--space-4); }
  .grid { grid-template-columns: 1fr; }
  .calendar { display: none; } /* Hide calendar, show list */
  .bottom-nav { display: flex; } /* Show bottom nav on mobile */
}

/* Small (Large Mobile) */
@media (min-width: 640px) {
  .container { max-width: 640px; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Medium (Tablet) */
@media (min-width: 768px) {
  .container { max-width: 768px; padding: var(--space-6); }
  .calendar { display: block; } /* Show week view */
  .bottom-nav { display: none; } /* Hide bottom nav */
  .sidebar { display: block; } /* Show sidebar navigation */
}

/* Large (Desktop) */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
  .grid { grid-template-columns: repeat(3, 1fr); }
  .calendar { /* Full week view with hours */ }
}

/* Extra Large (Wide Desktop) */
@media (min-width: 1280px) {
  .container { max-width: 1280px; padding: var(--space-8); }
  .calendar { /* Month view available */ }
}
```

**Device-Specific Behavior**:

| Device | Layout | Navigation | Calendar View |
|--------|--------|------------|---------------|
| Mobile (<640px) | 1 column | Bottom tabs | Day view list |
| Tablet (641-1024px) | 2 columns | Top + sidebar | Week view |
| Desktop (>1024px) | 3 columns | Top + sidebar | Week/Month toggle |

---

## 🚀 Tech Stack

### **Required Dependencies**

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.56.0",
    
    "react-big-calendar": "^1.13.0",
    "date-fns": "^3.6.0",
    
    "recharts": "^2.12.0",
    
    "framer-motion": "^11.5.0",
    
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  }
}
```

### **Shadcn/ui Components to Install**

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add popover
```

---

## 📂 Project Structure

```
smart-schedule-ai-main/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Main app with routing
│   │   └── App.css                    # Global styles
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx              # Home page
│   │   ├── QuickSchedule.tsx          # Quick flow
│   │   ├── CalendarPlanner.tsx        # Calendar view
│   │   ├── Analytics.tsx              # Analytics page
│   │   └── Settings.tsx               # Settings page
│   │
│   ├── components/
│   │   ├── ui/                        # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... (other shadcn components)
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx             # Top navigation
│   │   │   ├── BottomNav.tsx          # Mobile bottom nav
│   │   │   ├── Sidebar.tsx            # Desktop sidebar
│   │   │   └── Layout.tsx             # Main layout wrapper
│   │   │
│   │   ├── scheduling/
│   │   │   ├── CandidateCard.tsx      # AI candidate display
│   │   │   ├── ParticipantInput.tsx   # @mention input
│   │   │   ├── ScoreBreakdown.tsx     # Score visualization
│   │   │   └── EnforcementBadges.tsx  # Enforcement status
│   │   │
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx       # React Big Calendar wrapper
│   │   │   ├── EventCard.tsx          # Calendar event display
│   │   │   └── ScheduleModal.tsx      # New meeting modal
│   │   │
│   │   ├── analytics/
│   │   │   ├── StatCard.tsx           # Metric display card
│   │   │   ├── TimeChart.tsx          # Time saved chart
│   │   │   └── QualityScore.tsx       # Meeting quality display
│   │   │
│   │   └── common/
│   │       ├── LoadingSkeleton.tsx    # Loading states
│   │       ├── EmptyState.tsx         # No data states
│   │       └── ErrorBoundary.tsx      # Error handling
│   │
│   ├── hooks/
│   │   ├── useSchedule.ts             # Schedule meeting hook
│   │   ├── useCalendar.ts             # Calendar data hook
│   │   ├── useAnalytics.ts            # Analytics hook
│   │   ├── useAuth.ts                 # OAuth hook
│   │   └── useTheme.ts                # Dark mode hook
│   │
│   ├── lib/
│   │   ├── api.ts                     # API client
│   │   ├── utils.ts                   # Utility functions
│   │   └── constants.ts               # App constants
│   │
│   ├── stores/
│   │   ├── userStore.ts               # User state (Zustand)
│   │   ├── scheduleStore.ts           # Schedule state
│   │   └── themeStore.ts              # Theme state
│   │
│   ├── types/
│   │   ├── api.ts                     # API types
│   │   ├── calendar.ts                # Calendar types
│   │   └── scheduling.ts              # Scheduling types
│   │
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global Tailwind imports
│
├── public/
│   └── ... (static assets)
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── components.json                    # Shadcn/ui config
```

---

## 🛠️ Implementation Plan (4-5 Days)

### **Day 1: Setup & Core Structure**

**Morning (4 hours)**:
1. Install Shadcn/ui and all dependencies
   ```bash
   cd smart-schedule-ai-main
   npx shadcn-ui@latest init
   npm install react-router-dom zustand @tanstack/react-query
   npm install react-big-calendar date-fns recharts framer-motion
   ```

2. Setup routing in `App.tsx`:
   ```tsx
   import { BrowserRouter, Routes, Route } from 'react-router-dom';
   import Layout from './components/layout/Layout';
   import Dashboard from './pages/Dashboard';
   // ... other imports

   function App() {
     return (
       <BrowserRouter>
         <Layout>
           <Routes>
             <Route path="/" element={<Dashboard />} />
             <Route path="/quick" element={<QuickSchedule />} />
             <Route path="/calendar" element={<CalendarPlanner />} />
             <Route path="/analytics" element={<Analytics />} />
             <Route path="/settings" element={<Settings />} />
           </Routes>
         </Layout>
       </BrowserRouter>
     );
   }
   ```

3. Create Layout components (Header, BottomNav, Sidebar)

**Afternoon (4 hours)**:
4. Setup API client with React Query
5. Create Zustand stores for state management
6. Setup dark mode with theme switcher
7. Create Dashboard page skeleton

**Deliverable**: App structure with routing, dark mode, and navigation ✅

---

### **Day 2: Quick Schedule Flow**

**Morning (4 hours)**:
1. Build QuickSchedule page layout
2. Create ParticipantInput with @mentions
3. Implement natural language parsing
4. Create CandidateCard component with score display

**Afternoon (4 hours)**:
5. Connect to `/api/schedule` endpoint
6. Implement one-click scheduling flow
7. Add success modal with animation
8. Create loading skeletons for AI processing

**Deliverable**: Fully functional Quick Schedule flow (30s target) ✅

---

### **Day 3: Calendar Planner**

**Morning (4 hours)**:
1. Integrate React Big Calendar
2. Connect to `/api/calendar/events` endpoint
3. Implement week/month view toggle
4. Style calendar events with colors and badges

**Afternoon (4 hours)**:
5. Create ScheduleModal for new meetings
6. Implement click-to-schedule functionality
7. Add drag-and-drop rescheduling
8. Show AI candidates in modal with radio selection

**Deliverable**: Interactive calendar with visual scheduling ✅

---

### **Day 4: Analytics & Settings**

**Morning (4 hours)**:
1. Build Analytics page layout
2. Create StatCard components
3. Integrate Recharts for time saved visualization
4. Add meeting quality score circle
5. Display key metrics (conflicts avoided, etc.)

**Afternoon (4 hours)**:
6. Build Settings page
7. Implement OAuth connection button
8. Create preference forms (working hours, buffer time)
9. Add notification toggles
10. Connect to preferences API

**Deliverable**: Analytics dashboard and settings page ✅

---

### **Day 5: Polish & Responsive**

**Morning (4 hours)**:
1. Responsive testing on mobile/tablet/desktop
2. Fix layout issues and breakpoint bugs
3. Add loading states for all API calls
4. Implement error boundaries and error states

**Afternoon (4 hours)**:
5. Add Framer Motion page transitions
6. Polish micro-interactions (hover effects, button animations)
7. Test dark mode on all pages
8. Add empty states for no data
9. Performance optimization (lazy loading, code splitting)
10. Final QA and bug fixes

**Deliverable**: Production-ready responsive app ✅

---

## 🎯 Key Features Implementation

### **1. Quick Schedule (30 seconds)**

```tsx
// pages/QuickSchedule.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CandidateCard from '@/components/scheduling/CandidateCard';

export default function QuickSchedule() {
  const [input, setInput] = useState('');
  const [participants, setParticipants] = useState([]);

  const scheduleMutation = useMutation({
    mutationFn: (data) => api.schedule(data),
    onSuccess: (data) => {
      // Show success modal
      showSuccessModal(data);
    },
  });

  const handleSchedule = async () => {
    await scheduleMutation.mutateAsync({
      meeting_id: generateId(),
      participants,
      constraints: {
        duration_minutes: 60,
        // ... other constraints
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">⚡ Quick Schedule</h1>
      <p className="text-muted mb-8">Schedule in 30 seconds</p>

      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Team sync with @alice @bob"
        className="text-lg"
      />

      {scheduleMutation.data?.candidates.map((candidate, i) => (
        <CandidateCard
          key={i}
          candidate={candidate}
          rank={i + 1}
          onSelect={() => handleSchedule(candidate)}
        />
      ))}
    </div>
  );
}
```

### **2. @Mention Participant Input**

```tsx
// components/scheduling/ParticipantInput.tsx
import { useState, useRef } from 'react';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';

export default function ParticipantInput({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
    // ... fetch from API
  ];

  const handleInput = (e) => {
    const text = e.target.value;
    setQuery(text);

    // Detect @mention
    if (text.includes('@')) {
      setShowSuggestions(true);
    }
  };

  const selectParticipant = (participant) => {
    onChange([...value, participant]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={handleInput}
        placeholder="@mention participants"
      />

      {showSuggestions && (
        <Command className="absolute top-full mt-2">
          <CommandList>
            {suggestions.map((p) => (
              <CommandItem key={p.id} onSelect={() => selectParticipant(p)}>
                {p.name} ({p.email})
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      )}

      <div className="flex gap-2 mt-2">
        {value.map((p) => (
          <Badge key={p.id}>{p.name}</Badge>
        ))}
      </div>
    </div>
  );
}
```

### **3. AI Candidate Card**

```tsx
// components/scheduling/CandidateCard.tsx
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function CandidateCard({ candidate, rank, onSelect }) {
  const medals = ['🥇', '🥈', '🥉'];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
    >
      <Card className="p-6 hover:border-primary cursor-pointer" onClick={onSelect}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-2xl">{medals[rank - 1] || '📅'}</span>
            <h3 className="text-xl font-semibold">
              {formatDate(candidate.slot.start)}
            </h3>
          </div>
          <Badge variant="success">
            Score: {candidate.score}/100
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            {candidate.all_participants_available ? (
              <Check className="text-success" />
            ) : (
              <AlertCircle className="text-warning" />
            )}
            <span>
              {candidate.all_participants_available
                ? 'All available'
                : `${candidate.conflicts.length} conflicts`}
            </span>
          </div>

          <p className="text-sm text-muted">{candidate.reasoning}</p>
        </div>

        <Button className="w-full">Schedule This</Button>
      </Card>
    </motion.div>
  );
}
```

### **4. Calendar Integration**

```tsx
// components/calendar/CalendarView.tsx
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export default function CalendarView({ events, onSelectSlot, onSelectEvent }) {
  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 'calc(100vh - 200px)' }}
      onSelectSlot={onSelectSlot}
      onSelectEvent={onSelectEvent}
      selectable
      views={['month', 'week', 'day']}
      defaultView="week"
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: event.score > 80 ? '#10B981' : '#F59E0B',
          borderRadius: '8px',
          border: 'none',
        },
      })}
    />
  );
}
```

### **5. Dark Mode Implementation**

```tsx
// hooks/useTheme.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'auto',
      setTheme: (theme) => {
        set({ theme });
        
        if (theme === 'dark' || 
            (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    { name: 'theme-storage' }
  )
);
```

### **6. API Client**

```tsx
// lib/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const api = {
  // Schedule meeting
  async schedule(data: ScheduleRequest) {
    const response = await axios.post(`${API_BASE_URL}/api/schedule`, data);
    return response.data;
  },

  // Get analytics
  async getAnalytics(userId: string) {
    const response = await axios.get(`${API_BASE_URL}/api/analytics`, {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Get calendar events
  async getCalendarEvents(userId: string, start: Date, end: Date) {
    const response = await axios.get(`${API_BASE_URL}/api/calendar/events`, {
      params: {
        user_id: userId,
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
    return response.data;
  },

  // Create calendar event
  async createEvent(data: CalendarEventInput) {
    const response = await axios.post(`${API_BASE_URL}/api/calendar/write-back`, data);
    return response.data;
  },

  // Get user preferences
  async getPreferences(userId: string) {
    const response = await axios.get(`${API_BASE_URL}/api/user/preferences`, {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Update preferences
  async updatePreferences(data: UserPreferences) {
    const response = await axios.put(`${API_BASE_URL}/api/user/preferences`, data);
    return response.data;
  },
};
```

---

## 🚀 Quick Start Commands

```bash
# Navigate to frontend directory
cd smart-schedule-ai-main

# Initialize Shadcn/ui (choose default options)
npx shadcn-ui@latest init

# Install core dependencies
npm install react-router-dom@6 zustand @tanstack/react-query

# Install calendar dependencies
npm install react-big-calendar date-fns

# Install chart dependencies
npm install recharts

# Install animation library
npm install framer-motion

# Install Shadcn/ui components
npx shadcn-ui@latest add button card input dialog select calendar toast badge tabs switch slider skeleton dropdown-menu popover

# Start development server
npm run dev
```

---

## ✅ Definition of Done

### **Functional Requirements**
- [ ] All 5 pages implemented and routed
- [ ] Quick Schedule flow takes ≤ 30 seconds
- [ ] Calendar Planner flow takes ≤ 2 minutes
- [ ] Connected to all backend API endpoints
- [ ] OAuth flow for Google Calendar works
- [ ] Real-time data display (not mock data)

### **UI/UX Requirements**
- [ ] Fully responsive (mobile, tablet, desktop tested)
- [ ] Dark mode working on all pages
- [ ] Smooth page transitions (Framer Motion)
- [ ] Loading states for all async operations
- [ ] Error states and error boundaries
- [ ] Empty states for no data
- [ ] Success animations (confetti, checkmarks)

### **Performance Requirements**
- [ ] Initial load < 2 seconds
- [ ] Page transitions < 150ms
- [ ] API responses handled with optimistic UI
- [ ] Code splitting implemented
- [ ] Images optimized and lazy loaded

### **Code Quality**
- [ ] TypeScript with proper types
- [ ] Consistent component structure
- [ ] Reusable components in `/components/ui`
- [ ] Custom hooks for API calls
- [ ] State management with Zustand
- [ ] Clean file structure

---

## 🎨 Example Screenshots (Mockups)

### **Mobile View (375px)**
```
┌─────────────────┐
│ 🤖 Smart Sched  │
│                 │
│ 📊 3 meetings   │
│ ⏱️ 45 min saved │
│                 │
│ ┌─────────────┐ │
│ │ ⚡ Quick     │ │
│ │ Schedule    │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ 📅 Planner  │ │
│ │ Mode        │ │
│ └─────────────┘ │
│                 │
│ Recent Activity │
│ ✓ Team Sync     │
│ ✓ 1:1 with Bob  │
│                 │
├─────────────────┤
│ 🏠 ⚡ 📅 📊      │
└─────────────────┘
```

### **Desktop View (1280px)**
```
┌──────────────────────────────────────────────────────┐
│  🤖 Smart Scheduler              [⚙️ Settings] [👤]  │
├─────────┬────────────────────────────────────────────┤
│         │                                            │
│  🏠 Home │  📊 Today's Summary                        │
│  ⚡ Quick│  3 meetings • 45 min saved • 100% success  │
│  📅 Cal  │                                            │
│  📊 Stats│  Choose Your Flow                          │
│  ⚙️ Set  │  ┌─────────────┐  ┌─────────────┐        │
│         │  │ ⚡ Quick     │  │ 📅 Planner  │        │
│         │  │ Schedule    │  │ Mode        │        │
│         │  └─────────────┘  └─────────────┘        │
│         │                                            │
│         │  Recent Activity                           │
│         │  ✓ Team Sync - 2pm                         │
│         │  ✓ 1:1 Bob - Tomorrow 10am                 │
│         │                                            │
└─────────┴────────────────────────────────────────────┘
```

---

## 📝 Additional Notes

### **Accessibility Considerations**
- All Shadcn/ui components are built on Radix UI (WCAG 2.1 compliant)
- Keyboard navigation support (Tab, Enter, Esc)
- ARIA labels on all interactive elements
- Focus indicators visible
- Color contrast ratios meet AA standards
- Screen reader tested

### **Performance Optimizations**
- React.lazy() for code splitting by route
- Image lazy loading with Intersection Observer
- Memoization with React.memo() for expensive components
- Debounced search inputs
- Virtual scrolling for long lists
- Service worker for offline support (optional)

### **Testing Strategy**
- Jest + React Testing Library for unit tests
- Cypress for E2E tests
- Lighthouse audits for performance
- Axe for accessibility testing
- BrowserStack for cross-browser testing

### **Future Enhancements**
- Push notifications
- Slack/Teams integration
- Email notifications
- Export calendar as PDF
- Meeting preparation assistant
- AI-powered meeting notes

---

## 🎯 Success Criteria

**User can:**
1. ✅ Schedule a meeting in < 30 seconds using Quick flow
2. ✅ Plan meetings with full control in < 2 minutes
3. ✅ View calendar with visual conflict indicators
4. ✅ See analytics and time saved
5. ✅ Configure preferences and connect Google Calendar
6. ✅ Use app seamlessly on mobile, tablet, and desktop
7. ✅ Switch between light and dark mode
8. ✅ Navigate with keyboard shortcuts

**App achieves:**
1. ✅ 100% API integration (no mock data)
2. ✅ < 2s initial load time
3. ✅ > 90 Lighthouse score
4. ✅ 100% responsive breakpoint coverage
5. ✅ WCAG 2.1 AA accessibility compliance

---

## 🔗 API Endpoints Reference

```
GET    /api/analytics?user_id=xxx
GET    /api/analytics/recent-activity?user_id=xxx
GET    /api/analytics/scheduling?user_id=xxx
GET    /api/analytics/performance?user_id=xxx

POST   /api/schedule
POST   /api/calendar/sync
POST   /api/calendar/write-back

GET    /api/calendar/events?user_id=xxx&start=xxx&end=xxx
PUT    /api/calendar/events/:id
DELETE /api/calendar/events/:id

GET    /api/auth/google/initiate
GET    /api/auth/google/callback?code=xxx

GET    /api/user/preferences?user_id=xxx
PUT    /api/user/preferences
```

---

**END OF BUILD PROMPT**

---

**IMPLEMENTATION CHECKLIST**

- [ ] Day 1: Setup + Core Structure
- [ ] Day 2: Quick Schedule Flow
- [ ] Day 3: Calendar Planner
- [ ] Day 4: Analytics & Settings
- [ ] Day 5: Polish & Responsive
- [ ] Final QA
- [ ] Production Deployment

**Estimated Total Time**: 4-5 days (8 hours/day) = 32-40 hours

**Priority Order**:
1. Quick Schedule (highest value)
2. Dashboard (entry point)
3. Calendar Planner (power user feature)
4. Analytics (engagement)
5. Settings (configuration)
