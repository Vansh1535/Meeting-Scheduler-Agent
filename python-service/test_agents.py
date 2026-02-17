"""
Unit tests for AI scheduling agents.
Run: python test_agents.py
"""

import unittest
from datetime import datetime, timedelta, timezone
from typing import List

from agents.availability_agent import AvailabilityAgent
from agents.preference_agent import PreferenceAgent
from agents.optimization_agent import OptimizationAgent
from agents.negotiation_agent import NegotiationAgent

from schemas.scheduling import (
    Participant,
    TimeSlot,
    SchedulingConstraints,
    CompressedCalendarSummary,
    PreferencePattern,
    DayOfWeek,
)


class TestAvailabilityAgent(unittest.TestCase):
    """Test the Availability Agent."""
    
    def setUp(self):
        """Set up test data."""
        now = datetime.now(timezone.utc)
        # Find next Monday
        days_ahead = 0 - now.weekday()  # Monday is 0
        if days_ahead <= 0:  # If today is Monday or later, find next Monday
            days_ahead += 7
        self.tomorrow = now + timedelta(days=days_ahead)
        self.next_week = self.tomorrow + timedelta(days=7)
        
    def test_find_available_slots_basic(self):
        """Test basic slot finding."""
        # Create participants with no conflicts
        participants = [
            self._create_participant("user1", "User One", []),
            self._create_participant("user2", "User Two", []),
        ]
        
        constraints = SchedulingConstraints(
            duration_minutes=30,
            earliest_date=self.tomorrow,
            latest_date=self.tomorrow + timedelta(days=1),
            working_hours_start=9,
            working_hours_end=17,
            buffer_minutes=15,
        )
        
        slots = AvailabilityAgent.find_available_slots(participants, constraints)
        
        # Should find many available slots
        self.assertGreater(len(slots), 0)
        
        # All slots should be within working hours
        for slot in slots:
            hour = slot.start.hour
            self.assertGreaterEqual(hour, 9)
            self.assertLess(hour, 17)
    
    def test_find_available_slots_with_conflicts(self):
        """Test slot finding with participant conflicts."""
        # User 1 busy 10-11 AM
        busy_time = self.tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
        user1_busy = [TimeSlot(
            start=busy_time,
            end=busy_time + timedelta(hours=1),
            timezone="UTC"
        )]
        
        participants = [
            self._create_participant("user1", "User One", user1_busy),
            self._create_participant("user2", "User Two", []),
        ]
        
        constraints = SchedulingConstraints(
            duration_minutes=60,
            earliest_date=self.tomorrow,
            latest_date=self.tomorrow + timedelta(days=1),
            working_hours_start=9,
            working_hours_end=12,
            buffer_minutes=0,
        )
        
        slots = AvailabilityAgent.find_available_slots(participants, constraints)
        
        # Should find slots, but not the 10-11 AM slot
        for slot in slots:
            # Slot should not overlap with the busy time
            self.assertFalse(
                slot.start < busy_time + timedelta(hours=1) and
                slot.end > busy_time
            )
    
    def _create_participant(self, user_id: str, name: str, busy_slots: List[TimeSlot]) -> Participant:
        """Helper to create a participant."""
        calendar_summary = CompressedCalendarSummary(
            user_id=user_id,
            timezone="UTC",
            busy_slots=busy_slots,
            weekly_meeting_count=len(busy_slots),
        )
        
        return Participant(
            user_id=user_id,
            name=name,
            email=f"{user_id}@example.com",
            calendar_summary=calendar_summary,
            is_required=True,
        )


