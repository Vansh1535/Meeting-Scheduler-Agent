/**
 * API Route: /api/calendar/update-event
 * Updates a calendar event in the DB and patches it in Google Calendar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedClient } from '@/lib/googleAuth'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, userId, title, description, startTime, endTime, location, notifyAttendees } = body

    if (!eventId || !userId) {
      return NextResponse.json({ error: 'Missing eventId or userId' }, { status: 400 })
    }

    // Fetch the existing event
    const { data: existing, error: fetchError } = await (supabaseAdmin as any)
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Build update payload (only fields that were supplied)
    const dbUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title !== undefined)       dbUpdate.title       = title
    if (description !== undefined) dbUpdate.description = description
    if (startTime !== undefined)   dbUpdate.start_time  = startTime
    if (endTime !== undefined)     dbUpdate.end_time    = endTime
    if (location !== undefined)    dbUpdate.location    = location

    // Update DB
    const { error: updateError } = await (supabaseAdmin as any)
      .from('calendar_events')
      .update(dbUpdate)
      .eq('id', eventId)

    if (updateError) {
      console.error('DB update failed:', updateError)
      return NextResponse.json({ error: 'Failed to update event', message: updateError.message }, { status: 500 })
    }

    // Patch Google Calendar if the event has a real google_event_id
    const gcalId = existing.google_event_id
    const isRealGcalEvent = gcalId && !gcalId.startsWith('ai-quick-') && !gcalId.startsWith('ai-scheduled-')
    const isAIPlatformWithGcal = (existing.source_platform === 'ai_platform') && gcalId && !gcalId.startsWith('ai-quick-') && !gcalId.startsWith('ai-scheduled-')

    if (isRealGcalEvent || isAIPlatformWithGcal) {
      try {
        const oauth2Client = await getAuthenticatedClient(userId)
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        const patchBody: any = {}
        if (title !== undefined)       patchBody.summary     = title
        if (description !== undefined) patchBody.description = description
        if (location !== undefined)    patchBody.location    = location
        if (startTime !== undefined)   patchBody.start = { dateTime: startTime, timeZone: existing.timezone || 'UTC' }
        if (endTime !== undefined)     patchBody.end   = { dateTime: endTime,   timeZone: existing.timezone || 'UTC' }

        await calendar.events.patch({
          calendarId: existing.google_calendar_id || 'primary',
          eventId: gcalId,
          requestBody: patchBody,
          sendUpdates: notifyAttendees !== false ? 'all' : 'none',
        })

        console.log(`✅ Google Calendar event patched: ${gcalId}`)
      } catch (gcalErr: any) {
        // Non-fatal — DB is already updated
        console.warn('⚠️  Google Calendar patch failed (DB already updated):', gcalErr.message)
      }
    }

    return NextResponse.json({ success: true, message: 'Event updated successfully' })
  } catch (error: any) {
    console.error('Update event error:', error)
    return NextResponse.json({ error: 'Failed to update event', message: error.message }, { status: 500 })
  }
}
