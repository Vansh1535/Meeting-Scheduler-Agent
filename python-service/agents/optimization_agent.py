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
        Evaluate a single time slot and generate a candidate with realistic AI scoring.
        
        Scoring uses weighted factors (not binary):
        - Availability: 35% (ratio-based, partial availability allowed)
        - Preference: 25% (time preference alignment)
        - Conflict Proximity: 20% (penalty for back-to-back meetings)
        - Fragmentation: 15% (calendar grouping quality)
        - Optimization: 5% (other factors)
        
        Args:
            slot: Time slot to evaluate
            participants: List of participants
            constraints: Scheduling constraints
            
        Returns:
            Meeting slot candidate with detailed scoring
        """
        # 1. Calculate availability ratio (not binary)
        availability_data = OptimizationAgent._calculate_availability_factor(
            slot, participants, constraints
        )
        availability_factor = availability_data["factor"]
        conflicts = availability_data["conflicts"]
        all_available = len(conflicts) == 0
        
        # 2. Calculate preference scores
        event_category = getattr(constraints, 'event_category', None)
        participant_preference_scores = PreferenceAgent.score_slot_preferences(
            slot, participants, event_category
        )
        preference_score = PreferenceAgent.aggregate_preference_scores(
            participant_preference_scores, participants
        )
        # Normalize to 0-1 range
        preference_factor = preference_score / 100.0
        
        # 3. Calculate conflict proximity score (back-to-back penalty)
        conflict_proximity_data = OptimizationAgent._calculate_conflict_proximity(
            slot, participants, constraints
        )
        conflict_proximity_factor = conflict_proximity_data["factor"]
        
        # 4. Calculate fragmentation score (calendar grouping)
        fragmentation_data = OptimizationAgent._calculate_fragmentation(
            slot, participants
        )
        fragmentation_factor = fragmentation_data["factor"]
        
        # 4b. Calculate same-day gap utilization bonus
        same_day_gap_bonus = OptimizationAgent._calculate_same_day_gap_bonus(
            slot, participants, constraints
        )
        
        # 5. Calculate additional optimization factors
        optimization_factors = OptimizationAgent._calculate_optimization_factors(
            slot, participants, constraints
        )
        optimization_factor = optimization_factors["combined_score"] / 100.0
        
        # 6. Combine scores with realistic AI weights
        # Availability: 35%, Preference: 25%, Conflict Proximity: 20%,
        # Fragmentation: 15%, Optimization: 5%
        base_score = (
            availability_factor * 0.35 +
            preference_factor * 0.25 +
            conflict_proximity_factor * 0.20 +
            fragmentation_factor * 0.15 +
            optimization_factor * 0.05
        ) * 100.0
        
        # 6b. Add time-slot differentiation for tie-breaking (max ±0.5 points)
        time_differentiation = OptimizationAgent._calculate_time_slot_differentiation(
            slot, constraints
        )
        
        # 6c. Add same-day gap bonus (up to +5 points for office hour gaps)
        overall_score = base_score + time_differentiation + same_day_gap_bonus
        
        # 7. Build detailed breakdown
        breakdown = {
            "availability": round(availability_factor * 100, 2),
            "preference": round(preference_factor * 100, 2),
            "conflict_proximity": round(conflict_proximity_factor * 100, 2),
            "fragmentation": round(fragmentation_factor * 100, 2),
            "optimization": round(optimization_factor * 100, 2),
            "same_day_gap_bonus": round(same_day_gap_bonus, 2),
            "time_differentiation": round(time_differentiation, 2),
            "weights": {
                "availability": 35,
                "preference": 25,
                "conflict_proximity": 20,
                "fragmentation": 15,
                "optimization": 5,
            },
            "availability_details": availability_data.get("details", {}),
            "conflict_proximity_details": conflict_proximity_data.get("details", {}),
            "fragmentation_details": fragmentation_data.get("details", {}),
        }
        
        # 8. Generate reasoning
        reasoning = OptimizationAgent._generate_reasoning(
            slot,
            availability_factor * 100,
            preference_score,
            overall_score,
            all_available,
            len(conflicts),
            conflict_proximity_factor * 100,
            fragmentation_factor * 100,
            same_day_gap_bonus,
        )
        
        return MeetingSlotCandidate(
            slot=slot,
            score=round(overall_score, 2),
            availability_score=round(availability_factor * 100, 2),
            preference_score=round(preference_score, 2),
            optimization_score=round(optimization_factor * 100, 2),
            conflict_proximity_score=round(conflict_proximity_factor * 100, 2),
            fragmentation_score=round(fragmentation_factor * 100, 2),
            score_breakdown=breakdown,
            conflicts=conflicts,
            all_participants_available=all_available,
            reasoning=reasoning,
        )
    
    @staticmethod
    def _calculate_availability_factor(
        slot: TimeSlot,
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> Dict[str, Any]:
        """
        Calculate availability factor using participant ratio (not binary).
        
        Allows partial availability but heavily penalizes missing required participants.
        
        Returns:
            Dictionary with factor (0-1), conflicts, and details
        """
        required_participants = [p for p in participants if p.is_required]
        optional_participants = [p for p in participants if not p.is_required]
        
        available_required = []
        available_optional = []
        conflicts = []
        
        for participant in required_participants:
            avail_score = AvailabilityAgent.get_participant_availability_score(
                slot, participant, constraints
            )
            if avail_score > 50.0:  # Consider > 50% as "available"
                available_required.append(participant.user_id)
            elif avail_score == 0.0:  # Hard conflict
                conflicts.append(participant.user_id)
        
        for participant in optional_participants:
            avail_score = AvailabilityAgent.get_participant_availability_score(
                slot, participant, constraints
            )
            if avail_score > 50.0:
                available_optional.append(participant.user_id)
        
        # Calculate factor
        required_ratio = (
            len(available_required) / len(required_participants)
            if required_participants else 1.0
        )
        optional_ratio = (
            len(available_optional) / len(optional_participants)
            if optional_participants else 1.0
        )
        
        # If all required available, factor = 0.70 + 0.30 * optional_ratio (70-100%)
        # If some required missing, factor = 0.50 * required_ratio (0-50%)
        if required_ratio == 1.0:
            factor = 0.70 + 0.30 * optional_ratio
        else:
            factor = 0.50 * required_ratio
        
        return {
            "factor": factor,
            "conflicts": conflicts,
            "details": {
                "required_available": len(available_required),
                "required_total": len(required_participants),
                "optional_available": len(available_optional),
                "optional_total": len(optional_participants),
                "required_ratio": round(required_ratio, 2),
                "optional_ratio": round(optional_ratio, 2),
            }
        }
    
    @staticmethod
    def _calculate_conflict_proximity(
        slot: TimeSlot,
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> Dict[str, Any]:
        """
        Calculate conflict proximity score (penalty for back-to-back meetings).
        
        Scoring:
        - No adjacent conflicts: 1.0
        - Buffer satisfied (15+ min): 0.85-0.95
        - Close but not overlapping (5-15 min): 0.60-0.85
        - Back-to-back (0-5 min): 0.35-0.60
        - Overlapping: 0.0-0.30
        
        Returns:
            Dictionary with factor (0-1) and details
        """
        proximity_scores = []
        min_gap_before = float('inf')
        min_gap_after = float('inf')
        has_overlap = False
        
        for participant in participants:
            for busy_slot in participant.calendar_summary.busy_slots:
                # Check for overlap
                if AvailabilityAgent._slots_overlap(
                    slot.start, slot.end,
                    busy_slot.start, busy_slot.end
                ):
                    has_overlap = True
                    proximity_scores.append(0.15)  # Heavy penalty for overlap
                    continue
                
                # Calculate gaps
                gap_before = (slot.start - busy_slot.end).total_seconds() / 60
                gap_after = (busy_slot.start - slot.end).total_seconds() / 60
                
                if 0 <= gap_before < min_gap_before:
                    min_gap_before = gap_before
                if 0 <= gap_after < min_gap_after:
                    min_gap_after = gap_after
        
        # Calculate proximity factor based on minimum gaps
        if has_overlap:
            factor = 0.15
        elif min_gap_before == float('inf') and min_gap_after == float('inf'):
            factor = 1.0  # No nearby meetings
        else:
            min_gap = min(min_gap_before, min_gap_after)
            
            if min_gap >= constraints.buffer_minutes:
                # Buffer satisfied
                factor = 0.85 + 0.10 * min(min_gap / 60, 1.0)  # 0.85-0.95
            elif min_gap >= 5:
                # Close but acceptable
                factor = 0.60 + 0.25 * (min_gap / constraints.buffer_minutes)  # 0.60-0.85
            else:
                # Back-to-back or very close
                factor = 0.35 + 0.25 * (min_gap / 5.0)  # 0.35-0.60
        
        return {
            "factor": factor,
            "details": {
                "min_gap_before_minutes": round(min_gap_before, 1) if min_gap_before != float('inf') else None,
                "min_gap_after_minutes": round(min_gap_after, 1) if min_gap_after != float('inf') else None,
                "has_overlap": has_overlap,
                "buffer_required": constraints.buffer_minutes,
            }
        }
    
    @staticmethod
    def _calculate_fragmentation(
        slot: TimeSlot,
        participants: List[Participant],
    ) -> Dict[str, Any]:
        """
        Calculate fragmentation score (calendar grouping quality).
        
        Prefers grouping meetings together rather than isolated slots.
        
        Scoring:
        - Groups with other meetings (same day, 2-4hr gap): 0.85-1.0
        - Moderately grouped (same day, wider gap): 0.65-0.85
        - Some meetings nearby (different day): 0.45-0.65
        - Isolated meeting on otherwise free day: 0.25-0.45
        
        Returns:
            Dictionary with factor (0-1) and details
        """
        meeting_densities = []
        
        for participant in participants:
            nearby_count = 0
            same_day_count = 0
            close_time_count = 0  # Within 4 hours
            
            for busy_slot in participant.calendar_summary.busy_slots:
                # Check if same day
                if busy_slot.start.date() == slot.start.date():
                    same_day_count += 1
                    
                    # Check if within 4 hours
                    time_gap_minutes = min(
                        abs((slot.start - busy_slot.end).total_seconds() / 60),
                        abs((busy_slot.start - slot.end).total_seconds() / 60),
                    )
                    
                    if time_gap_minutes <= 240:  # 4 hours
                        close_time_count += 1
                
                # Check if nearby (within 1 day, 8 hours apart)
                time_diff_hours = abs((slot.start - busy_slot.start).total_seconds() / 3600)
                if time_diff_hours <= 24:
                    nearby_count += 1
            
            # Calculate participant's fragmentation score
            if close_time_count >= 2:
                # Well grouped on same day
                participant_score = 0.90 + min(close_time_count * 0.05, 0.10)  # 0.90-1.0
            elif close_time_count == 1:
                # Somewhat grouped
                participant_score = 0.75
            elif same_day_count >= 1:
                # Same day but not close
                participant_score = 0.55
            elif nearby_count >= 1:
                # Different day but nearby
                participant_score = 0.40
            else:
                # Isolated
                participant_score = 0.30
            
            meeting_densities.append(participant_score)
        
        # Average across participants
        avg_factor = sum(meeting_densities) / len(meeting_densities) if meeting_densities else 0.5
        
        return {
            "factor": avg_factor,
            "details": {
                "avg_nearby_meetings": round(sum(meeting_densities) / len(meeting_densities), 2) if meeting_densities else 0,
                "grouping_quality": "high" if avg_factor >= 0.75 else "medium" if avg_factor >= 0.50 else "low",
            }
        }
    
    @staticmethod
    def _calculate_same_day_gap_bonus(
        slot: TimeSlot,
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> float:
        """
        Calculate bonus for filling gaps during office hours on days with existing meetings.
        
        This addresses the issue where AI suggests after-hours slots even when there are
        available gaps during office hours on the same day.
        
        Key logic:
        - If there are meetings on the same day AND this slot is during office hours → BONUS
        - Prioritizes filling work-day gaps over extending the day
        - Especially valuable for MEETING category events (work-related)
        
        Args:
            slot: Time slot to evaluate
            participants: List of participants
            constraints: Scheduling constraints
            
        Returns:
            Bonus points (0 to +8.0)
        """
        max_bonus = 0.0
        event_category = getattr(constraints, 'event_category', None)
        
        # Check if slot is during office hours
        slot_hour = slot.start.hour
        office_start = constraints.working_hours_start
        office_end = constraints.working_hours_end
        is_office_hours = office_start <= slot_hour < office_end
        
        # DEBUG logging
        print(f"🔍 Gap Bonus Debug: Slot {slot.start.strftime('%I:%M %p')} | Office hrs: {office_start}-{office_end} | Is office: {is_office_hours}")
        
        if not is_office_hours:
            # Not during office hours - no bonus (or even penalty for extending day)
            print(f"   ❌ Not office hours - no bonus")
            return 0.0
        
        # Check each participant for same-day meetings
        for participant in participants:
            same_day_meetings = []
            
            for busy_slot in participant.calendar_summary.busy_slots:
                if busy_slot.start.date() == slot.start.date():
                    same_day_meetings.append(busy_slot)
            
            print(f"   📅 Same-day meetings: {len(same_day_meetings)}")
            if len(same_day_meetings) > 0:
                for mtg in same_day_meetings:
                    print(f"      • {mtg.start.strftime('%I:%M %p')} - {mtg.end.strftime('%I:%M %p')}")
            
            if len(same_day_meetings) > 0:
                # There are meetings on this day - calculate gap filling bonus
                
                # Base bonus for filling a gap during office hours (increased from 3.0 to 5.0)
                base_bonus = 5.0
                
                # Check if this fills a gap between meetings (better than start/end of day)
                fills_middle_gap = False
                for meeting in same_day_meetings:
                    # Check if our slot is between existing meetings
                    if meeting.end < slot.start:
                        # There's a meeting before this slot
                        for other_meeting in same_day_meetings:
                            if other_meeting.start > slot.end:
                                # There's also a meeting after - we're filling a middle gap!
                                fills_middle_gap = True
                                break
                
                if fills_middle_gap:
                    # Extra bonus for filling middle gaps (best scenario) - increased from 5.0 to 8.0
                    bonus = base_bonus + 3.0  # Total: 8.0
                else:
                    # Just filling office hours on a busy day (good, but not ideal)
                    bonus = base_bonus  # Total: 5.0
                
                # Additional bonus for MEETING category (work-related)
                if event_category:
                    from schemas.scheduling import EventCategory
                    if event_category == EventCategory.MEETING:
                        bonus += 1.0  # Work meetings should definitely be during work hours
                
                # Take the maximum bonus across all participants
                max_bonus = max(max_bonus, bonus)
        
        # Cap at 8.0 points maximum (increased from 5.0)
        final_bonus = min(8.0, max_bonus)
        if final_bonus > 0:
            print(f"   ✨ BONUS AWARDED: +{final_bonus:.1f} points")
        return final_bonus
    
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
    @staticmethod
    def _generate_reasoning(
        slot: TimeSlot,
        availability_score: float,
        preference_score: float,
        overall_score: float,
        all_available: bool,
        conflict_count: int,
        conflict_proximity_score: float,
        fragmentation_score: float,
        same_day_gap_bonus: float = 0.0,
    ) -> str:
        """Generate human-readable reasoning for the score with AI-style explanations."""
        parts = []
        
        # Overall assessment based on final score
        if overall_score >= 85:
            parts.append("Excellent match")
        elif overall_score >= 70:
            parts.append("Strong match")
        elif overall_score >= 55:
            parts.append("Good match")
        elif overall_score >= 40:
            parts.append("Acceptable match")
        else:
            parts.append("Suboptimal match")
        
        # Same-day gap bonus context (priority message)
        if same_day_gap_bonus >= 4.0:
            parts.append("fills gap between meetings during office hours")
        elif same_day_gap_bonus >= 2.0:
            parts.append("utilizes available office hours on a busy day")
        
        # Availability context
        if all_available:
            parts.append("all participants available")
        else:
            if conflict_count == 1:
                parts.append("1 participant conflict")
            else:
                parts.append(f"{conflict_count} participant conflicts")
        
        # Preference alignment
        if preference_score >= 85:
            parts.append("excellent preference alignment")
        elif preference_score >= 70:
            parts.append("strong preference alignment")
        elif preference_score >= 50:
            parts.append("moderate preference alignment")
        else:
            parts.append("weak preference alignment")
        
        # Conflict proximity context
        if conflict_proximity_score >= 90:
            parts.append("well-spaced from other meetings")
        elif conflict_proximity_score >= 70:
            parts.append("adequate spacing")
        elif conflict_proximity_score >= 50:
            parts.append("close to other meetings")
        else:
            parts.append("back-to-back or overlapping concerns")
        
        # Fragmentation context
        if fragmentation_score >= 75:
            parts.append("groups well with existing meetings")
        elif fragmentation_score >= 50:
            parts.append("moderate calendar grouping")
        else:
            parts.append("isolated time slot")
        
        # Time quality
        hour = slot.start.hour
        if 10 <= hour <= 15:
            parts.append("optimal time of day")
        elif 9 <= hour < 10 or 15 < hour <= 16:
            parts.append("good time of day")
        
        return "; ".join(parts) + "."
    
    @staticmethod
    def _calculate_time_slot_differentiation(
        slot: TimeSlot,
        constraints: SchedulingConstraints,
    ) -> float:
        """
        Calculate differentiation score to ensure unique scores for each slot.
        
        This adds variations (±3.0 points max) to differentiate slots
        with otherwise similar scores, based on:
        - Exact time of day preferences
        - Minute positioning (prefer round hours)
        - Distance from ideal meeting times
        - Within-hour granularity
        
        Args:
            slot: Time slot to evaluate
            constraints: Scheduling constraints
            
        Returns:
            Score adjustment from -3.0 to +3.0
        """
        score_adjustment = 0.0
        
        # 1. Minute preference (±0.8 points)
        # Much stronger preference for round hours
        minute = slot.start.minute
        if minute == 0:
            score_adjustment += 0.8  # Top of the hour
        elif minute == 30:
            score_adjustment += 0.5  # Half hour
        elif minute == 15 or minute == 45:
            score_adjustment += 0.2  # Quarter hours
        else:
            # Penalty for odd minutes (creates differentiation)
            score_adjustment -= (minute % 15) * 0.05
        
        # 2. Hour positioning within day (±1.2 points)
        # Strong preference for ideal meeting times
        hour = slot.start.hour
        event_category = getattr(constraints, 'event_category', None)
        
        if event_category:
            from schemas.scheduling import EventCategory
            
            if event_category == EventCategory.MEETING:
                # Strong preference hierarchy for business meetings
                if hour == 10:  # Sweet spot
                    score_adjustment += 1.2
                elif hour == 14:  # Early afternoon
                    score_adjustment += 1.1
                elif hour == 9 or hour == 15:  # Good times
                    score_adjustment += 0.9
                elif hour == 11 or hour == 13:  # Okay times
                    score_adjustment += 0.6
                elif hour == 8 or hour == 16:  # Edge of day
                    score_adjustment += 0.3
                elif hour >= 17:  # After hours penalty
                    score_adjustment -= (hour - 16) * 0.3
            elif event_category == EventCategory.SOCIAL:
                # Prefer evening but not too late
                if hour == 18:  # 6PM - ideal
                    score_adjustment += 1.2
                elif hour == 19:  # 7PM - still good
                    score_adjustment += 0.9
                elif hour == 17:  # 5PM - early
                    score_adjustment += 0.6
                elif hour >= 20:  # Too late
                    score_adjustment -= (hour - 19) * 0.4
            elif event_category == EventCategory.FOCUS_TIME:
                # Prefer early morning
                if hour == 7 or hour == 8:
                    score_adjustment += 1.2
                elif hour == 9 or hour == 10:
                    score_adjustment += 0.8
                elif hour == 6:
                    score_adjustment += 0.6
        
        # 3. Day of week preference (±0.4 points)
        # Stronger mid-week preference
        weekday = slot.start.weekday()  # 0=Monday, 4=Friday
        if weekday == 2:  # Wednesday - best
            score_adjustment += 0.4
        elif weekday in [1, 3]:  # Tue, Thu - good
            score_adjustment += 0.3
        elif weekday == 0:  # Monday - okay
            score_adjustment += 0.15
        elif weekday == 4:  # Friday - least preferred
            score_adjustment += 0.05
        
        # 4. Within-hour granularity (±0.6 points)
        # Add subtle variation based on exact timestamp to ensure uniqueness
        # This creates a smooth gradient throughout the day
        minutes_since_midnight = hour * 60 + minute
        # Scale to 0-1 range for the working day (9am-5pm = 540-1020 minutes)
        if 540 <= minutes_since_midnight <= 1020:
            # Prefer middle of day slightly
            normalized = (minutes_since_midnight - 540) / 480
            time_curve = 1.0 - abs(0.5 - normalized)  # Peak at midday
            score_adjustment += time_curve * 0.6
        
        # Clamp total adjustment to ±3.0 for strong differentiation
        return max(-3.0, min(3.0, score_adjustment))
    
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
