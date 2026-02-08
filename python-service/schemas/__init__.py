"""Pydantic schemas for the AI scheduling service."""

from .scheduling import (
    ScheduleRequest,
    ScheduleResponse,
    Participant,
    CompressedCalendarSummary,
    TimeSlot,
    MeetingSlotCandidate,
    SchedulingConstraints,
    PreferencePattern,
)

__all__ = [
    "ScheduleRequest",
    "ScheduleResponse",
    "Participant",
    "CompressedCalendarSummary",
    "TimeSlot",
    "MeetingSlotCandidate",
    "SchedulingConstraints",
    "PreferencePattern",
]
