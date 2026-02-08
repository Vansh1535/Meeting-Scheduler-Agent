"""Negotiation Agent: Resolves conflicts for multi-party meetings."""

from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime, timedelta
from schemas.scheduling import (
    Participant,
    TimeSlot,
    MeetingSlotCandidate,
    SchedulingConstraints,
)
from agents.optimization_agent import OptimizationAgent
from agents.availability_agent import AvailabilityAgent


class NegotiationAgent:
    """
    Stateless agent that negotiates and resolves scheduling conflicts.
    
    Responsibilities:
    - Handle conflicts when no perfect slot exists
    - Prioritize required vs optional participants
    - Suggest compromise solutions
    - Provide alternative recommendations
    """
    
    @staticmethod
    def negotiate_schedule(
        candidates: List[MeetingSlotCandidate],
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> Tuple[List[MeetingSlotCandidate], int]:
        """
        Negotiate to find best possible meeting times, handling conflicts.
        
        Args:
            candidates: Initial list of candidates (may have conflicts)
            participants: List of participants
            constraints: Scheduling constraints
            
        Returns:
            Tuple of (negotiated_candidates, negotiation_rounds)
        """
        negotiation_rounds = 0
        max_rounds = 3
        
        # Separate required and optional participants
        required = [p for p in participants if p.is_required]
        optional = [p for p in participants if not p.is_required]
        
        # Strategy 1: Try to accommodate all required participants first
        if required:
            negotiation_rounds += 1
            required_candidates = NegotiationAgent._filter_for_required_participants(
                candidates, required
            )
            
            if required_candidates:
                # Re-score considering optional participant availability
                negotiation_rounds += 1
                final_candidates = NegotiationAgent._rescore_with_optional(
                    required_candidates, optional, constraints
                )
                return final_candidates, negotiation_rounds
        
        # Strategy 2: If no slots work for all required, suggest compromises
        if not candidates or all(not c.all_participants_available for c in candidates):
            negotiation_rounds += 1
            compromise_candidates = NegotiationAgent._suggest_compromises(
                participants, constraints
            )
            return compromise_candidates[:constraints.max_candidates], negotiation_rounds
        
        # Strategy 3: If we have good candidates, just return them
        return candidates, negotiation_rounds
    
    @staticmethod
    def _filter_for_required_participants(
        candidates: List[MeetingSlotCandidate],
        required_participants: List[Participant],
    ) -> List[MeetingSlotCandidate]:
        """
        Filter candidates to only those that work for all required participants.
        
        Args:
            candidates: List of all candidates
            required_participants: List of required participants
            
        Returns:
            Filtered list of candidates
        """
        required_ids = {p.user_id for p in required_participants}
        
        filtered = []
        for candidate in candidates:
            # Check if any required participant has a conflict
            has_required_conflict = any(
                conflict_id in required_ids
                for conflict_id in candidate.conflicts
            )
            
            if not has_required_conflict:
                filtered.append(candidate)
        
        return filtered
    
    @staticmethod
    def _rescore_with_optional(
        candidates: List[MeetingSlotCandidate],
        optional_participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> List[MeetingSlotCandidate]:
        """
        Re-score candidates considering optional participant availability.
        Boost scores when optional participants can also attend.
        
        Args:
            candidates: Candidates that work for required participants
            optional_participants: List of optional participants
            constraints: Scheduling constraints
            
        Returns:
            Re-scored candidates
        """
        if not optional_participants:
            return candidates
        
        rescored = []
        
        for candidate in candidates:
            # Count how many optional participants are available
            available_optional = 0
            for participant in optional_participants:
                avail_score = AvailabilityAgent.get_participant_availability_score(
                    candidate.slot, participant, constraints
                )
                if avail_score > 50:  # Reasonably available
                    available_optional += 1
            
            # Boost score based on optional participant availability
            optional_ratio = (
                available_optional / len(optional_participants)
                if optional_participants else 0
            )
            bonus = optional_ratio * 10  # Up to 10 point bonus
            
            # Create new candidate with boosted score
            new_score = min(100.0, candidate.score + bonus)
            
            # Update reasoning
            new_reasoning = candidate.reasoning
            if available_optional > 0:
                new_reasoning += f" Includes {available_optional}/{len(optional_participants)} optional participants."
            
            rescored_candidate = MeetingSlotCandidate(
                slot=candidate.slot,
                score=round(new_score, 2),
                availability_score=candidate.availability_score,
                preference_score=candidate.preference_score,
                optimization_score=candidate.optimization_score,
                conflicts=candidate.conflicts,
                all_participants_available=(
                    len(candidate.conflicts) == 0 and available_optional == len(optional_participants)
                ),
                reasoning=new_reasoning,
            )
            
            rescored.append(rescored_candidate)
        
        # Re-sort by new scores
        rescored.sort(key=lambda x: x.score, reverse=True)
        return rescored
    
    @staticmethod
    def _suggest_compromises(
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> List[MeetingSlotCandidate]:
        """
        Suggest compromise solutions when no perfect slot exists.
        
        Args:
            participants: All participants
            constraints: Scheduling constraints
            
        Returns:
            List of compromise candidates
        """
        # Strategy: Relax constraints progressively
        compromises = []
        
        # 1. Try expanding working hours slightly
        relaxed_constraints_1 = SchedulingConstraints(
            duration_minutes=constraints.duration_minutes,
            earliest_date=constraints.earliest_date,
            latest_date=constraints.latest_date,
            working_hours_start=max(7, constraints.working_hours_start - 1),
            working_hours_end=min(19, constraints.working_hours_end + 1),
            allowed_days=constraints.allowed_days,
            buffer_minutes=max(0, constraints.buffer_minutes - 5),
            timezone=constraints.timezone,
            max_candidates=constraints.max_candidates,
        )
        
        slots_1 = AvailabilityAgent.find_available_slots(
            participants, relaxed_constraints_1
        )
        
        if slots_1:
            candidates_1 = OptimizationAgent.rank_candidates(
                slots_1, participants, relaxed_constraints_1
            )
            for candidate in candidates_1[:3]:
                # Mark as compromise
                candidate.reasoning = f"Compromise: Extended hours. {candidate.reasoning}"
                compromises.append(candidate)
        
        # 2. Try reducing buffer time
        relaxed_constraints_2 = SchedulingConstraints(
            duration_minutes=constraints.duration_minutes,
            earliest_date=constraints.earliest_date,
            latest_date=constraints.latest_date,
            working_hours_start=constraints.working_hours_start,
            working_hours_end=constraints.working_hours_end,
            allowed_days=constraints.allowed_days,
            buffer_minutes=max(0, constraints.buffer_minutes - 10),
            timezone=constraints.timezone,
            max_candidates=constraints.max_candidates,
        )
        
        slots_2 = AvailabilityAgent.find_available_slots(
            participants, relaxed_constraints_2
        )
        
        if slots_2:
            candidates_2 = OptimizationAgent.rank_candidates(
                slots_2, participants, relaxed_constraints_2
            )
            for candidate in candidates_2[:3]:
                candidate.reasoning = f"Compromise: Reduced buffer. {candidate.reasoning}"
                compromises.append(candidate)
        
        # 3. Try shorter duration
        if constraints.duration_minutes > 30:
            relaxed_constraints_3 = SchedulingConstraints(
                duration_minutes=max(15, constraints.duration_minutes - 15),
                earliest_date=constraints.earliest_date,
                latest_date=constraints.latest_date,
                working_hours_start=constraints.working_hours_start,
                working_hours_end=constraints.working_hours_end,
                allowed_days=constraints.allowed_days,
                buffer_minutes=constraints.buffer_minutes,
                timezone=constraints.timezone,
                max_candidates=constraints.max_candidates,
            )
            
            slots_3 = AvailabilityAgent.find_available_slots(
                participants, relaxed_constraints_3
            )
            
            if slots_3:
                candidates_3 = OptimizationAgent.rank_candidates(
                    slots_3, participants, relaxed_constraints_3
                )
                for candidate in candidates_3[:3]:
                    candidate.reasoning = f"Compromise: Shorter meeting ({relaxed_constraints_3.duration_minutes}min). {candidate.reasoning}"
                    compromises.append(candidate)
        
        # Remove duplicates and sort by score
        unique_compromises = NegotiationAgent._deduplicate_candidates(compromises)
        unique_compromises.sort(key=lambda x: x.score, reverse=True)
        
        return unique_compromises
    
    @staticmethod
    def _deduplicate_candidates(
        candidates: List[MeetingSlotCandidate],
    ) -> List[MeetingSlotCandidate]:
        """Remove duplicate time slots from candidate list."""
        seen = set()
        unique = []
        
        for candidate in candidates:
            # Create key from start time
            key = candidate.slot.start.isoformat()
            
            if key not in seen:
                seen.add(key)
                unique.append(candidate)
        
        return unique
    
    @staticmethod
    def analyze_conflicts(
        candidates: List[MeetingSlotCandidate],
        participants: List[Participant],
    ) -> Dict[str, Any]:
        """
        Analyze conflict patterns across candidates.
        
        Args:
            candidates: List of candidates
            participants: List of participants
            
        Returns:
            Dictionary with conflict analysis
        """
        if not candidates:
            return {
                "total_conflicts": 0,
                "conflict_rate": 0.0,
                "most_constrained_participants": [],
            }
        
        # Count conflicts per participant
        conflict_counts = {p.user_id: 0 for p in participants}
        
        for candidate in candidates:
            for conflict_id in candidate.conflicts:
                if conflict_id in conflict_counts:
                    conflict_counts[conflict_id] += 1
        
        # Find most constrained participants
        sorted_conflicts = sorted(
            conflict_counts.items(),
            key=lambda x: x[1],
            reverse=True,
        )
        
        most_constrained = [
            {"user_id": uid, "conflict_count": count}
            for uid, count in sorted_conflicts[:3]
            if count > 0
        ]
        
        # Calculate overall metrics
        total_conflicts = sum(len(c.conflicts) for c in candidates)
        total_slots = len(candidates) * len(participants)
        conflict_rate = (total_conflicts / total_slots * 100) if total_slots > 0 else 0
        
        return {
            "total_conflicts": total_conflicts,
            "conflict_rate": round(conflict_rate, 1),
            "most_constrained_participants": most_constrained,
            "candidates_without_conflicts": sum(
                1 for c in candidates if not c.conflicts
            ),
        }
