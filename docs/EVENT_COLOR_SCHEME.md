# AI Platform vs Google Calendar Event Distinction

## Visual Color Scheme

The platform uses a consistent **RED color scheme** for AI Platform events and **BLUE-PURPLE** for Google Calendar events to help users easily distinguish between event sources.

## Color Coding by Component

### 1. **Calendar Month View** (`frontend/components/calendar/month-view.tsx`)
- **AI Platform Only**: `from-slate-800 to-red-600` (dark slate to red gradient)
- **Google Calendar Only**: `from-blue-500 to-purple-500` (blue to purple gradient)
- **Both Types**: `from-red-500 via-purple-500 to-blue-500` (mixed gradient showing both sources)

**Implementation:**
```tsx
const aiEventCount = dayEvents.filter(e => !e.google_event_id).length
const googleEventCount = dayEvents.filter(e => e.google_event_id).length
const hasBothTypes = hasAiEvents && hasGoogleEvents

let eventGradient = 'from-blue-500 to-purple-500'
if (hasBothTypes) {
  eventGradient = 'from-red-500 via-purple-500 to-blue-500'
} else if (hasAiEvents) {
  eventGradient = 'from-slate-800 to-red-600'
} else if (hasGoogleEvents) {
  eventGradient = 'from-blue-500 to-purple-500'
}
```

### 2. **Event Detail Dialog** (`frontend/components/calendar/event-detail-dialog.tsx`)
- **AI Platform Badge**: `from-slate-800/20 to-red-600/20 text-red-600 dark:text-red-400 border-red-500/30`
- **Google Calendar Badge**: `from-amber-500/20 to-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30`

**Badge Display:**
```tsx
<Badge className={
  isGoogleEvent 
    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-600' 
    : 'bg-gradient-to-r from-slate-800/20 to-red-600/20 text-red-600'
}>
  {isGoogleEvent ? 'GOOGLE CAL' : 'AI PLATFORM'}
</Badge>
```

### 3. **Categories Sidebar** (`frontend/components/calendar/categories-sidebar.tsx`)
- **AI Platform Section**:
  - Icon background: `from-slate-800/20 to-red-600/20`
  - Icon color: `text-red-600 dark:text-red-400`
  - Event border: `border-red-500/30`
  - AI badge: `border-red-500/30 text-red-600`

**Example:**
```tsx
<div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-800/20 to-red-600/20">
  <Brain className="w-4 h-4 text-red-600 dark:text-red-400" />
</div>

<div className="p-2 rounded-lg border border-red-500/30">
  <Badge className="border-red-500/30 text-red-600">AI</Badge>
</div>
```

### 4. **Event Cards** (`frontend/components/event-card.tsx`)
- **AI Platform**: `gradient="navy-red"` → `from-slate-900 to-red-600`
- **Google Calendar**: `gradient="orange-red"` → `from-amber-400 to-red-500`

**Usage:**
```tsx
<EventCard
  gradient="navy-red"  // AI Platform events
  subtitle="AI PLATFORM"
  category="ai-platform"
/>
```

### 5. **Dashboard Upcoming Events** (`frontend/components/dashboard/upcoming-events.tsx`)
- Uses same gradient system as EventCard
- AI events: `gradient: 'navy-red'` with subtitle `'AI PLATFORM'`

## Event Identification Logic

Events are identified as AI Platform or Google Calendar based on the presence of `google_event_id`:

```typescript
const isGoogleEvent = !!event.google_event_id
const isAiPlatform = !event.google_event_id
```

### Data Sources:
- **AI Platform Events**: From `meetings` table
  - Has `meeting_id` but no `google_event_id`
  - Contains `participant_availability` data
  - Can be deleted with reason/notification options
  
- **Google Calendar Events**: From `calendar_events` table
  - Has `google_event_id`
  - Contains `raw_event` jsonb with Google Calendar data
  - Synced from user's Google Calendar via OAuth

## Testing the Distinction

Run the test script to create a sample AI Platform event:

```powershell
cd test
./add_ai_test_event.ps1
```

The test event includes the description:
> "This is a test event created by the AI Meeting Scheduler so that we know how to distinguish events by creation platform. If you see this event displayed with a red color scheme, the platform labeling is working correctly!"

### What to Verify:

1. **Calendar Month View**: Day with AI event shows red gradient (🔴)
2. **Event Detail Dialog**: Badge displays "AI PLATFORM" with red styling
3. **Categories Sidebar**: Event appears under "AI Platform" section with red border
4. **Event Cards**: Uses dark slate-to-red gradient
5. **Legend**: Shows three indicators (Google Cal, AI Platform, Both)

## Color Palette Reference

### AI Platform Red Scheme
- Primary: `red-600` (#dc2626)
- Dark variant: `slate-800` (#1e293b)
- Background: `from-slate-800/20 to-red-600/20`
- Border: `border-red-500/30`
- Text: `text-red-600 dark:text-red-400`

### Google Calendar Orange-Blue Scheme
- Primary: `orange-600` (#ea580c)
- Accent: `amber-500` (#f59e0b)
- Calendar days: `blue-500` to `purple-500`
- Background: `from-amber-500/20 to-orange-500/20`
- Border: `border-orange-500/30`
- Text: `text-orange-600 dark:text-orange-400`

## User Benefits

1. **Quick Visual Identification**: Users can instantly recognize event sources by color
2. **Platform Trust**: Red scheme indicates AI-scheduled events with smart features
3. **Source Clarity**: No confusion about where events originated
4. **Consistent UX**: Same color scheme applied across all views
5. **Mixed Event Days**: Special gradient for days with both event types

## Implementation Notes

- Color scheme is applied at the component level for maximum flexibility
- All colors use Tailwind CSS classes for consistency
- Dark mode support included with appropriate color variations
- Gradients provide visual depth while maintaining readability
- Border colors use 30% opacity for subtle distinction
