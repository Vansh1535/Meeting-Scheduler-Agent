"""Pydantic models for scheduling requests and responses."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone as dt_timezone
from enum import Enum


class TimeZone(str, Enum):
    """Common timezones."""
    UTC = "UTC"
    US_EASTERN = "America/New_York"
    US_CENTRAL = "America/Chicago"
    US_MOUNTAIN = "America/Denver"
    US_PACIFIC = "America/Los_Angeles"
    EU_LONDON = "Europe/London"
    EU_PARIS = "Europe/Paris"
    ASIA_TOKYO = "Asia/Tokyo"


class DayOfWeek(str, Enum):
    """Days of the week."""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class TimeSlot(BaseModel):
    """Represents a time slot with start and end times."""
    start: datetime = Field(..., description="Start time in ISO 8601 format")
    end: datetime = Field(..., description="End time in ISO 8601 format")
    timezone: str = Field(default="UTC", description="Timezone identifier")
    
    @field_validator('start', 'end', mode='after')
    @classmethod
    def ensure_timezone_aware(cls, v: datetime) -> datetime:
        """Ensure datetime is timezone-aware."""
        if v.tzinfo is None:
            return v.replace(tzinfo=dt_timezone.utc)
        return v


class PreferencePattern(BaseModel):
    """User preference patterns learned from historical data (compressed)."""
    preferred_days: List[DayOfWeek] = Field(
        default_factory=list,
        description="Days user prefers for meetings"
    )
    preferred_hours_start: int = Field(
        default=9,
        ge=0,
        le=23,
        description="Preferred start hour (24-hour format)"
    )
    preferred_hours_end: int = Field(
        default=17,
        ge=0,
        le=23,
        description="Preferred end hour (24-hour format)"
    )
    avg_meeting_duration_minutes: int = Field(
        default=30,
        description="Average preferred meeting duration"
    )
    buffer_minutes: int = Field(
        default=15,
        description="Preferred buffer between meetings"
    )
    avoids_back_to_back: bool = Field(
        default=True,
        description="Whether user avoids back-to-back meetings"
    )
    morning_person_score: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="0=night owl, 1=morning person"
    )


class CompressedCalendarSummary(BaseModel):
    """Compressed calendar data from ScaleDown AI (statistical summary, not raw events)."""
    user_id: str = Field(..., description="User identifier")
    timezone: str = Field(default="UTC", description="User's primary timezone")
    
    # Busy slots (already compressed by ScaleDown)
    busy_slots: List[TimeSlot] = Field(
        default_factory=list,
        description="Time slots where user is busy"
    )
    
    # Statistical patterns (from ScaleDown compression)
    weekly_meeting_count: int = Field(
        default=0,
        description="Average meetings per week"
    )
    peak_meeting_hours: List[int] = Field(
        default_factory=list,
        description="Hours with most meetings (0-23)"
    )
    preference_patterns: Optional[PreferencePattern] = Field(
        default=None,
        description="Learned preference patterns"
    )
    
    # Metadata
    data_compressed: bool = Field(
        default=True,
        description="Whether data was compressed by ScaleDown"
    )
    compression_period_days: int = Field(
        default=365,
        description="How many days of history were compressed"
    )


class Participant(BaseModel):
    """Meeting participant with their calendar summary."""
    user_id: str = Field(..., description="Unique user identifier")
    email: str = Field(..., description="User email address")
    name: str = Field(..., description="User display name")
    is_required: bool = Field(
        default=True,
        description="Whether participant is required"
    )
    calendar_summary: CompressedCalendarSummary = Field(
        ...,
        description="Compressed calendar data from ScaleDown"
    )


class SchedulingConstraints(BaseModel):
    """Constraints for meeting scheduling."""
    duration_minutes: int = Field(
        ...,
        gt=0,
        description="Meeting duration in minutes"
    )
    earliest_date: datetime = Field(
        ...,
        description="Earliest possible meeting date"
    )
    latest_date: datetime = Field(
        ...,
        description="Latest possible meeting date"
    )
    working_hours_start: int = Field(
        default=9,
        ge=0,
        le=23,
        description="Working hours start (24-hour format)"
    )
    working_hours_end: int = Field(
        default=17,
        ge=0,
        le=23,
        description="Working hours end (24-hour format)"
    )
    allowed_days: List[DayOfWeek] = Field(
        default_factory=lambda: [
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY,
        ],
        description="Allowed days of week"
    )
    buffer_minutes: int = Field(
        default=15,
        ge=0,
        description="Buffer time between meetings"
    )
    timezone: str = Field(
        default="UTC",
        description="Timezone for scheduling"
    )
    max_candidates: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of candidate slots to return"
    )
    
    @field_validator('earliest_date', 'latest_date', mode='after')
    @classmethod
    def ensure_timezone_aware(cls, v: datetime) -> datetime:
        """Ensure datetime is timezone-aware."""
        if v.tzinfo is None:
            return v.replace(tzinfo=dt_timezone.utc)
        return v


class ScheduleRequest(BaseModel):
    """Request to find optimal meeting times."""
    meeting_id: str = Field(..., description="Unique meeting identifier")
    participants: List[Participant] = Field(
        ...,
        min_length=2,
        description="List of meeting participants"
    )
    constraints: SchedulingConstraints = Field(
        ...,
        description="Scheduling constraints"
    )
    preferences: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional preferences"
    )


class MeetingSlotCandidate(BaseModel):
    """A candidate meeting time slot with scoring."""
    slot: TimeSlot = Field(..., description="The proposed time slot")
    score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Overall score (0-100)"
    )
    
    # Scoring breakdown
    availability_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="How well it fits availability"
    )
    preference_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="How well it matches preferences"
    )
    optimization_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Overall optimization quality"
    )
    
    # Metadata
    conflicts: List[str] = Field(
        default_factory=list,
        description="List of participant IDs with conflicts"
    )
    all_participants_available: bool = Field(
        ...,
        description="Whether all required participants are available"
    )
    reasoning: str = Field(
        default="",
        description="Human-readable explanation of the score"
    )


class ScheduleResponse(BaseModel):
    """Response containing ranked meeting slot candidates."""
    meeting_id: str = Field(..., description="Meeting identifier from request")
    candidates: List[MeetingSlotCandidate] = Field(
        ...,
        description="Ranked list of candidate time slots"
    )
    
    # Metadata
    total_candidates_evaluated: int = Field(
        ...,
        description="Total number of slots evaluated"
    )
    processing_time_ms: float = Field(
        ...,
        description="Processing time in milliseconds"
    )
    negotiation_rounds: int = Field(
        default=0,
        description="Number of negotiation rounds performed"
    )
    
    # Analytics
    analytics: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional analytics and insights"
    )
    
    success: bool = Field(..., description="Whether scheduling was successful")
    message: str = Field(
        default="",
        description="Status message or error description"
    )
