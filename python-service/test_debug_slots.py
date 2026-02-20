"""Simple debug test for availability agent."""

from datetime import datetime, timezone
from schemas.scheduling import (
    SchedulingConstraints,
    EventCategory,
    DayOfWeek,
)
from agents.availability_agent import AvailabilityAgent

# Create simple constraints
# Note: Feb 23, 2026 is Monday (weekday 0)
constraints = SchedulingConstraints(
    duration_minutes=60,
    earliest_date=datetime(2026, 2, 23, 0, 0, 0, tzinfo=timezone.utc),  # Monday
    latest_date=datetime(2026, 2, 23, 23, 59, 59, tzinfo=timezone.utc),
    working_hours_start=9,
    working_hours_end=17,
    allowed_days=[DayOfWeek.MONDAY],
    buffer_minutes=15,
    timezone="UTC",
    max_candidates=10,
    event_category=EventCategory.MEETING,
)

print("Constraints:")
print(f"  Date range: {constraints.earliest_date} to {constraints.latest_date}")
print(f"  Allowed days: {constraints.allowed_days}")
print(f"  Category: {constraints.event_category}")
print(f"  Working hours: {constraints.working_hours_start} to {constraints.working_hours_end}")

# Check day of week
test_date = constraints.earliest_date
print(f"\nTest date weekday: {test_date.weekday()} (0=Monday)")

# Get time windows
time_windows = AvailabilityAgent._get_time_windows_for_category(
    constraints.event_category, False, constraints
)
print(f"Time windows: {time_windows}")

# Try to generate slots
print("\nGenerating slots...")
slots = AvailabilityAgent._generate_candidate_slots(constraints)
print(f"Generated {len(slots)} slots")

if slots:
    for i, slot in enumerate(slots[:5]):
        print(f"  Slot {i+1}: {slot.start} to {slot.end}")
else:
    print("NO SLOTS GENERATED - debugging needed")
    
    # Manual check
    print("\nManual slot generation test:</")
    from datetime import timedelta
    current_date = constraints.earliest_date
    print(f"Current date: {current_date}")
    print(f"Weekday: {current_date.weekday()}")
    
    allowed_weekdays = {
        DayOfWeek.MONDAY: 0,
        DayOfWeek.TUESDAY: 1,
        DayOfWeek.WEDNESDAY: 2,
        DayOfWeek.THURSDAY: 3,
        DayOfWeek.FRIDAY: 4,
        DayOfWeek.SATURDAY: 5,
        DayOfWeek.SUNDAY: 6,
    }
    allowed_weekday_nums = {
        allowed_weekdays[day] for day in constraints.allowed_days
    }
    print(f"Allowed weekday nums: {allowed_weekday_nums}")
    print(f"Is current weekday in allowed: {current_date.weekday() in allowed_weekday_nums}")
    
    # Try manual slot creation
    for window_start, window_end in time_windows:
        print(f"\nWindow: {window_start} to {window_end}")
        day_start = current_date.replace(hour=window_start, minute=0, second=0, microsecond=0)
        day_end = current_date.replace(hour=window_end, minute=0, second=0, microsecond=0)
        print(f"Day start: {day_start}")
        print(f"Day end: {day_end}")
        
        duration = timedelta(minutes=constraints.duration_minutes)
        print(f"Duration: {duration}")
        print(f"Can fit? {day_start + duration <= day_end}")
        
        if day_start + duration <= day_end:
            print("Should generate at least one slot!")
