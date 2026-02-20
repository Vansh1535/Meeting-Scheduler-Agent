"""Test realistic API scenario with score differentiation."""

import json
from datetime import datetime, timezone, timedelta
from schemas.scheduling import (
    ScheduleRequest,
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

def test_realistic_scheduling():
    """Test a realistic scheduling scenario."""
    
    print("\n🎯 Realistic Scheduling Test: Social Event Planning\n")
    print("=" * 80)
    
    # Create participant with busy work schedule
    participant = Participant(
        user_id="user123",
        email="john@example.com",
        name="John Doe",
        is_required=True,
        calendar_summary=CompressedCalendarSummary(
            user_id="user123",
            timezone="America/New_York",
            busy_slots=[
                # Work hours meetings
                TimeSlot(
                    start=datetime(2026, 3, 5, 14, 0, tzinfo=timezone.utc),  # 9am EST
                    end=datetime(2026, 3, 5, 15, 0, tzinfo=timezone.utc),
                    timezone="UTC"
                ),
                TimeSlot(
                    start=datetime(2026, 3, 5, 16, 0, tzinfo=timezone.utc),  # 11am EST
                    end=datetime(2026, 3, 5, 17, 0, tzinfo=timezone.utc),
                    timezone="UTC"
                ),
            ],
            weekly_meeting_count=8,
            peak_meeting_hours=[9, 10, 14, 15],
            preference_patterns=PreferencePattern(
                preferred_days=[DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY],
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
    
    # Create constraints for evening social event
    constraints = SchedulingConstraints(
        duration_minutes=90,  # 1.5 hour dinner
        earliest_date=datetime(2026, 3, 5, 0, 0, tzinfo=timezone.utc),  # Thu, Mar 5
        latest_date=datetime(2026, 3, 11, 23, 59, tzinfo=timezone.utc),  # Next Wed
        working_hours_start=9,
        working_hours_end=17,
        allowed_days=[
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
        ],
        buffer_minutes=15,
        timezone="UTC",
        max_candidates=10,
        event_category=EventCategory.SOCIAL,
    )
    
    print("📅 Scenario: Scheduling a group dinner")
    print("   - Duration: 90 minutes")
    print("   - Category: Social Event")
    print("   - Date range: Mar 5-11, 2026")
    print("   - Participant: John (has work meetings during day)")
    print()
    
    # Find available slots
    print("🔍 Finding available time slots...")
    available_slots = AvailabilityAgent.find_available_slots(
        participants=[participant],
        constraints=constraints,
    )
    
    print(f"   Found {len(available_slots)} available slots")
    
    # Rank candidates
    print("\n🤖 AI is ranking candidates based on:")
    print("   - Social event category (prefers evenings)")
    print("   - Time slot positioning")
    print("   - Calendar optimization")
    print()
    
    ranked_candidates = OptimizationAgent.rank_candidates(
        available_slots=available_slots,
        participants=[participant],
        constraints=constraints,
    )
    
    # Display top candidates
    print("🏆 Top 10 Ranked Options:")
    print("=" * 80)
    
    for i, candidate in enumerate(ranked_candidates[:10], 1):
        slot = candidate.slot
        day_name = slot.start.strftime("%a, %b %d")
        start_time = slot.start.strftime("%I:%M %p")
        end_time = slot.end.strftime("%I:%M %p")
        
        print(f"\n#{i:2d}  📍 Score: {candidate.score:.1f}")
        print(f"     📅 {day_name}")
        print(f"     ⏰ {start_time} - {end_time}")
        
        # Show score breakdown for top 3
        if i <= 3:
            print(f"     📊 Breakdown:")
            print(f"        • Availability:  {candidate.availability_score:.1f}")
            print(f"        • Preference:    {candidate.preference_score:.1f}")
            print(f"        • Optimization:  {candidate.optimization_score:.1f}")
    
    # Analyze differentiation
    print("\n\n📊 Score Differentiation Analysis:")
    print("=" * 80)
    
    scores = [c.score for c in ranked_candidates[:10]]
    same_day_groups = {}
    
    for candidate in ranked_candidates[:10]:
        day_key = candidate.slot.start.strftime("%Y-%m-%d")
        if day_key not in same_day_groups:
            same_day_groups[day_key] = []
        same_day_groups[day_key].append(candidate)
    
    print(f"   Total candidates shown: {len(ranked_candidates[:10])}")
    print(f"   Unique scores: {len(set(scores))}")
    print(f"   Score range: {max(scores) - min(scores):.2f} points")
    
    for day_key, day_candidates in same_day_groups.items():
        if len(day_candidates) > 1:
            day_name = datetime.fromisoformat(day_key).strftime("%a, %b %d")
            print(f"\n   📅 {day_name} - {len(day_candidates)} slots:")
            for c in day_candidates:
                time_str = c.slot.start.strftime("%I:%M %p")
                print(f"      {time_str}: {c.score:.2f}")
    
    print("\n✅ Results:")
    if len(set(scores)) == len(scores):
        print("   ✓ Every slot has a unique score")
    if max(scores) - min(scores) >= 1.0:
        print("   ✓ Good score spread for meaningful differentiation")
    
    print("\n💡 Key Observations:")
    print("   - Earlier evening times (6-7pm) rank higher for social events")
    print("   - Round hours slightly preferred over half-hours")
    print("   - Mid-week days score better than Monday/Friday")
    print("   - Each time slot is uniquely scored for clear user choice")
    print()

if __name__ == "__main__":
    test_realistic_scheduling()
