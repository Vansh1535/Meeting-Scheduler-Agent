/**
 * Data Sync Manager
 * Ensures consistent data flow between Frontend -> Backend -> Database
 * 
 * Provides:
 * - Automatic cache invalidation strategies
 * - Write verification
 * - Conflict resolution
 * - Polling mechanisms
 */

import { QueryClient } from '@tanstack/react-query'

export interface SyncResult {
  success: boolean
  data?: any
  error?: string
  verified?: boolean
  synced?: boolean
}

export interface DataOperation {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC'
  resource: 'event' | 'analytics' | 'preferences' | 'availability' | 'calendar'
  userId: string
  data?: any
  timestamp: number
}

class DataSyncManager {
  private queryClient: QueryClient | null = null
  private pendingOperations: Map<string, DataOperation> = new Map()
  private syncPollers: Map<string, NodeJS.Timeout> = new Map()
  private lastSyncTime: Map<string, number> = new Map()

  /**
   * Initialize with QueryClient instance
   */
  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  /**
   * Aggressive cache invalidation after mutation
   * Invalidates all related query keys
   */
  invalidateDataTree(resource: string, userId: string) {
    if (!this.queryClient) return

    const invalidationMap: Record<string, string[]> = {
      'event': ['calendarEvents', 'analytics', 'insights'],
      'analytics': ['analytics', 'insights', 'timeSaved', 'meetingQuality'],
      'preferences': ['preferences', 'availability'],
      'availability': ['availability', 'preferences', 'calendarEvents'],
      'calendar': ['calendarEvents', 'analytics'],
    }

    const keysToInvalidate = invalidationMap[resource] || [resource]

    // Invalidate directly related keys
    keysToInvalidate.forEach(key => {
      this.queryClient!.invalidateQueries({
        queryKey: [key],
      })
    })

    // Invalidate user-specific keys
    this.queryClient.invalidateQueries({
      queryKey: [resource, userId],
    })

    // Clear any cached analytics
    this.queryClient.invalidateQueries({
      queryKey: ['analytics'],
    })
  }

  /**
   * Log operation for later verification
   */
  logOperation(operation: DataOperation) {
    const opKey = `${operation.type}-${operation.resource}-${Date.now()}`
    this.pendingOperations.set(opKey, operation)

    // Auto-cleanup after 1 hour
    setTimeout(() => {
      this.pendingOperations.delete(opKey)
    }, 60 * 60 * 1000)
  }

  /**
   * Verify data was actually written
   */
  async verifyWrite(
    operation: DataOperation,
    verifyFunction: () => Promise<boolean>
  ): Promise<SyncResult> {
    try {
      const verified = await verifyFunction()
      return {
        success: verified,
        verified,
        data: operation.data,
      }
    } catch (error: any) {
      return {
        success: false,
        verified: false,
        error: error.message || 'Verification failed',
      }
    }
  }

  /**
   * Set up polling for a resource
   * Continuously syncs data from backend
   */
  startPolling(
    userId: string,
    resource: string,
    syncFunction: () => Promise<any>,
    interval: number = 30000 // 30 seconds
  ) {
    const pollerId = `${resource}-${userId}`

    // Clear existing poller
    this.stopPolling(pollerId)

    // Run sync immediately
    syncFunction().catch(error => {
      console.error(`Sync error for ${resource}:`, error)
    })

    // Set up interval
    const poller = setInterval(() => {
      const now = Date.now()
      const lastSync = this.lastSyncTime.get(pollerId) || 0

      // Only sync if enough time has passed
      if (now - lastSync > interval) {
        this.lastSyncTime.set(pollerId, now)
        syncFunction().catch(error => {
          console.error(`Sync error for ${resource}:`, error)
        })
      }
    }, interval)

    this.syncPollers.set(pollerId, poller)
  }

  /**
   * Stop polling for a resource
   */
  stopPolling(pollerId: string) {
    const poller = this.syncPollers.get(pollerId)
    if (poller) {
      clearInterval(poller)
      this.syncPollers.delete(pollerId)
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling() {
    this.syncPollers.forEach(poller => clearInterval(poller))
    this.syncPollers.clear()
  }

  /**
   * Get pending operations for a user
   */
  getPendingOperations(userId: string): DataOperation[] {
    return Array.from(this.pendingOperations.values()).filter(
      op => op.userId === userId
    )
  }

  /**
   * Clear pending operations
   */
  clearPendingOperations(userId: string) {
    Array.from(this.pendingOperations.entries()).forEach(([key, op]) => {
      if (op.userId === userId) {
        this.pendingOperations.delete(key)
      }
    })
  }

  /**
   * Handle conflict when data differs between frontend and backend
   * Returns which version to use
   */
  resolveConflict(
    frontendData: any,
    backendData: any,
    backendTimestamp: number
  ): { winner: 'frontend' | 'backend'; data: any } {
    // Backend data is always the source of truth if it's newer
    const frontendTime = frontendData.updatedAt || 0
    
    if (backendTimestamp > frontendTime) {
      return { winner: 'backend', data: backendData }
    }
    
    // Otherwise frontend is kept (user's local changes)
    return { winner: 'frontend', data: frontendData }
  }
}

// Export singleton instance
export const dataSyncManager = new DataSyncManager()
