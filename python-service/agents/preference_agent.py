"""Preference Agent: Learns and applies user preferences from historical behavior."""

from typing import List, Dict, Any
from datetime import datetime
from schemas.scheduling import (
    Participant,
    TimeSlot,
    PreferencePattern,
    DayOfWeek,
)


class PreferenceAgent:
    """
    Stateless agent that scores time slots based on learned user preferences.
    
    Responsibilities:
    - Analyze preference patterns from compressed calendar data
    - Score slots based on preferred times, days, and patterns
    - Consider morning/night person preferences
    - Evaluate buffer preferences
    """
    
    @staticmethod
    def score_slot_preferences(
        slot: TimeSlot,
        participants: List[Participant],
    ) -> Dict[str, float]:
        """
        Score a time slot based on all participants' preferences.
        
        Args:
            slot: Time slot to score
            participants: List of participants with preference patterns
            
        Returns:
            Dictionary mapping participant user_id to preference score (0-100)
        """
        scores = {}
        
        for participant in participants:
            preference_pattern = participant.calendar_summary.preference_patterns
            
            if preference_pattern is None:
                # No preference data, use neutral score
                scores[participant.user_id] = 50.0
            else:
                score = PreferenceAgent._calculate_preference_score(
                    slot, preference_pattern
                )
                scores[participant.user_id] = score
        
        return scores
    
    @staticmethod
    def _calculate_preference_score(
        slot: TimeSlot,
        pattern: PreferencePattern,
    ) -> float:
        """
        Calculate preference score for a single participant.
        
        Args:
            slot: Time slot to evaluate
            pattern: Learned preference pattern
            
        Returns:
            Score from 0-100
        """
        score = 100.0
        
        # 1. Day of week preference (30% weight)
        day_score = PreferenceAgent._score_day_preference(slot, pattern)
        score = score * 0.7 + day_score * 0.3
        
        # 2. Time of day preference (40% weight)
        time_score = PreferenceAgent._score_time_preference(slot, pattern)
        score = score * 0.6 + time_score * 0.4
        
        # 3. Morning/evening preference (20% weight)
        morning_score = PreferenceAgent._score_morning_preference(slot, pattern)
        score = score * 0.8 + morning_score * 0.2
        
        # 4. Duration match (10% weight)
        duration_score = PreferenceAgent._score_duration_preference(slot, pattern)
        score = score * 0.9 + duration_score * 0.1
        
        return max(0.0, min(100.0, score))
    
    @staticmethod
    def _score_day_preference(
        slot: TimeSlot,
        pattern: PreferencePattern,
    ) -> float:
        """Score based on preferred days of week."""
        if not pattern.preferred_days:
            return 50.0  # Neutral if no preference
        
        # Map slot's weekday to DayOfWeek enum
        weekday_map = {
            0: DayOfWeek.MONDAY,
            1: DayOfWeek.TUESDAY,
            2: DayOfWeek.WEDNESDAY,
            3: DayOfWeek.THURSDAY,
            4: DayOfWeek.FRIDAY,
            5: DayOfWeek.SATURDAY,
            6: DayOfWeek.SUNDAY,
        }
        
        slot_day = weekday_map[slot.start.weekday()]
        
        if slot_day in pattern.preferred_days:
            return 100.0
        else:
            # Penalize non-preferred days
            return 30.0
    
    @staticmethod
    def _score_time_preference(
        slot: TimeSlot,
        pattern: PreferencePattern,
    ) -> float:
        """Score based on preferred hours."""
        slot_hour = slot.start.hour
        
        # Check if within preferred time window
        if pattern.preferred_hours_start <= slot_hour < pattern.preferred_hours_end:
            # Within preferred window - score based on how centered it is
            window_size = pattern.preferred_hours_end - pattern.preferred_hours_start
            window_center = pattern.preferred_hours_start + window_size / 2
            distance_from_center = abs(slot_hour - window_center)
            
            # Score decreases as we move away from center
            max_distance = window_size / 2
            if max_distance > 0:
                center_score = 100.0 - (distance_from_center / max_distance) * 20
            else:
                center_score = 100.0
            
            return max(80.0, center_score)
        else:
            # Outside preferred window - calculate penalty based on distance
            if slot_hour < pattern.preferred_hours_start:
                distance = pattern.preferred_hours_start - slot_hour
            else:
                distance = slot_hour - pattern.preferred_hours_end
            
            # Penalize based on distance (max penalty at 4+ hours away)
            penalty = min(distance * 15, 60)
            return max(10.0, 50.0 - penalty)
    
    @staticmethod
    def _score_morning_preference(
        slot: TimeSlot,
        pattern: PreferencePattern,
    ) -> float:
        """Score based on morning person vs night owl tendency."""
        slot_hour = slot.start.hour
        
        # Define morning (6-11) and afternoon/evening (14-18)
        is_morning = 6 <= slot_hour < 12
        is_afternoon = 14 <= slot_hour < 19
        
        if is_morning:
            # Morning slots favored by morning people
            return pattern.morning_person_score * 100
        elif is_afternoon:
            # Afternoon slots favored by night owls
            return (1.0 - pattern.morning_person_score) * 100
        else:
            # Midday or very early/late - neutral
            return 50.0
    
    @staticmethod
    def _score_duration_preference(
        slot: TimeSlot,
        pattern: PreferencePattern,
    ) -> float:
        """Score based on typical meeting duration preference."""
        slot_duration = (slot.end - slot.start).total_seconds() / 60
        preferred_duration = pattern.avg_meeting_duration_minutes
        
        # Calculate how far off from preferred duration
        duration_diff = abs(slot_duration - preferred_duration)
        
        # Small differences are fine, large differences penalized
        if duration_diff <= 15:
            return 100.0
        elif duration_diff <= 30:
            return 80.0
        elif duration_diff <= 60:
            return 60.0
        else:
            return 40.0
    
    @staticmethod
    def aggregate_preference_scores(
        participant_scores: Dict[str, float],
        participants: List[Participant],
    ) -> float:
        """
        Aggregate individual preference scores into overall score.
        
        Args:
            participant_scores: Mapping of user_id to preference score
            participants: List of participants
            
        Returns:
            Aggregated score (0-100)
        """
        if not participant_scores:
            return 50.0
        
        # Weight required participants more heavily
        weighted_sum = 0.0
        total_weight = 0.0
        
        for participant in participants:
            score = participant_scores.get(participant.user_id, 50.0)
            weight = 1.0 if participant.is_required else 0.5
            
            weighted_sum += score * weight
            total_weight += weight
        
        if total_weight == 0:
            return 50.0
        
        return weighted_sum / total_weight
    
    @staticmethod
    def analyze_group_preferences(
        participants: List[Participant],
    ) -> Dict[str, Any]:
        """
        Analyze overall group preferences for analytics.
        
        Args:
            participants: List of participants
            
        Returns:
            Dictionary with group preference insights
        """
        total_participants = len(participants)
        if total_participants == 0:
            return {}
        
        # Aggregate stats
        morning_people = 0
        avg_preferred_start = 0
        avg_preferred_end = 0
        buffer_sensitive_count = 0
        
        for participant in participants:
            pattern = participant.calendar_summary.preference_patterns
            if pattern:
                if pattern.morning_person_score > 0.6:
                    morning_people += 1
                avg_preferred_start += pattern.preferred_hours_start
                avg_preferred_end += pattern.preferred_hours_end
                if pattern.avoids_back_to_back:
                    buffer_sensitive_count += 1
        
        return {
            "total_participants": total_participants,
            "morning_people_ratio": morning_people / total_participants,
            "avg_preferred_start_hour": avg_preferred_start / total_participants,
            "avg_preferred_end_hour": avg_preferred_end / total_participants,
            "buffer_sensitive_ratio": buffer_sensitive_count / total_participants,
        }
