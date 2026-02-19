/**
 * Enhanced API Error Handler
 * Distinguishes between real errors and network issues
 * Provides proper error reporting to user
 */

export enum ApiErrorType {
  NETWORK = 'NETWORK', // Backend unreachable
  VALIDATION = 'VALIDATION', // Request validation failed
  AUTHENTICATION = 'AUTHENTICATION', // Auth failed
  AUTHORIZATION = 'AUTHORIZATION', // Permission denied
  SERVER = 'SERVER', // Server error (5xx)
  UNKNOWN = 'UNKNOWN', // Unknown error
}

export interface ApiError {
  type: ApiErrorType
  message: string
  statusCode?: number
  isRetryable: boolean
  originalError?: any
}

export class ApiErrorHandler {
  /**
   * Parse fetch/axios error and categorize it
   */
  static parseError(error: any): ApiError {
    // Network error - backend unreachable
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine) {
      return {
        type: ApiErrorType.NETWORK,
        message: 'Backend service is unavailable. Please ensure the server is running.',
        isRetryable: true,
        originalError: error,
      }
    }

    // HTTP response errors
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 400) {
        return {
          type: ApiErrorType.VALIDATION,
          message: data?.message || 'Invalid request. Please check your input.',
          statusCode: status,
          isRetryable: false,
          originalError: error,
        }
      }

      if (status === 401) {
        return {
          type: ApiErrorType.AUTHENTICATION,
          message: 'Authentication failed. Please log in again.',
          statusCode: status,
          isRetryable: false,
          originalError: error,
        }
      }

      if (status === 403) {
        return {
          type: ApiErrorType.AUTHORIZATION,
          message: 'You do not have permission to perform this action.',
          statusCode: status,
          isRetryable: false,
          originalError: error,
        }
      }

      if (status >= 500) {
        return {
          type: ApiErrorType.SERVER,
          message: 'Server error. Please try again later.',
          statusCode: status,
          isRetryable: true,
          originalError: error,
        }
      }
    }

    // Unknown error
    return {
      type: ApiErrorType.UNKNOWN,
      message: error.message || 'An unexpected error occurred.',
      isRetryable: false,
      originalError: error,
    }
  }

  /**
   * Format error for user display
   */
  static formatForDisplay(error: ApiError): string {
    switch (error.type) {
      case ApiErrorType.NETWORK:
        return '⚠️ Cannot connect to server. Is it running?'
      case ApiErrorType.VALIDATION:
        return `❌ ${error.message}`
      case ApiErrorType.AUTHENTICATION:
        return '🔐 Please log in again'
      case ApiErrorType.AUTHORIZATION:
        return '🔒 Permission denied'
      case ApiErrorType.SERVER:
        return '⚠️ Server error. Try again later.'
      default:
        return `Error: ${error.message}`
    }
  }

  /**
   * Should user retry this operation?
   */
  static shouldRetry(error: ApiError, attempt: number = 1): boolean {
    return error.isRetryable && attempt <= 3
  }
}
