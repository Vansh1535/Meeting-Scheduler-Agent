# Intelligent Time Suggestions

## Overview

The AI scheduling system now provides intelligent time suggestions based on:
1. **Weekday vs Weekend** - Different time windows for weekdays and weekends
2. **Event Categories** - Time suggestions tailored to the type of event
3. **Office Hour Gaps** - Finds free slots during working hours, not just after hours

## Event Categories

### MEETING (Business Meetings)
**Weekdays:**
- Primary window: Office hours ± 2 hours (e.g., 8am-7pm if office is 9am-5pm)
- Best scored: Core business hours (9am-5pm)
- Good: Early morning (8-9am) or late afternoon (5-6pm)
- Acceptable: Extended hours (7-8am, 6-7pm)

**Weekends:**
- Mid-day preferred (10am-4pm)
- Lower priority as meetings are less common on weekends

### PERSONAL (Personal Events)
**Weekdays:**
- Prefers time outside core work hours
- Excellent: Before work (7-9am), after work (5-9pm)
- Good: Lunch time (12-2pm)
- Less ideal: During work hours

**Weekends:**
- Anytime (8am-8pm) - ideal for personal events

### WORK (Work Tasks)
**Weekdays:**
- Extended office hours (7am-8pm)
- Flexible scheduling

**Weekends:**
- Morning and afternoon blocks (9am-1pm, 3-7pm)
- Flexible for catch-up work

### SOCIAL (Social Events)
**Weekdays:**
- Best: Evenings (6pm-11pm)
- Good: Lunch time (12-2pm)
- Less ideal: During work hours

**Weekends:**
- Ideal: Most daytime hours (10am-10pm)
- Perfect for social gatherings

### HEALTH (Health Appointments)
**Weekdays:**
- Daytime preferred (8am-5pm)
- People typically take time off work

**Weekends:**
- Morning to early afternoon (8am-4pm)

### FOCUS_TIME (Deep Work)
**Weekdays:**
- Best: Early morning (7-11am)
- Good: Afternoon blocks (2-5pm)
- Avoids mid-day interruptions

**Weekends:**
- Morning and afternoon blocks for uninterrupted work

### BREAK (Breaks/Lunch)
**Weekdays:**
- Mid-morning (10-12pm)
- Lunch (12-2pm)
- Mid-afternoon (3-5pm)

**Weekends:**
- Anytime during the day (10am-8pm)

## How It Works

### 1. Time Window Generation
The system generates candidate time slots based on:
```python
# Weekday MEETING example:
- If office hours are 9am-5pm
- System generates slots from 8am-7pm
- Covers early morning and late afternoon meetings

# Weekend SOCIAL example:
- Generates slots from 12pm-10pm
- Perfect for social gatherings
```

### 2. Scoring Algorithm
Each slot receives a category fitness score (0-100):
- **100**: Perfect fit for category
- **80-90**: Very suitable
- **50-70**: Acceptable
- **20-40**: Less ideal
- **0-20**: Poor fit

### 3. Finding Office Hour Gaps
Unlike the old system that only showed after-hours slots:
- **Scans all time windows** for the category
- **Finds gaps between existing meetings** during office hours
- **Suggests slots in multiple time windows** (e.g., morning + afternoon)

## API Usage

### Request Example
```json
{
  "meeting_id": "abc123",
  "participants": [...],
  "constraints": {
    "duration_minutes": 60,
    "earliest_date": "2026-02-21T00:00:00Z",
    "latest_date": "2026-02-28T23:59:59Z",
    "working_hours_start": 9,
    "working_hours_end": 17,
    "allowed_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "event_category": "meeting"  // NEW FIELD
  }
}
```

### Supported Categories
- `meeting` (default)
- `personal`
- `work`
- `social`
- `health`
- `focus_time`
- `break`

## Benefits

### 1. Smarter Scheduling
- Personal errands suggested before/after work
- Social events suggested for evenings/weekends
- Meetings suggested during core business hours

### 2. Better Work-Life Balance
- Personal time protected from work events
- Social activities scheduled appropriately
- Focus time suggested for peak productivity hours

### 3. Maximizes Office Hours
- Finds gaps between meetings during the day
- Doesn't force everything to after-hours
- Better utilization of available time

### 4. Context-Aware
- Weekend suggestions differ from weekday suggestions
- Event type influences timing
- Respects typical patterns for each category

## Example Scenarios

### Scenario 1: Scheduling a Team Meeting
```
Category: MEETING
Day: Tuesday (weekday)
Result: Slots suggested at 9am, 10am, 2pm, 3pm (during office hours)
Score: 100 for 9am-5pm slots, 80 for 8-9am or 5-6pm
```

### Scenario 2: Scheduling a Social Lunch
```
Category: SOCIAL
Day: Friday (weekday)
Result: Slots at 12pm, 12:30pm, 1pm
Score: 70 for lunch hours, 95 for evening slots
```

### Scenario 3: Scheduling a Doctor's Appointment
```
Category: HEALTH
Day: Wednesday (weekday)
Result: Slots from 9am-4pm with gaps between meetings
Score: 100 for daytime hours
```

### Scenario 4: Scheduling Personal Time
```
Category: PERSONAL
Day: Saturday (weekend)
Result: Flexible slots throughout the day
Score: 100 for weekend slots
```

## Implementation Details

### File Changes
1. **schemas/scheduling.py**
   - Added `EventCategory` enum
   - Added `event_category` field to `SchedulingConstraints`

2. **agents/availability_agent.py**
   - Enhanced `_generate_candidate_slots()` with category awareness
   - New method `_get_time_windows_for_category()` for smart time windows
   - Generates multiple time windows per day (e.g., morning + afternoon)

3. **agents/preference_agent.py**
   - Enhanced `score_slot_preferences()` with category parameter
   - New method `_score_category_fit()` for category-specific scoring
   - Integrated into overall preference calculation (20% weight)

4. **agents/optimization_agent.py**
   - Updated to pass `event_category` to preference scoring

## Future Enhancements

- Learn category preferences from historical data
- Auto-detect category from event title/description
- Custom category definitions per organization
- Time zone aware category scoring
- Industry-specific category templates
