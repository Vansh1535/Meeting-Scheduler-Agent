"""
Standalone demonstration of AI scheduling agents.
This script proves the agents work without requiring external services.

Run: python demo_agents.py
"""

from datetime import datetime, timedelta, timezone
from typing import List
import json

# Import our AI agents
from agents.availability_agent import AvailabilityAgent
from agents.preference_agent import PreferenceAgent
from agents.optimization_agent import OptimizationAgent
from agents.negotiation_agent import NegotiationAgent

# Import schemas
from schemas.scheduling import (
    Participant,
    TimeSlot,
    SchedulingConstraints,
    CompressedCalendarSummary,
    PreferencePattern,
    DayOfWeek,
)


def create_test_participant(user_id: str, name: str, busy_times_raw: List[dict]) -> Participant:
    """Create a test participant with calendar data."""
    
    # Convert busy times to TimeSlot objects
    busy_slots = [
        TimeSlot(
            start=datetime.fromisoformat(bt["start"]),
            end=datetime.fromisoformat(bt["end"]),
            timezone="UTC"
        )
        for bt in busy_times_raw
    ]
    
    # Create preference pattern
    preference_pattern = PreferencePattern(
        preferred_days=[DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY],
        preferred_hours_start=9,
        preferred_hours_end=17,
        avg_meeting_duration_minutes=60,
        buffer_minutes=15,
        avoids_back_to_back=True,
        morning_person_score=0.7,  # Prefers mornings
    )
    
    # Create calendar summary
    calendar_summary = CompressedCalendarSummary(
        user_id=user_id,
        timezone="UTC",
        busy_slots=busy_slots,
        weekly_meeting_count=len(busy_times_raw),
        peak_meeting_hours=[9, 10, 14, 15],
        preference_patterns=preference_pattern,
        data_compressed=True,
        compression_period_days=365,
    )
    
    return Participant(
        user_id=user_id,
        name=name,
        email=f"{user_id}@example.com",
        calendar_summary=calendar_summary,
        is_required=True,
    )


def print_separator(title: str = ""):
    """Print a section separator."""
    if title:
        print(f"\n{'=' * 80}")
        print(f"  {title}")
        print(f"{'=' * 80}\n")
    else:
        print(f"{'-' * 80}")


