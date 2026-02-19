// Global type declarations for API route state tracking
// Used to reduce console spam from polling

declare global {
  var __calendarEventsFetched: boolean | undefined
  var __meetingsFetched: boolean | undefined
  
  interface Window {
    __eventCardLogged?: boolean
  }
}

export {}
