"""Availability Agent: Computes free/busy slots with buffer and timezone handling."""

from typing import List, Set, Tuple
from datetime import datetime, timedelta, timezone
from schemas.scheduling import (
    Participant,
    TimeSlot,
    SchedulingConstraints,
    DayOfWeek,
    EventCategory,
)


class AvailabilityAgent:
    """
    Stateless agent that computes available time slots for participants.
    
    Responsibilities:
    - Find free time slots across all participants
    - Handle timezone conversions
    - Apply buffer times between meetings
    - Respect working hours and allowed days
    """
    
    @staticmethod
    def find_available_slots(
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> List[TimeSlot]:
        """
        Find all available time slots that work for all required participants.
        
        Args:
            participants: List of meeting participants with calendar summaries
            constraints: Scheduling constraints (duration, working hours, etc.)
            
        Returns:
            List of available time slots
        """
        # Generate all possible time slots within constraints
        candidate_slots = AvailabilityAgent._generate_candidate_slots(constraints)
        
        # Filter slots based on participant availability
        available_slots = []
        for slot in candidate_slots:
            if AvailabilityAgent._is_slot_available_for_all(
                slot, participants, constraints
            ):
                available_slots.append(slot)
        
        return available_slots
    
    @staticmethod
    def _generate_candidate_slots(
        constraints: SchedulingConstraints,
    ) -> List[TimeSlot]:
        """
        Generate intelligent time slots based on event category, weekday/weekend.
        
        This method generates slots:
        1. During office hours gaps (not just after hours)
        2. With different time windows for weekdays vs weekends
        3. Based on event category preferences
        
        Args:
            constraints: Scheduling constraints
            
        Returns:
            List of candidate time slots
        """
        slots = []
        # Ensure datetime is timezone-aware
        current_date = constraints.earliest_date
        if current_date.tzinfo is None:
            current_date = current_date.replace(tzinfo=timezone.utc)
        
        duration = timedelta(minutes=constraints.duration_minutes)
        
        # Map DayOfWeek enum to Python weekday integers (0=Monday, 6=Sunday)
        allowed_weekdays = {
            DayOfWeek.MONDAY: 0,
            DayOfWeek.TUESDAY: 1,
            DayOfWeek.WEDNESDAY: 2,
            DayOfWeek.THURSDAY: 3,
            DayOfWeek.FRIDAY: 4,
            DayOfWeek.SATURDAY: 5,
            DayOfWeek.SUNDAY: 6,
        }
        allowed_weekday_nums = {
            allowed_weekdays[day] for day in constraints.allowed_days
        }
        
        # Ensure latest_date is also timezone-aware
        latest_date = constraints.latest_date
        if latest_date.tzinfo is None:
            latest_date = latest_date.replace(tzinfo=timezone.utc)
        
        # Build set of holiday date strings for fast lookup
        holiday_date_set = set(getattr(constraints, 'holiday_dates', []))
        
        # Get event category
        event_category = getattr(constraints, 'event_category', EventCategory.MEETING)
        
        # Generate slots day by day
        while current_date <= latest_date:
            # Check if this day is allowed
            if current_date.weekday() not in allowed_weekday_nums:
                current_date += timedelta(days=1)
                continue
            
            # Skip holidays
            if current_date.strftime('%Y-%m-%d') in holiday_date_set:
                current_date += timedelta(days=1)
                continue
            
            # Determine if weekend
            is_weekend = current_date.weekday() in [5, 6]  # Saturday, Sunday
            
            # Get time windows based on category and day type
            time_windows = AvailabilityAgent._get_time_windows_for_category(
                event_category, is_weekend, constraints
            )
            
            # Generate slots for each time window
            for window_start, window_end in time_windows:
                day_start = current_date.replace(
                    hour=window_start,
                    minute=0,
                    second=0,
                    microsecond=0,
                )
                day_end = current_date.replace(
                    hour=window_end,
                    minute=0,
                    second=0,
                    microsecond=0,
                )
                
                # Generate slots in 30-minute increments
                slot_start = day_start
                while slot_start + duration <= day_end:
                    slot_end = slot_start + duration
                    
                    # Create timezone-aware copies for the slot
                    slot_start_aware = slot_start if slot_start.tzinfo else slot_start.replace(tzinfo=timezone.utc)
                    slot_end_aware = slot_end if slot_end.tzinfo else slot_end.replace(tzinfo=timezone.utc)
                    
                    slots.append(
                        TimeSlot(
                            start=slot_start_aware,
                            end=slot_end_aware,
                            timezone=constraints.timezone,
                        )
                    )
                    slot_start += timedelta(minutes=30)  # 30-minute increments
            
            current_date += timedelta(days=1)
        
        return slots
    
    @staticmethod
    def _get_time_windows_for_category(
        category: EventCategory,
        is_weekend: bool,
        constraints: SchedulingConstraints,
    ) -> List[Tuple[int, int]]:
        """
        Get appropriate time windows based on event category and day type.
        
        Returns list of (start_hour, end_hour) tuples representing time windows.
        Multiple windows allow for gaps (e.g., morning and afternoon sessions).
        
        Args:
            category: Event category
            is_weekend: Whether it's a weekend
            constraints: Scheduling constraints for working hours
            
        Returns:
            List of (start_hour, end_hour) tuples (hours are 0-23)
        """
        office_start = constraints.working_hours_start
        office_end = constraints.working_hours_end
        
        # Helper to ensure hours are within valid range
        def clamp_hour(hour: int) -> int:
            return max(0, min(23, hour))
        
        if is_weekend:
            # Weekends - more flexible timing
            if category == EventCategory.MEETING:
                # Business meetings less common on weekends, but if needed: mid-day
                return [(10, 16)]
            elif category == EventCategory.PERSONAL:
                # Personal events can be anytime
                return [(8, 12), (14, 20)]
            elif category == EventCategory.WORK:
                # Work tasks - flexible weekend hours
                return [(9, 13), (15, 19)]
            elif category == EventCategory.SOCIAL:
                # Social events - afternoon to evening
                return [(12, 22)]
            elif category == EventCategory.HEALTH:
                # Health appointments - morning to early afternoon
                return [(8, 16)]
            elif category == EventCategory.FOCUS_TIME:
                # Deep work - morning preferred
                return [(8, 12), (14, 18)]
            elif category == EventCategory.BREAK:
                # Breaks - anytime
                return [(10, 20)]
            else:
                # Default weekend hours
                return [(9, 18)]
        else:
            # Weekdays - category-specific logic
            if category == EventCategory.MEETING:
                # Business meetings - prioritize office hours + small buffer
                # Include early morning and late afternoon for flexibility
                start = clamp_hour(office_start - 1)
                end = clamp_hour(office_end + 2)
                return [(start, end)]
            elif category == EventCategory.PERSONAL:
                # Personal events - before/after work + lunch
                windows = []
                # Early morning
                if office_start > 7:
                    windows.append((7, office_start))
                # Lunch
                windows.append((12, 14))
                # After work
                windows.append((office_end, 21))
                return windows
            elif category == EventCategory.WORK:
                # Work tasks - extended office hours including early/late work
                start = clamp_hour(office_start - 2)
                end = clamp_hour(office_end + 3)
                return [(start, end)]
            elif category == EventCategory.SOCIAL:
                # Social events - lunch and after work
                return [(12, 14), (office_end, 22)]
            elif category == EventCategory.HEALTH:
                # Health appointments - office hours (people take time off)
                return [(8, office_end)]
            elif category == EventCategory.FOCUS_TIME:
                # Deep work - early morning or late morning, avoid mid-day
                return [(7, 11), (14, 17)]
            elif category == EventCategory.BREAK:
                # Breaks - mid-morning, lunch, mid-afternoon
                return [(10, 12), (12, 14), (15, 17)]
            else:
                # Default to standard office hours
                return [(office_start, office_end)]
    
    @staticmethod
    def _is_slot_available_for_all(
        slot: TimeSlot,
        participants: List[Participant],
        constraints: SchedulingConstraints,
    ) -> bool:
        """
        Check if a time slot is available for all required participants.
        
        Args:
            slot: Time slot to check
            participants: List of participants
            constraints: Scheduling constraints
            
        Returns:
            True if slot is available for all required participants
        """
        buffer = timedelta(minutes=constraints.buffer_minutes)
        
        for participant in participants:
            if not participant.is_required:
                continue  # Optional participants don't block slots
            
            # Check against participant's busy slots
            for busy_slot in participant.calendar_summary.busy_slots:
                # Add buffer to busy slot
                busy_start = busy_slot.start - buffer
                busy_end = busy_slot.end + buffer
                
                # Check for overlap
                if AvailabilityAgent._slots_overlap(
                    slot.start, slot.end,
                    busy_start, busy_end
                ):
                    return False
        
        return True
    
    @staticmethod
    def _slots_overlap(
        start1: datetime,
        end1: datetime,
        start2: datetime,
        end2: datetime,
    ) -> bool:
        """
        Check if two time ranges overlap.
        
        Args:
            start1: Start of first range
            end1: End of first range
            start2: Start of second range
            end2: End of second range
            
        Returns:
            True if ranges overlap
        """
        return start1 < end2 and end1 > start2
    
    @staticmethod
    def get_participant_availability_score(
        slot: TimeSlot,
        participant: Participant,
        constraints: SchedulingConstraints,
    ) -> float:
        """
        Calculate availability score for a specific participant and slot.
        
        Args:
            slot: Time slot to evaluate
            participant: Participant to check
            constraints: Scheduling constraints
            
        Returns:
            Score from 0-100 (100 = completely free, 0 = busy)
        """
        buffer = timedelta(minutes=constraints.buffer_minutes)
        
        # Check for exact conflicts
        for busy_slot in participant.calendar_summary.busy_slots:
            if AvailabilityAgent._slots_overlap(
                slot.start, slot.end,
                busy_slot.start, busy_slot.end
            ):
                return 0.0  # Hard conflict
        
        # Check proximity to busy slots (soft penalty)
        min_gap_before = float('inf')
        min_gap_after = float('inf')
        
        for busy_slot in participant.calendar_summary.busy_slots:
            # Gap before
            gap_before = (slot.start - busy_slot.end).total_seconds() / 60
            if 0 <= gap_before < min_gap_before:
                min_gap_before = gap_before
            
            # Gap after
            gap_after = (busy_slot.start - slot.end).total_seconds() / 60
            if 0 <= gap_after < min_gap_after:
                min_gap_after = gap_after
        
        # Score based on buffer availability
        score = 100.0
        
        # Penalize if too close to other meetings
        if min_gap_before < constraints.buffer_minutes:
            penalty = (1.0 - min_gap_before / constraints.buffer_minutes) * 20
            score -= penalty
        
        if min_gap_after < constraints.buffer_minutes:
            penalty = (1.0 - min_gap_after / constraints.buffer_minutes) * 20
            score -= penalty
        
        return max(0.0, min(100.0, score))
