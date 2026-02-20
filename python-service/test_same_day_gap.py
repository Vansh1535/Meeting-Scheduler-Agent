"""Test same-day gap prioritization."""

from datetime import datetime, timezone, timedelta
from schemas.scheduling import (
    SchedulingConstraints,
    EventCategory,
    DayOfWeek,
    Participant,
    CompressedCalendarSummary,
    PreferencePattern,
    TimeSlot,
)
from agents.availability_agent import AvailabilityAgent
from agents.optimization_agent import OptimizationAgent

def test_same_day_gap_priority():
    """
    Test that AI prioritizes gaps during office hours over after-hours slots.
    
    Scenario:
    - User has a meeting at 10am
    - Available slots: 11am, 2pm, 3pm (during office hours) AND 7pm (after hours)
    - Expected: Office hour gaps should rank HIGHER than 7pm
    """
    
    print("\n🎯 Testing Same-Day Gap Prioritization\n")
    print("=" * 80)
    
    # Find next Monday for consistent testing
    now = datetime.now(timezone.utc)
    days_ahead = 0 - now.weekday()  # Monday is 0
    if days_ahead <= 0:  # If today is Monday or later, find next Monday
        days_ahead += 7
    test_day = now + timedelta(days=days_ahead)
    test_day = test_day.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Create participant with 10am meeting
    busy_time = test_day.replace(hour=10, minute=0)
    participant = Participant(
        user_id="user123",
        email="john@example.com",
        name="John Doe",
        is_required=True,
        calendar_summary=CompressedCalendarSummary(
            user_id="user123",
            timezone="UTC",
            busy_slots=[
                TimeSlot(
                    start=busy_time,
                    end=busy_time + timedelta(hours=1),
                    timezone="UTC"
                ),
            ],
            weekly_meeting_count=5,
            peak_meeting_hours=[9, 10, 14, 15],
            preference_patterns=PreferencePattern(
                preferred_days=[DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
                preferred_hours_start=9,
                preferred_hours_end=17,
                avg_meeting_duration_minutes=60,
                buffer_minutes=15,
                avoids_back_to_back=True,
                morning_person_score=0.6
            ),
            data_compressed=True,
            compression_period_days=90
        )
    )
    
    # Create constraints for a meeting
    constraints = SchedulingConstraints(
        duration_minutes=60,
        earliest_date=test_day,
        latest_date=test_day + timedelta(hours=23, minutes=59),
        working_hours_start=9,
        working_hours_end=20,  # Extend to 8pm so we can test after-hours slots
        allowed_days=[DayOfWeek.MONDAY],
        buffer_minutes=15,
        timezone="UTC",
        max_candidates=20,
        event_category=EventCategory.MEETING,
    )
    
    print("📅 Scenario:")
    print(f"   Date: Monday, {test_day.strftime('%b %d, %Y')}")
    print(f"   Existing meeting: 10:00 AM - 11:00 AM")
    print(f"   Office hours: 9:00 AM - 5:00 PM")
    print(f"   Scheduling window: 9:00 AM - 8:00 PM (to test after-hours)")
    print(f"   Event type: Business Meeting")
    print()
    
    # Find available slots
    print("🔍 Finding available slots...")
    available_slots = AvailabilityAgent.find_available_slots(
        participants=[participant],
        constraints=constraints,
    )
    
    print(f"   Found {len(available_slots)} available slots")
    
    if len(available_slots) == 0:
        print("   ❌ ERROR: No slots found! Check constraints and participant data.")
        return
    
    # Show some sample slots
    print(f"\n   Sample slots:")
    for slot in available_slots[:5]:
        print(f"      {slot.start.strftime('%I:%M %p')}")
    
    # Filter to show relevant slots
    relevant_slots = [
        s for s in available_slots 
        if s.start.hour in [11, 14, 15, 19]  # 11am, 2pm, 3pm, 7pm
    ]
    
    print(f"\n   Key slots to analyze: {len(relevant_slots)}")
    for slot in relevant_slots:
        print(f"      {slot.start.strftime('%I:%M %p')}")
    print()
    
    # Rank all candidates
    ranked_candidates = OptimizationAgent.rank_candidates(
        available_slots=available_slots,
        participants=[participant],
        constraints=constraints,
    )
    
    # Display results
    print("🏆 Ranked Options:")
    print("=" * 80)
    
    office_hour_slots = []
    after_hour_slots = []
    
    for i, candidate in enumerate(ranked_candidates[:25], 1):  # Show more to find after-hours
        time_str = candidate.slot.start.strftime("%I:%M %p")
        score = candidate.score
        hour = candidate.slot.start.hour
        
        is_office = 9 <= hour < 17
        marker = "🟢 OFFICE" if is_office else "🔴 AFTER"
        
        # Only print top 10 and any after-hours slots
        if i <= 10 or not is_office:
            print(f"\n#{i:2d}  {marker}  {time_str}  →  Score: {score:.1f}")
            
            # Show breakdown for key slots
            if candidate.score_breakdown:
                gap_bonus = candidate.score_breakdown.get('same_day_gap_bonus', 0)
                print(f"       ✨ Same-day gap bonus: {gap_bonus:+.1f} points")
            
            if candidate.reasoning and i <= 3:  # Only show reasoning for top 3
                print(f"       💭 {candidate.reasoning}")
        
        if is_office:
            office_hour_slots.append((i, time_str, score))
        else:
            after_hour_slots.append((i, time_str, score))
    
    # Analysis
    print("\n\n📊 Analysis:")
    print("=" * 80)
    
    if office_hour_slots and after_hour_slots:
        best_office = office_hour_slots[0]
        best_after = after_hour_slots[0]
        
        print(f"\n   Best office hour slot: #{best_office[0]} - {best_office[1]} (Score: {best_office[2]:.1f})")
        print(f"   Best after-hour slot:  #{best_after[0]} - {best_after[1]} (Score: {best_after[2]:.1f})")
        
        if best_office[0] < best_after[0]:
            print("\n   ✅ SUCCESS! Office hour gaps ranked HIGHER than after-hours")
            print(f"      Office hours come {best_after[0] - best_office[0]} positions earlier")
            score_diff = best_office[2] - best_after[2]
            print(f"      Score difference: {score_diff:.1f} points")
        else:
            print("\n   ❌ ISSUE: After-hours ranked higher than office hour gaps")
            print("      Expected office hours to be prioritized!")
    
    print("\n\n💡 Key Insight:")
    print("   When there's a meeting at 10am and free slots at 11am, 2pm, 3pm, and 7pm:")
    print("   The AI should prefer 11am/2pm/3pm (office hour gaps)")
    print("   over 7pm (extends the workday)")
    print()

if __name__ == "__main__":
    test_same_day_gap_priority()
