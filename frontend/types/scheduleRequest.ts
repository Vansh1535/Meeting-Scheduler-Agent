/**
 * Extended Schedule Request Types
 * 
 * Supports both:
 * 1. Legacy format: participants with full calendar_summary (mock data)
 * 2. New format: participant_emails (fetch real compressed calendars)
 */

import { ScheduleRequest } from './scheduling';

export interface ScheduleRequestWithEmails extends Omit<ScheduleRequest, 'participants'> {
  participant_emails?: string[]; // New: lookup compressed calendars by email
  participants?: ScheduleRequest['participants']; // Legacy: use provided data
  userId?: string; // User ID for data isolation
}
