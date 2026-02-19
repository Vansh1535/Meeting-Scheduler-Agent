/**
 * Use API Error Hook
 * Properly handles and displays API errors to users
 * Distinguishes between network errors and actual errors
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import { ApiErrorHandler, ApiErrorType, type ApiError } from '@/lib/api-error-handler'

export interface UseApiErrorOptions {
  showNotification?: boolean
  onNetworkError?: () => void
  onAuthError?: () => void
}

/**
 * Hook for handling API errors properly
 */
export function useApiError(options: UseApiErrorOptions = {}) {
  const {
    showNotification = true,
    onNetworkError,
    onAuthError,
  } = options

  const handleError = useCallback((error: any): ApiError | null => {
    // Parse the error
    const apiError = error instanceof Object && 'type' in error 
      ? error as ApiError 
      : ApiErrorHandler.parseError(error)

    // Show notification
    if (showNotification) {
      const message = ApiErrorHandler.formatForDisplay(apiError)
      
      if (apiError.type === ApiErrorType.NETWORK) {
        toast.error(message, {
          duration: 5000,
          id: 'network-error',
        })
        onNetworkError?.()
      } else if (apiError.type === ApiErrorType.AUTHENTICATION) {
        toast.error(message, {
          duration: 5000,
          id: 'auth-error',
        })
        onAuthError?.()
      } else {
        toast.error(message)
      }
    }

    return apiError
  }, [showNotification, onNetworkError, onAuthError])

  return {
    handleError,
    isRetryable: (error: ApiError) => ApiErrorHandler.shouldRetry(error),
    formatError: ApiErrorHandler.formatForDisplay,
  }
}

/**
 * Hook to wrap async functions with error handling
 */
export function useAsyncWithErrorHandling() {
  const { handleError } = useApiError()

  return async <T,>(
    asyncFn: () => Promise<T>,
    options?: {
      retries?: number
      onSuccess?: (data: T) => void
      onError?: (error: ApiError) => void
    }
  ): Promise<T | null> => {
    const { retries = 0, onSuccess, onError } = options || {}
    
    let lastError: ApiError | null = null
    let attempts = 0
    const maxAttempts = retries + 1

    while (attempts < maxAttempts) {
      try {
        const result = await asyncFn()
        onSuccess?.(result)
        return result
      } catch (error: any) {
        lastError = handleError(error)
        attempts++

        // Check if we should retry
        if (!ApiErrorHandler.shouldRetry(lastError, attempts)) {
          onError?.(lastError)
          return null
        }

        // Wait before retry with exponential backoff
        if (attempts < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    onError?.(lastError!)
    return null
  }
}