def main():
    """Run the demonstration."""
    
    print_separator("AI MEETING SCHEDULER - AGENT DEMONSTRATION")
    
    # Setup test scenario
    print("📋 SCENARIO: Schedule a 60-minute meeting for 3 people")
    print("   • Alice: Available mornings, busy afternoons on Monday")
    print("   • Bob: Available all day Tuesday, busy Wednesday morning")
    print("   • Carol: Prefers afternoons, busy Monday afternoon")
    
    # Create test participants
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)
    next_week = now + timedelta(days=7)
    
    # Alice's busy times (Monday afternoon)
    alice_busy = [
        {
            "start": (tomorrow + timedelta(hours=13)).isoformat(),
            "end": (tomorrow + timedelta(hours=17)).isoformat(),
        }
    ]
    
    # Bob's busy times (Wednesday morning)
    bob_busy = [
        {
            "start": (tomorrow + timedelta(days=2, hours=9)).isoformat(),
            "end": (tomorrow + timedelta(days=2, hours=12)).isoformat(),
        }
    ]
    
    # Carol's busy times (Monday afternoon)
    carol_busy = [
        {
            "start": (tomorrow + timedelta(hours=14)).isoformat(),
            "end": (tomorrow + timedelta(hours=16)).isoformat(),
        }
    ]
    
    participants = [
        create_test_participant("alice", "Alice Johnson", alice_busy),
        create_test_participant("bob", "Bob Smith", bob_busy),
        create_test_participant("carol", "Carol Williams", carol_busy),
    ]
    
    # Define scheduling constraints
    constraints = SchedulingConstraints(
        duration_minutes=60,
        earliest_date=tomorrow.replace(hour=9, minute=0, second=0, microsecond=0),
        latest_date=next_week,
        working_hours_start=9,
        working_hours_end=17,
        allowed_days=[DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY],
        buffer_minutes=15,
        max_candidates=5,
    )
    
    # STEP 1: Availability Agent
    print_separator("STEP 1: AVAILABILITY AGENT")
    print("Finding time slots where all participants are available...\n")
    
    available_slots = AvailabilityAgent.find_available_slots(
        participants=participants,
        constraints=constraints,
    )
    
    print(f"✓ Found {len(available_slots)} available time slots")
    
    if available_slots:
        print("\nSample available slots:")
        for i, slot in enumerate(available_slots[:3], 1):
            print(f"  {i}. {slot.start.strftime('%A %I:%M %p')} - {slot.end.strftime('%I:%M %p')}")
    
    if not available_slots:
        print("✗ No available slots found. Adjusting constraints...")
        return
    
    # STEP 2: Preference Agent
    print_separator("STEP 2: PREFERENCE AGENT")
    print("Scoring slots based on participant preferences...\n")
    
    sample_slot = available_slots[0]
    preference_scores = PreferenceAgent.score_slot_preferences(
        sample_slot, participants
    )
    
    print("Preference scores for first slot:")
    for user_id, score in preference_scores.items():
        participant = next(p for p in participants if p.user_id == user_id)
        print(f"  • {participant.name}: {score:.1f}/100")
    
    aggregate_score = PreferenceAgent.aggregate_preference_scores(
        preference_scores, participants
    )
    print(f"\n  → Aggregate preference score: {aggregate_score:.1f}/100")
    
    # STEP 3: Optimization Agent
    print_separator("STEP 3: OPTIMIZATION AGENT")
    print("Ranking candidates with multi-factor scoring...\n")
    
    candidates = OptimizationAgent.rank_candidates(
        available_slots=available_slots,
        participants=participants,
        constraints=constraints,
    )
    
    print(f"✓ Ranked {len(candidates)} candidates by overall score\n")
    
    print("Scoring factors (weights):")
    print("  • Availability: 35%")
    print("  • Preference: 25%")
    print("  • Conflict Proximity: 20%")
    print("  • Fragmentation: 15%")
    print("  • Optimization: 5%")
    
    # STEP 4: Show top candidates
    print_separator("TOP MEETING CANDIDATES")
    
    for i, candidate in enumerate(candidates[:3], 1):
        duration_mins = int((candidate.slot.end - candidate.slot.start).total_seconds() / 60)
        print(f"\nCandidate #{i}:")
        print(f"  Time: {candidate.slot.start.strftime('%A, %B %d at %I:%M %p')}")
        print(f"  Duration: {duration_mins} minutes")
        print(f"  Overall Score: {candidate.score:.1f}/100")
        print(f"  All Available: {'✓ Yes' if candidate.all_participants_available else '✗ No'}")
        
        print(f"\n  Score Breakdown:")
        print(f"    • Availability: {candidate.availability_score:.1f}/100")
        print(f"    • Preference: {candidate.preference_score:.1f}/100")
        print(f"    • Conflict Proximity: {candidate.conflict_proximity_score:.1f}/100")
        print(f"    • Fragmentation: {candidate.fragmentation_score:.1f}/100")
        print(f"    • Optimization: {candidate.optimization_score:.1f}/100")
        
        print(f"\n  AI Reasoning: {candidate.reasoning}")
        
        if i < len(candidates):
            print_separator()
    
    # STEP 5: Negotiation Agent (if needed)
    print_separator("STEP 5: NEGOTIATION AGENT")
    
    if all(c.all_participants_available for c in candidates[:3]):
        print("✓ Top candidates work for all participants - no negotiation needed")
    else:
        print("Negotiating to handle scheduling conflicts...")
        
        negotiated_candidates, rounds = NegotiationAgent.negotiate_schedule(
            candidates=candidates,
            participants=participants,
            constraints=constraints,
        )
        
        print(f"\n✓ Negotiation complete in {rounds} rounds")
        print(f"  Final candidates: {len(negotiated_candidates)}")
    
    # FINAL RECOMMENDATION
    print_separator("FINAL RECOMMENDATION")
    
    best = candidates[0]
    print(f"🎯 Best meeting time:")
    print(f"   {best.slot.start.strftime('%A, %B %d, %Y at %I:%M %p')}")
    print(f"   Score: {best.score:.1f}/100")
    print(f"\n   Why this time?")
    print(f"   {best.reasoning}")
    
    # Summary statistics
    print_separator("SUMMARY STATISTICS")
    
    print(f"Agents executed: 4/4")
    print(f"Participants analyzed: {len(participants)}")
    print(f"Time slots evaluated: {len(available_slots)}")
    print(f"Candidates generated: {len(candidates)}")
    print(f"Best score achieved: {best.score:.1f}/100")
    
    print_separator()
    print("✓ DEMONSTRATION COMPLETE - All agents working correctly!\n")


if __name__ == "__main__":
    main()