class TestPreferenceAgent(unittest.TestCase):
    """Test the Preference Agent."""
    
    def setUp(self):
        """Set up test data."""
        now = datetime.now(timezone.utc)
        self.tomorrow = now + timedelta(days=1)
    
    def test_score_slot_preferences_morning_person(self):
        """Test preference scoring for morning person."""
        # Create morning person
        preference = PreferencePattern(
            preferred_days=[DayOfWeek.MONDAY],
            preferred_hours_start=9,
            preferred_hours_end=12,
            morning_person_score=0.9,  # Strong morning preference
        )
        
        calendar_summary = CompressedCalendarSummary(
            user_id="user1",
            timezone="UTC",
            busy_slots=[],
            preference_patterns=preference,
        )
        
        participant = Participant(
            user_id="user1",
            name="Morning Person",
            email="user1@example.com",
            calendar_summary=calendar_summary,
            is_required=True,
        )
        
        # Test morning slot
        morning_slot = TimeSlot(
            start=self.tomorrow.replace(hour=9, minute=0),
            end=self.tomorrow.replace(hour=10, minute=0),
            timezone="UTC"
        )
        
        # Test afternoon slot
        afternoon_slot = TimeSlot(
            start=self.tomorrow.replace(hour=15, minute=0),
            end=self.tomorrow.replace(hour=16, minute=0),
            timezone="UTC"
        )
        
        morning_scores = PreferenceAgent.score_slot_preferences(morning_slot, [participant])
        afternoon_scores = PreferenceAgent.score_slot_preferences(afternoon_slot, [participant])
        
        # Morning slot should score higher
        self.assertGreater(morning_scores["user1"], afternoon_scores["user1"])
    
    def test_aggregate_preference_scores(self):
        """Test aggregating scores across participants."""
        participants = []
        for i in range(3):
            calendar_summary = CompressedCalendarSummary(
                user_id=f"user{i}",
                timezone="UTC",
                busy_slots=[],
            )
            participants.append(Participant(
                user_id=f"user{i}",
                name=f"User {i}",
                email=f"user{i}@example.com",
                calendar_summary=calendar_summary,
                is_required=True,
            ))
        
        scores = {"user0": 80.0, "user1": 90.0, "user2": 70.0}
        
        aggregate = PreferenceAgent.aggregate_preference_scores(scores, participants)
        
        # Should be weighted average
        self.assertGreater(aggregate, 70.0)
        self.assertLess(aggregate, 90.0)


class TestOptimizationAgent(unittest.TestCase):
    """Test the Optimization Agent."""
    
    def setUp(self):
        """Set up test data."""
        now = datetime.now(timezone.utc)
        self.tomorrow = now + timedelta(days=1)
    
    def test_rank_candidates(self):
        """Test candidate ranking."""
        # Create participants
        participants = []
        for i in range(2):
            calendar_summary = CompressedCalendarSummary(
                user_id=f"user{i}",
                timezone="UTC",
                busy_slots=[],
            )
            participants.append(Participant(
                user_id=f"user{i}",
                name=f"User {i}",
                email=f"user{i}@example.com",
                calendar_summary=calendar_summary,
                is_required=True,
            ))
        
        # Create slots
        slots = [
            TimeSlot(
                start=self.tomorrow.replace(hour=h, minute=0),
                end=self.tomorrow.replace(hour=h+1, minute=0),
                timezone="UTC"
            )
            for h in range(9, 12)
        ]
        
        constraints = SchedulingConstraints(
            duration_minutes=60,
            earliest_date=self.tomorrow,
            latest_date=self.tomorrow + timedelta(days=1),
            working_hours_start=9,
            working_hours_end=17,
            buffer_minutes=15,
            max_candidates=5,
        )
        
        candidates = OptimizationAgent.rank_candidates(slots, participants, constraints)
        
        # Should return candidates
        self.assertGreater(len(candidates), 0)
        
        # Should be sorted by score (descending)
        for i in range(len(candidates) - 1):
            self.assertGreaterEqual(candidates[i].score, candidates[i+1].score)
        
        # All scores should be 0-100
        for candidate in candidates:
            self.assertGreaterEqual(candidate.score, 0)
            self.assertLessEqual(candidate.score, 100)


