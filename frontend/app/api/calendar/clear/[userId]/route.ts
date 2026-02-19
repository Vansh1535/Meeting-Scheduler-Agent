/**
 * API Route: DELETE /api/calendar/clear/[userId]
 * 
 * ADMIN/DEBUG: Clears all calendar events for a user.
 * Use when user has orphaned data from wrong Google account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Delete all calendar events for this user
    const { error, count } = await supabase
      .from('calendar_events')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to clear calendar events:', error);
      return NextResponse.json(
        { error: 'Failed to clear calendar events', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: count || 0,
      message: `Cleared ${count || 0} calendar events for user`,
    });

  } catch (error: any) {
    console.error('Clear calendar events error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
