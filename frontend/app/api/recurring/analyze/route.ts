/**
 * ============================================================================
 * API Route: /api/recurring/analyze
 * Stage 6: Recurring Meeting Optimization
 * ============================================================================
 * Purpose: Analyze recurring meetings and suggest better time slots
 * 
 * Features:
 * - Detect recurring meetings with consistently low scores
 * - Identify better alternative slots using calendar patterns
 * - Suggest optimized recurring times (requires user approval)
 * - Track optimization status in database
 * 
 * Endpoints:
 * - POST /api/recurring/analyze - Analyze recurring patterns and suggest optimizations
 * - GET /api/recurring/analyze - Get pending optimization suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeRecurringMeetings, type RecurringPattern } from '@/lib/schedulingEnforcement';

// ============================================================================
// POST /api/recurring/analyze
// Analyze recurring meetings and suggest optimizations
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Format: { patterns: RecurringPattern[] }
    if (!body.patterns || !Array.isArray(body.patterns)) {
      return NextResponse.json(
        { error: 'Invalid request - patterns array required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Analyzing ${body.patterns.length} recurring meeting patterns...`);

    // Analyze patterns and get suggestions
    const suggestions = await analyzeRecurringMeetings(body.patterns);

    console.log(`✅ Analysis complete: ${suggestions.length} optimization opportunities found`);

    return NextResponse.json({
      success: true,
      analyzed: body.patterns.length,
      suggestions: suggestions.map(s => ({
        pattern_id: s.current.pattern_id,
        current_slot: {
          day: s.current.day_of_week,
          time: s.current.time,
          duration: s.current.duration,
          avg_score: s.current.occurrences.reduce((sum, o) => sum + o.score, 0) / s.current.occurrences.length,
        },
        suggested_slot: s.suggested ? {
          day: s.suggested.day_of_week,
          time: s.suggested.time,
          duration: s.suggested.duration,
          expected_score: s.suggested.occurrences[0]?.score || 0,
        } : null,
        reason: s.reason,
        status: 'pending', // Requires user approval
      })),
    });

  } catch (error: any) {
    console.error('Error analyzing recurring meetings:', error);
    return NextResponse.json(
      { error: 'Failed to analyze recurring meetings', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/recurring/analyze
// Get pending optimization suggestions from database
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    // Query pending optimization suggestions
    const { data, error } = await supabase
      .from('v_recurring_optimization_opportunities')
      .select('*')
      .order('avg_score', { ascending: true })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      opportunities: data || [],
    });

  } catch (error: any) {
    console.error('Error fetching recurring optimization opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimization opportunities', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/recurring/analyze
// Update optimization suggestion status (approve/reject/apply)
// ============================================================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Format: { suggestion_id: UUID, status: 'approved' | 'rejected' | 'applied' }
    if (!body.suggestion_id || !body.status) {
      return NextResponse.json(
        { error: 'Invalid request - suggestion_id and status required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'applied'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status - must be approved, rejected, or applied' },
        { status: 400 }
      );
    }

    // Update suggestion status
    const { data, error } = await supabase
      .from('recurring_meeting_analysis')
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.suggestion_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`✅ Updated recurring optimization suggestion ${body.suggestion_id} to ${body.status}`);

    return NextResponse.json({
      success: true,
      suggestion: data,
    });

  } catch (error: any) {
    console.error('Error updating recurring optimization suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion', details: error.message },
      { status: 500 }
    );
  }
}
