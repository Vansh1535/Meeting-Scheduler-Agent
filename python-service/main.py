"""FastAPI application for AI scheduling service."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import time
from datetime import datetime

from schemas.scheduling import ScheduleRequest, ScheduleResponse, MeetingSlotCandidate
from agents.availability_agent import AvailabilityAgent
from agents.preference_agent import PreferenceAgent
from agents.optimization_agent import OptimizationAgent
from agents.negotiation_agent import NegotiationAgent
from services import scaledown_service


# Initialize FastAPI app
app = FastAPI(
    title="AI Meeting Scheduler - Brain Service",
    description="Stateless AI agent service for intelligent meeting scheduling",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> Dict[str, str]:
    """Health check endpoint."""
    return {
        "service": "AI Meeting Scheduler Brain",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Detailed health check."""
    return {
        "status": "healthy",
        "agents": {
            "availability": "active",
            "preference": "active",
            "optimization": "active",
            "negotiation": "active",
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/schedule", response_model=ScheduleResponse)
async def schedule_meeting(request: ScheduleRequest) -> ScheduleResponse:
    """
    Main scheduling endpoint that orchestrates all AI agents.
    
    This endpoint:
    1. Finds available time slots (Availability Agent)
    2. Scores slots by preferences (Preference Agent)
    3. Ranks and optimizes candidates (Optimization Agent)
    4. Negotiates conflicts if needed (Negotiation Agent)
    5. Returns ranked meeting slot candidates
    
    Args:
        request: Scheduling request with participants and constraints
        
    Returns:
        Scheduling response with ranked candidates and analytics
    """
    start_time = time.time()
    
    try:
        # DEBUG: Log incoming request details
        print("\n" + "="*80)
        print(f"📥 SCHEDULING REQUEST RECEIVED: {request.meeting_id}")
        print("="*80)
        print(f"Participants: {len(request.participants)}")
        print(f"Duration: {request.constraints.duration_minutes} minutes")
        print(f"Office hours: {request.constraints.working_hours_start}:00 - {request.constraints.working_hours_end}:00")
        print(f"Event category: {getattr(request.constraints, 'event_category', 'NOT SET')}")
        print(f"Date range: {request.constraints.earliest_date.strftime('%Y-%m-%d')} to {request.constraints.latest_date.strftime('%Y-%m-%d')}")
        for i, p in enumerate(request.participants, 1):
            print(f"\nParticipant {i}: {p.name}")
            print(f"  Busy slots: {len(p.calendar_summary.busy_slots)}")
            if len(p.calendar_summary.busy_slots) > 0:
                print(f"  Sample busy times:")
                for slot in p.calendar_summary.busy_slots[:3]:
                    print(f"    • {slot.start.strftime('%a %b %d, %I:%M %p')} - {slot.end.strftime('%I:%M %p')}")
        print("="*80 + "\n")
        
        # Validate request
        if len(request.participants) < 1:
            raise HTTPException(
                status_code=400,
                detail="At least 1 participant required"
            )
        
        # Step 1: Find available time slots
        available_slots = AvailabilityAgent.find_available_slots(
            participants=request.participants,
            constraints=request.constraints,
        )
        
        if not available_slots:
            # No slots available - return empty response
            processing_time = (time.time() - start_time) * 1000
            
            return ScheduleResponse(
                meeting_id=request.meeting_id,
                candidates=[],
                total_candidates_evaluated=0,
                processing_time_ms=round(processing_time, 2),
                negotiation_rounds=0,
                analytics={
                    "message": "No available time slots found within constraints",
                    "participants_count": len(request.participants),
                },
                success=False,
                message="No available time slots found. Try relaxing constraints.",
            )
        
        # Step 2 & 3: Rank candidates using Optimization Agent
        # (Preference scoring is done internally by Optimization Agent)
        ranked_candidates = OptimizationAgent.rank_candidates(
            available_slots=available_slots,
            participants=request.participants,
            constraints=request.constraints,
        )
        
        # Step 4: Negotiate conflicts if needed
        negotiated_candidates, negotiation_rounds = NegotiationAgent.negotiate_schedule(
            candidates=ranked_candidates,
            participants=request.participants,
            constraints=request.constraints,
        )
        
        # Calculate analytics
        time_savings = OptimizationAgent.calculate_time_savings_analytics(
            candidates=negotiated_candidates,
            participant_count=len(request.participants),
        )
        
        conflict_analysis = NegotiationAgent.analyze_conflicts(
            candidates=negotiated_candidates,
            participants=request.participants,
        )
        
        group_preferences = PreferenceAgent.analyze_group_preferences(
            participants=request.participants,
        )
        
        # Combine analytics
        analytics = {
            **time_savings,
            **conflict_analysis,
            "group_preferences": group_preferences,
            "total_slots_evaluated": len(available_slots),
            "participants_count": len(request.participants),
            "required_participants": sum(
                1 for p in request.participants if p.is_required
            ),
            "optional_participants": sum(
                1 for p in request.participants if not p.is_required
            ),
        }
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000
        
        # Determine success
        success = len(negotiated_candidates) > 0
        message = (
            f"Found {len(negotiated_candidates)} optimal meeting slots"
            if success
            else "No suitable meeting times found"
        )
        
        # Build response
        response = ScheduleResponse(
            meeting_id=request.meeting_id,
            candidates=negotiated_candidates,
            total_candidates_evaluated=len(available_slots),
            processing_time_ms=round(processing_time, 2),
            negotiation_rounds=negotiation_rounds,
            analytics=analytics,
            success=success,
            message=message,
        )
        
        return response
        
    except Exception as e:
        # Log error (in production, use proper logging)
        processing_time = (time.time() - start_time) * 1000
        
        import traceback
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail=f"Internal scheduling error: {str(e)}"
        )


@app.get("/agents")
async def list_agents() -> Dict[str, Any]:
    """
    List all available agents and their capabilities.
    
    Returns:
        Dictionary describing each agent
    """
    return {
        "agents": [
            {
                "name": "Availability Agent",
                "description": "Computes free/busy slots with buffer and timezone handling",
                "capabilities": [
                    "Find available time slots",
                    "Handle timezone conversions",
                    "Apply buffer times",
                    "Respect working hours",
                ],
            },
            {
                "name": "Preference Agent",
                "description": "Learns and applies user preferences from historical behavior",
                "capabilities": [
                    "Analyze preference patterns",
                    "Score slots by preferred times",
                    "Consider morning/night preferences",
                    "Evaluate buffer preferences",
                ],
            },
            {
                "name": "Optimization Agent",
                "description": "Ranks candidate slots using constraints and scoring",
                "capabilities": [
                    "Combine availability and preference scores",
                    "Apply optimization criteria",
                    "Rank candidates",
                    "Generate score explanations",
                ],
            },
            {
                "name": "Negotiation Agent",
                "description": "Resolves conflicts for multi-party meetings",
                "capabilities": [
                    "Handle scheduling conflicts",
                    "Prioritize required participants",
                    "Suggest compromises",
                    "Provide alternatives",
                ],
            },
        ],
        "orchestration": "All agents are orchestrated through the /schedule endpoint",
    }


@app.get("/scaledown/stats")
async def scaledown_stats() -> Dict[str, Any]:
    """
    Get ScaleDown LLM compression statistics.
    
    ScaleDown compresses prompts and context to reduce token usage:
    - Meeting descriptions and context windows
    - Agent reasoning chains
    - Large availability summaries
    
    Achieves 60-80% token reduction while preserving semantic accuracy.
    """
    return scaledown_service.get_compression_stats()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload during development
    )
