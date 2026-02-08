"""Optimization Agent: Ranks candidate slots using constraints and scoring."""

from typing import List, Dict, Tuple, Any
from datetime import datetime, timezone
from schemas.scheduling import (
    Participant,
    TimeSlot,
    MeetingSlotCandidate,
    SchedulingConstraints,
)
from agents.availability_agent import AvailabilityAgent
from agents.preference_agent import PreferenceAgent


class OptimizationAgent:
    """
    Stateless agent that ranks and optimizes meeting time slots.
    
    Responsibilities:
    - Combine availability and preference scores
    - Apply additional optimization criteria
    - Rank candidates by overall score
    - Generate explanations for scores
    """
    
    @staticmethod
    def rank_candidates(
        available_slots: List[TimeSlot],
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> List[MeetingSlotCandidate]:
        """
        Rank available time slots and return top candidates.
        
        Args:
            available_slots: List of available time slots
            participants: List of participants
            constraints: Scheduling constraints
            
        Returns:
            Sorted list of meeting slot candidates with scores
        """
        candidates = []
        
        for slot in available_slots:
            candidate = OptimizationAgent._evaluate_slot(
                slot, participants, constraints
            )
            candidates.append(candidate)
        
        # Sort by overall score (descending)
        candidates.sort(key=lambda x: x.score, reverse=True)
        
        # Return top N candidates
        return candidates[:constraints.max_candidates]
    
    @staticmethod
    def _evaluate_slot(
        slot: TimeSlot,
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> MeetingSlotCandidate:
        """
        Evaluate a single time slot and generate a candidate with scoring.
        
        Args:
            slot: Time slot to evaluate
            participants: List of participants
            constraints: Scheduling constraints
            
        Returns:
            Meeting slot candidate with detailed scoring
        """
        # 1. Calculate availability scores for each participant
        availability_scores = []
        conflicts = []
        
        for participant in participants:
            avail_score = AvailabilityAgent.get_participant_availability_score(
                slot, participant, constraints
            )
            availability_scores.append(avail_score)
            
            if avail_score == 0.0 and participant.is_required:
                conflicts.append(participant.user_id)
        
        # Aggregate availability score (average)
        avg_availability = (
            sum(availability_scores) / len(availability_scores)
            if availability_scores else 0.0
        )
        
        # 2. Calculate preference scores
        participant_preference_scores = PreferenceAgent.score_slot_preferences(
            slot, participants
        )
        preference_score = PreferenceAgent.aggregate_preference_scores(
            participant_preference_scores, participants
        )
        
        # 3. Calculate additional optimization factors
        optimization_factors = OptimizationAgent._calculate_optimization_factors(
            slot, participants, constraints
        )
        
        # 4. Combine scores with weights
        # Availability: 50%, Preference: 30%, Optimization: 20%
        overall_score = (
            avg_availability * 0.50 +
            preference_score * 0.30 +
            optimization_factors["combined_score"] * 0.20
        )
        
        # 5. Check if all required participants are available
        all_available = len(conflicts) == 0
        
        # 6. Generate reasoning
        reasoning = OptimizationAgent._generate_reasoning(
            slot,
            avg_availability,
            preference_score,
            optimization_factors,
            all_available,
            len(conflicts),
        )
        
        return MeetingSlotCandidate(
            slot=slot,
            score=round(overall_score, 2),
            availability_score=round(avg_availability, 2),
            preference_score=round(preference_score, 2),
            optimization_score=round(optimization_factors["combined_score"], 2),
            conflicts=conflicts,
            all_participants_available=all_available,
            reasoning=reasoning,
        )
    
    @staticmethod
    def _calculate_optimization_factors(
        slot: TimeSlot,
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> Dict[str, float]:
        """
        Calculate additional optimization factors beyond availability and preference.
        
        Args:
            slot: Time slot to evaluate
            participants: List of participants
            constraints: Scheduling constraints
            
        Returns:
            Dictionary with optimization factor scores
        """
        factors = {}
        
        # 1. Time of day distribution (avoid extreme early/late)
        hour = slot.start.hour
        if 9 <= hour <= 16:
            factors["time_distribution"] = 100.0
        elif 8 <= hour < 9 or 16 < hour <= 17:
            factors["time_distribution"] = 80.0
        elif 7 <= hour < 8 or 17 < hour <= 18:
            factors["time_distribution"] = 60.0
        else:
            factors["time_distribution"] = 40.0
        
        # 2. Day of week preference (mid-week slightly favored)
        weekday = slot.start.weekday()
        if weekday in [1, 2, 3]:  # Tue, Wed, Thu
            factors["day_preference"] = 100.0
        elif weekday in [0, 4]:  # Mon, Fri
            factors["day_preference"] = 90.0
        else:  # Weekend
            factors["day_preference"] = 50.0
        
        # 3. Meeting density (prefer less crowded time periods)
        density_score = OptimizationAgent._calculate_density_score(
            slot, participants
        )
        factors["density"] = density_score
        
        # 4. Timezone friendliness (for multi-timezone meetings)
        tz_score = OptimizationAgent._calculate_timezone_score(
            slot, participants
        )
        factors["timezone_friendliness"] = tz_score
        
        # 5. Recency preference (slightly favor sooner dates for urgency)
        days_from_now = (slot.start - datetime.now(timezone.utc)).days
        if days_from_now <= 3:
            factors["recency"] = 95.0
        elif days_from_now <= 7:
            factors["recency"] = 100.0  # Sweet spot
        elif days_from_now <= 14:
            factors["recency"] = 90.0
        else:
            factors["recency"] = 80.0
        
        # Combine factors (equal weight)
        combined = sum(factors.values()) / len(factors)
        factors["combined_score"] = combined
        
        return factors
    
    @staticmethod
    def _calculate_density_score(
        slot: TimeSlot,
        participants: List[Participant],
    ) -> float:
        """
        Calculate density score based on nearby meetings.
        Prefer time slots with fewer adjacent meetings.
        """
        total_density = 0
        
        for participant in participants:
            nearby_meetings = 0
            
            for busy_slot in participant.calendar_summary.busy_slots:
                # Check if busy slot is within 2 hours of proposed slot
                time_gap_minutes = min(
                    abs((slot.start - busy_slot.end).total_seconds() / 60),
                    abs((busy_slot.start - slot.end).total_seconds() / 60),
                )
                
                if time_gap_minutes <= 120:  # Within 2 hours
                    nearby_meetings += 1
            
            # Higher density = lower score
            if nearby_meetings == 0:
                participant_density = 100.0
            elif nearby_meetings == 1:
                participant_density = 80.0
            elif nearby_meetings == 2:
                participant_density = 60.0
            else:
                participant_density = 40.0
            
            total_density += participant_density
        
        return total_density / len(participants) if participants else 50.0
    
    @staticmethod
    def _calculate_timezone_score(
        slot: TimeSlot,
        participants: List[Participant],
    ) -> float:
        """
        Calculate timezone friendliness score.
        Penalize if meeting falls outside working hours for any participant.
        """
        # For Phase 1, simplified version (assume all same timezone)
        # In production, would convert slot time to each participant's timezone
        hour = slot.start.hour
        
        # Check if reasonable time for most timezones (8 AM - 6 PM)
        if 8 <= hour <= 18:
            return 100.0
        elif 7 <= hour < 8 or 18 < hour <= 19:
            return 70.0
        else:
            return 40.0
    
    @staticmethod
    def _generate_reasoning(
        slot: TimeSlot,
        availability_score: float,
        preference_score: float,
        optimization_factors: Dict[str, float],
        all_available: bool,
        conflict_count: int,
    ) -> str:
        """Generate human-readable reasoning for the score."""
        parts = []
        
        # Overall assessment
        combined_score = (
            availability_score * 0.5 +
            preference_score * 0.3 +
            optimization_factors["combined_score"] * 0.2
        )
        
        if combined_score >= 90:
            parts.append("Excellent match")
        elif combined_score >= 75:
            parts.append("Good match")
        elif combined_score >= 60:
            parts.append("Acceptable match")
        else:
            parts.append("Suboptimal match")
        
        # Availability
        if all_available:
            parts.append("all participants available")
        else:
            parts.append(f"{conflict_count} conflict(s)")
        
        # Preference alignment
        if preference_score >= 80:
            parts.append("strong preference alignment")
        elif preference_score >= 60:
            parts.append("moderate preference alignment")
        else:
            parts.append("weak preference alignment")
        
        # Time quality
        hour = slot.start.hour
        if 10 <= hour <= 15:
            parts.append("optimal time of day")
        elif 9 <= hour < 10 or 15 < hour <= 16:
            parts.append("good time of day")
        
        # Meeting density
        if optimization_factors.get("density", 50) >= 80:
            parts.append("low meeting density")
        
        return "; ".join(parts) + "."
    
    @staticmethod
    def calculate_time_savings_analytics(
        candidates: List[MeetingSlotCandidate],
        participant_count: int,
    ) -> Dict[str, Any]:
        """
        Calculate analytics on time savings and optimization efficiency.
        
        Args:
            candidates: List of ranked candidates
            participant_count: Number of participants
            
        Returns:
            Dictionary with analytics metrics
        """
        if not candidates:
            return {
                "estimated_time_saved_minutes": 0,
                "coordination_overhead_reduction": 0,
                "top_candidate_confidence": 0,
            }
        
        # Estimate time saved vs manual coordination
        # Baseline: ~15 min per person for manual back-and-forth
        baseline_coordination_time = participant_count * 15
        
        # AI reduces this by 75% (goal from requirements)
        ai_coordination_time = baseline_coordination_time * 0.25
        time_saved = baseline_coordination_time - ai_coordination_time
        
        # Overhead reduction percentage
        reduction_pct = 75.0
        
        # Confidence in top candidate
        top_score = candidates[0].score if candidates else 0
        
        return {
            "estimated_time_saved_minutes": round(time_saved, 1),
            "coordination_overhead_reduction_pct": reduction_pct,
            "top_candidate_confidence": round(top_score, 1),
            "candidates_evaluated": len(candidates),
            "avg_candidate_score": round(
                sum(c.score for c in candidates) / len(candidates), 1
            ) if candidates else 0,
        }
