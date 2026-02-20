"""Preference Agent: Learns and applies user preferences from historical behavior."""

from typing import List, Dict, Any, Optional
from datetime import datetime
from schemas.scheduling import (
    Participant,
    TimeSlot,
    PreferencePattern,
    DayOfWeek,
    EventCategory,
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
        event_category: Optional[EventCategory] = None,
    ) -> Dict[str, float]:
        """
        Score a time slot based on all participants' preferences and event category.
        
        Args:
            slot: Time slot to score
            participants: List of participants with preference patterns
            event_category: Optional event category for category-aware scoring
            
        Returns:
            Dictionary mapping participant user_id to preference score (0-100)
        """
        scores = {}
        
        for participant in participants:
            preference_pattern = participant.calendar_summary.preference_patterns
            
            if preference_pattern is None:
                # No preference data, use category-based baseline
                scores[participant.user_id] = PreferenceAgent._score_category_fit(
                    slot, event_category
                ) if event_category else 50.0
            else:
                score = PreferenceAgent._calculate_preference_score(
                    slot, preference_pattern, event_category
                )
                scores[participant.user_id] = score
        
        return scores
    
    @staticmethod
    def _calculate_preference_score(
        slot: TimeSlot,
        pattern: PreferencePattern,
        event_category: Optional[EventCategory] = None,
    ) -> float:
        """
        Calculate preference score for a single participant.
        
        Args:
            slot: Time slot to evaluate
            pattern: Learned preference pattern
            event_category: Optional event category
            
        Returns:
            Score from 0-100
        """
        score = 100.0
        
        # 1. Day of week preference (25% weight)
        day_score = PreferenceAgent._score_day_preference(slot, pattern)
        score = score * 0.75 + day_score * 0.25
        
        # 2. Time of day preference (30% weight)
        time_score = PreferenceAgent._score_time_preference(slot, pattern)
        score = score * 0.7 + time_score * 0.3
        
        # 3. Morning/evening preference (15% weight)
        morning_score = PreferenceAgent._score_morning_preference(slot, pattern)
        score = score * 0.85 + morning_score * 0.15
        
        # 4. Duration match (10% weight)
        duration_score = PreferenceAgent._score_duration_preference(slot, pattern)
        score = score * 0.9 + duration_score * 0.1
        
        # 5. Category fit (20% weight) - NEW
        if event_category:
            category_score = PreferenceAgent._score_category_fit(slot, event_category)
            score = score * 0.8 + category_score * 0.2
        
        return max(0.0, min(100.0, score))
    
    @staticmethod
    def _score_category_fit(
        slot: TimeSlot,
        category: EventCategory,
    ) -> float:
        """
        Score how well a time slot fits the event category.
        
        This provides intelligent scoring based on typical usage patterns:
        - Meetings: Best during office hours
        - Personal: Good outside office hours
        - Social: Best evenings/weekends
        - Health: Daytime preferred
        - Focus: Morning or dedicated blocks
        
        Args:
            slot: Time slot to evaluate
            category: Event category
            
        Returns:
            Score from 0-100
        """
        hour = slot.start.hour
        minute = slot.start.minute
        is_weekend = slot.start.weekday() in [5, 6]
        
        # Convert to fractional time for precise scoring
        time_decimal = hour + minute / 60.0
        
        if category == EventCategory.MEETING:
            # Business meetings - best during core business hours
            # Add minute-level granularity for differentiation
            if 9 <= hour < 17:
                # Fine-tune within business hours
                # Peak meeting times: 9-11am (100), 2-4pm (98), other times slightly lower
                if 9 <= hour < 11 or 14 <= hour < 16:
                    base_score = 100.0
                elif 11 <= hour < 14:
                    base_score = 97.0  # Lunch proximity
                else:
                    base_score = 98.0
                
                # Add sub-hour variation based on minutes
                minute_factor = PreferenceAgent._get_minute_variation(minute)
                return min(100.0, base_score + minute_factor)
                
            elif 8 <= hour < 9 or 17 <= hour < 18:
                base_score = 80.0
                minute_factor = PreferenceAgent._get_minute_variation(minute) * 0.5
                return base_score + minute_factor
            elif 7 <= hour < 8 or 18 <= hour < 19:
                base_score = 50.0
                minute_factor = PreferenceAgent._get_minute_variation(minute) * 0.3
                return base_score + minute_factor
            else:
                return 20.0 if not is_weekend else 10.0
        
        elif category == EventCategory.PERSONAL:
            # Personal events - prefer outside core work hours
            if is_weekend:
                return 100.0  # Weekends are ideal
            elif hour < 9 or hour >= 17:
                return 90.0  # Before/after work excellent
            elif 12 <= hour < 14:
                return 75.0  # Lunch time good
            else:
                return 40.0  # During work hours less ideal
        
        elif category == EventCategory.WORK:
            # Work tasks - flexible but prefer workday hours
            if 8 <= hour < 18:
                return 100.0
            elif 7 <= hour < 8 or 18 <= hour < 20:
                return 80.0
            else:
                return 50.0 if not is_weekend else 60.0
        
        elif category == EventCategory.SOCIAL:
            # Social events - evenings and weekends
            if is_weekend:
                if 10 <= hour < 22:
                    # Prefer certain times even on weekends
                    if 12 <= hour < 20:
                        base_score = 100.0
                    else:
                        base_score = 95.0
                    minute_factor = PreferenceAgent._get_minute_variation(minute)
                    return min(100.0, base_score + minute_factor)
                else:
                    return 70.0
            elif 18 <= hour < 23:
                # Evening prime time - prefer 6:30-8pm slightly more
                if 18 <= hour < 20:
                    base_score = 98.0
                else:
                    base_score = 93.0
                minute_factor = PreferenceAgent._get_minute_variation(minute)
                return min(100.0, base_score + minute_factor)
            elif 12 <= hour < 14:
                base_score = 70.0
                minute_factor = PreferenceAgent._get_minute_variation(minute) * 0.3
                return base_score + minute_factor
            else:
                return 30.0
        
        elif category == EventCategory.HEALTH:
            # Health appointments - daytime
            if 8 <= hour < 17:
                return 100.0
            elif 7 <= hour < 8:
                return 70.0
            else:
                return 40.0
        
        elif category == EventCategory.FOCUS_TIME:
            # Deep work - early morning best, or dedicated afternoon blocks
            if 7 <= hour < 11:
                return 100.0  # Morning focus time
            elif 14 <= hour < 17:
                return 85.0  # Afternoon block
            elif 11 <= hour < 14:
                return 50.0  # Midday less ideal
            else:
                return 30.0
        
        elif category == EventCategory.BREAK:
            # Breaks - mid-morning, lunch, mid-afternoon
            if hour in [10, 11, 12, 13, 15, 16]:
                return 100.0
            elif 9 <= hour < 17:
                return 70.0
            else:
                return 40.0
        
        # Default neutral score
        return 50.0
    
    @staticmethod
    def _get_minute_variation(minute: int) -> float:
        """
        Get a small score variation based on minutes to differentiate slots.
        
        This creates subtle differences between time slots on the same day:
        - Round hours (00 minutes): +1.5 points
        - Half hours (30 minutes): +1.0 point  
        - Other times: Gradual decrease from nearest round/half hour
        
        Args:
            minute: Minutes component of time (0-59)
            
        Returns:
            Score adjustment from 0.0 to 1.5
        """
        if minute == 0:
            return 1.5  # Top of hour preferred
        elif minute == 30:
            return 1.0  # Half hour second preferred
        elif minute <= 15:
            # Between :00 and :15 - closer to :00 is better
            return 1.5 - (minute / 15.0) * 0.7
        elif minute <= 45:
            # Between :15 and :45 - closest to :30 is better
            distance_from_30 = abs(minute - 30)
            return 1.0 - (distance_from_30 / 15.0) * 0.5
        else:
            # Between :45 and :59 - closer to next hour
            return 0.5 - ((minute - 45) / 15.0) * 0.3
    
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
        """Score based on preferred hours with minute-level precision."""
        slot_hour = slot.start.hour
        slot_minute = slot.start.minute
        
        # Convert to fractional hour for precise scoring
        slot_time = slot_hour + slot_minute / 60.0
        
        # Check if within preferred time window
        if pattern.preferred_hours_start <= slot_hour < pattern.preferred_hours_end:
            # Within preferred window - score based on how centered it is
            window_size = pattern.preferred_hours_end - pattern.preferred_hours_start
            window_center = pattern.preferred_hours_start + window_size / 2
            distance_from_center = abs(slot_time - window_center)
            
            # Score decreases as we move away from center
            max_distance = window_size / 2
            if max_distance > 0:
                center_score = 100.0 - (distance_from_center / max_distance) * 20
            else:
                center_score = 100.0
            
            # Add minute-level variation (0-2 points based on minutes)
            # Prefer round hours (0, 30 minutes) slightly
            if slot_minute == 0:
                minute_bonus = 2.0
            elif slot_minute == 30:
                minute_bonus = 1.0
            else:
                minute_bonus = 0.0
            
            return max(80.0, min(100.0, center_score + minute_bonus))
        else:
            # Outside preferred window - calculate penalty based on distance
            if slot_time < pattern.preferred_hours_start:
                distance = pattern.preferred_hours_start - slot_time
            else:
                distance = slot_time - pattern.preferred_hours_end
            
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
