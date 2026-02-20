"""Test that time slots on the same day have different scores."""

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
from agents.optimization_agent import OptimizationAgent

def test_score_differentiation():
    """Test that slots at different times on the same day get different scores."""
    
    print("\n🧪 Testing Score Differentiation for Same-Day Slots\n")
    print("=" * 70)
    
    # Create test participant with some busy slots
    participant = Participant(
        user_id="user123",
        email="test@example.com",
        name="Test User",
        is_required=True,
        calendar_summary=CompressedCalendarSummary(
            user_id="user123",
            timezone="UTC",
            busy_slots=[
                TimeSlot(
                    start=datetime(2026, 3, 5, 14, 0, tzinfo=timezone.utc),  # 2pm busy
                    end=datetime(2026, 3, 5, 15, 0, tzinfo=timezone.utc),
                    timezone="UTC"
                )
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
                morning_person_score=0.7
            ),
            data_compressed=True,
            compression_period_days=90
        )
    )
    
    # Create constraints for SOCIAL event (evening times)
    constraints = SchedulingConstraints(
        duration_minutes=60,
        earliest_date=datetime(2026, 3, 5, 0, 0, tzinfo=timezone.utc),
        latest_date=datetime(2026, 3, 5, 23, 59, tzinfo=timezone.utc),
        working_hours_start=9,
        working_hours_end=17,
        allowed_days=[DayOfWeek.WEDNESDAY],
        buffer_minutes=15,
        timezone="UTC",
        max_candidates=10,
        event_category=EventCategory.SOCIAL,
    )
    
    # Create test time slots on the same day (Thursday, Mar 5, evening)
    test_slots = [
        TimeSlot(
            start=datetime(2026, 3, 5, 18, 0, tzinfo=timezone.utc),  # 6:00 PM
            end=datetime(2026, 3, 5, 19, 0, tzinfo=timezone.utc),
            timezone="UTC"
        ),
        TimeSlot(
            start=datetime(2026, 3, 5, 18, 30, tzinfo=timezone.utc),  # 6:30 PM
            end=datetime(2026, 3, 5, 19, 30, tzinfo=timezone.utc),
            timezone="UTC"
        ),
        TimeSlot(
            start=datetime(2026, 3, 5, 19, 0, tzinfo=timezone.utc),  # 7:00 PM
            end=datetime(2026, 3, 5, 20, 0, tzinfo=timezone.utc),
            timezone="UTC"
        ),
        TimeSlot(
            start=datetime(2026, 3, 5, 19, 30, tzinfo=timezone.utc),  # 7:30 PM
            end=datetime(2026, 3, 5, 20, 30, tzinfo=timezone.utc),
            timezone="UTC"
        ),
        TimeSlot(
            start=datetime(2026, 3, 5, 20, 0, tzinfo=timezone.utc),  # 8:00 PM
            end=datetime(2026, 3, 5, 21, 0, tzinfo=timezone.utc),
            timezone="UTC"
        ),
    ]
    
    # Evaluate each slot
    print("\n📊 Evaluating Time Slots on Thursday, Mar 5 (Social Event):")
    print("-" * 70)
    
    candidates = []
    for slot in test_slots:
        candidate = OptimizationAgent._evaluate_slot(slot, [participant], constraints)
        candidates.append(candidate)
        
        time_str = slot.start.strftime("%I:%M %p")
        print(f"\n⏰ {time_str}")
        print(f"   Overall Score:     {candidate.score:.2f}")
        print(f"   Availability:      {candidate.availability_score:.2f}")
        print(f"   Preference:        {candidate.preference_score:.2f}")
        print(f"   Optimization:      {candidate.optimization_score:.2f}")
        print(f"   Conflict Prox:     {candidate.conflict_proximity_score:.2f}")
        print(f"   Fragmentation:     {candidate.fragmentation_score:.2f}")
    
    # Analyze score distribution
    print("\n\n📈 Score Analysis:")
    print("-" * 70)
    
    scores = [c.score for c in candidates]
    unique_scores = len(set(scores))
    score_range = max(scores) - min(scores)
    
    print(f"   Unique scores: {unique_scores} out of {len(candidates)} slots")
    print(f"   Score range: {score_range:.2f} points")
    print(f"   Min score: {min(scores):.2f}")
    print(f"   Max score: {max(scores):.2f}")
    
    # Sort by score to see ranking
    candidates_sorted = sorted(candidates, key=lambda c: c.score, reverse=True)
    
    print("\n🏆 Ranking:")
    print("-" * 70)
    for i, candidate in enumerate(candidates_sorted, 1):
        time_str = candidate.slot.start.strftime("%I:%M %p")
        print(f"   #{i}  {time_str}  -  Score: {candidate.score:.2f}")
    
    if unique_scores == len(candidates):
        print("\n✅ SUCCESS! All slots have unique scores")
    elif unique_scores > len(candidates) * 0.7:
        print(f"\n⚠️  PARTIAL: {unique_scores}/{len(candidates)} slots have unique scores")
    else:
        print(f"\n❌ ISSUE: Only {unique_scores}/{len(candidates)} slots have unique scores")
    
    if score_range >= 0.5:
        print(f"✅ Good score differentiation: {score_range:.2f} point range")
    elif score_range >= 0.2:
        print(f"⚠️  Moderate differentiation: {score_range:.2f} point range")
    else:
        print(f"❌ Poor differentiation: {score_range:.2f} point range")
    
    print("\n" + "=" * 70)
    print("\n💡 Expected behavior:")
    print("   - Earlier evening times (6-7pm) should score slightly higher for social")
    print("   - Round hours (:00) should score slightly higher than half hours (:30)")
    print("   - Each slot should have a unique score")
    print()

if __name__ == "__main__":
    test_score_differentiation()