class TestNegotiationAgent(unittest.TestCase):
    """Test the Negotiation Agent."""
    
    def test_negotiate_schedule_all_available(self):
        """Test negotiation when all participants available."""
        # Create mock candidates
        from schemas.scheduling import MeetingSlotCandidate
        
        now = datetime.now(timezone.utc)
        slot = TimeSlot(
            start=now + timedelta(days=1, hours=10),
            end=now + timedelta(days=1, hours=11),
            timezone="UTC"
        )
        
        candidates = [
            MeetingSlotCandidate(
                slot=slot,
                score=85.0,
                availability_score=100.0,
                preference_score=80.0,
                optimization_score=90.0,
                all_participants_available=True,
                reasoning="Good slot",
            )
        ]
        
        # Create participants
        participants = []
        for i in range(2):
            calendar_summary = CompressedCalendarSummary(
                user_id=f"user{i}",
                timezone="UTC",
                busy_slots=[],
            )
            participants.append(Participant(
                user_id=f"user{i}",
                name=f"User {i}",
                email=f"user{i}@example.com",
                calendar_summary=calendar_summary,
                is_required=True,
            ))
        
        constraints = SchedulingConstraints(
            duration_minutes=60,
            earliest_date=now,
            latest_date=now + timedelta(days=7),
            max_candidates=5,
        )
        
        result, rounds = NegotiationAgent.negotiate_schedule(
            candidates, participants, constraints
        )
        
        # Should return candidates with minimal negotiation
        self.assertGreater(len(result), 0)
        self.assertGreaterEqual(rounds, 0)


class TestIntegration(unittest.TestCase):
    """Integration tests for full agent pipeline."""
    
    def test_full_scheduling_pipeline(self):
        """Test complete scheduling workflow."""
        # Setup
        now = datetime.now(timezone.utc)
        # Find next Monday
        days_ahead = 0 - now.weekday()  # Monday is 0
        if days_ahead <= 0:  # If today is Monday or later, find next Monday
            days_ahead += 7
        tomorrow = now + timedelta(days=days_ahead)
        
        # Create participants
        participants = []
        for i in range(2):
            calendar_summary = CompressedCalendarSummary(
                user_id=f"user{i}",
                timezone="UTC",
                busy_slots=[],
                weekly_meeting_count=5,
            )
            participants.append(Participant(
                user_id=f"user{i}",
                name=f"User {i}",
                email=f"user{i}@example.com",
                calendar_summary=calendar_summary,
                is_required=True,
            ))
        
        constraints = SchedulingConstraints(
            duration_minutes=30,
            earliest_date=tomorrow,
            latest_date=tomorrow + timedelta(days=1),
            working_hours_start=9,
            working_hours_end=17,
            buffer_minutes=15,
            max_candidates=5,
        )
        
        # Step 1: Find available slots
        available_slots = AvailabilityAgent.find_available_slots(
            participants, constraints
        )
        self.assertGreater(len(available_slots), 0, "Should find available slots")
        
        # Step 2: Score preferences
        scores = PreferenceAgent.score_slot_preferences(available_slots[0], participants)
        self.assertEqual(len(scores), len(participants), "Should score all participants")
        
        # Step 3: Rank candidates
        candidates = OptimizationAgent.rank_candidates(
            available_slots, participants, constraints
        )
        self.assertGreater(len(candidates), 0, "Should generate candidates")
        self.assertGreater(candidates[0].score, 0, "Best candidate should have positive score")
        
        # Step 4: Negotiate (if needed)
        final_candidates, rounds = NegotiationAgent.negotiate_schedule(
            candidates, participants, constraints
        )
        self.assertGreater(len(final_candidates), 0, "Should return final candidates")


def run_tests():
    """Run all tests."""
    print("=" * 80)
    print("  AI SCHEDULING AGENTS - UNIT TEST SUITE")
    print("=" * 80)
    print()
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestAvailabilityAgent))
    suite.addTests(loader.loadTestsFromTestCase(TestPreferenceAgent))
    suite.addTests(loader.loadTestsFromTestCase(TestOptimizationAgent))
    suite.addTests(loader.loadTestsFromTestCase(TestNegotiationAgent))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print()
    print("=" * 80)
    print("  TEST SUMMARY")
    print("=" * 80)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print()
    
    if result.wasSuccessful():
        print("✓ ALL TESTS PASSED!")
    else:
        print("✗ SOME TESTS FAILED")
    
    print("=" * 80)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
