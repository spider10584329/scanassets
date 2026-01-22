/**
 * Session cleanup utilities for handling browser storage and authentication state
 */

export class SessionCleanup {
  private static readonly AUTH_TOKEN_KEY = 'auth-token'
  private static readonly SESSION_KEYS = [
    'auth-token',
    'user-data',
    'session-id',
    'temp-auth'
  ]

  /**
   * Clear all authentication-related data from browser storage
   */
  static clearAuthData(): void {
    try {
      // Clear localStorage
      this.SESSION_KEYS.forEach(key => {
        localStorage.removeItem(key)
      })

      // Clear sessionStorage
      this.SESSION_KEYS.forEach(key => {
        sessionStorage.removeItem(key)
      })

      // Clear auth cookies
      document.cookie = `${this.AUTH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`
      
      // Clear any domain-specific cookies
      const domain = window.location.hostname
      document.cookie = `${this.AUTH_TOKEN_KEY}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`
      

    } catch (error) {
      console.error('SessionCleanup: Error clearing auth data:', error)
    }
  }

  /**
   * Check if there are any stale authentication tokens
   */
  static hasStaleTokens(): boolean {
    try {
      const localToken = localStorage.getItem(this.AUTH_TOKEN_KEY)
      const cookieToken = this.getCookieValue(this.AUTH_TOKEN_KEY)
      
      return !!(localToken || cookieToken)
    } catch (error) {
      console.error('SessionCleanup: Error checking for stale tokens:', error)
      return false
    }
  }

  /**
   * Get cookie value by name
   */
  private static getCookieValue(name: string): string | null {
    if (typeof document === 'undefined') return null
    
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  /**
   * Clean up expired tokens and session data
   * OPTIMIZATION: This is now only called on visibility change in AuthContext
   * to prevent excessive API calls
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const token = localStorage.getItem(this.AUTH_TOKEN_KEY) || this.getCookieValue(this.AUTH_TOKEN_KEY)
      
      if (!token) {
        return
      }

      // Verify token with server with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      try {
        const response = await fetch('/api/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok || !(await response.json()).valid) {
          this.clearAuthData()
        }
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('SessionCleanup: Token verification timed out')
        }
        throw error
      }
    } catch (error) {
      console.error('SessionCleanup: Error during cleanup:', error)
      // If we can't verify, clear to be safe
      this.clearAuthData()
    }
  }

  /**
   * Set up cleanup on page load
   * OPTIMIZATION: Removed automatic cleanup intervals to prevent memory leaks
   */
  static initializeCleanup(): void {
    // Clean up on page load only if session was marked as ending
    window.addEventListener('load', () => {
      const sessionEnding = sessionStorage.getItem('session-ending')
      const sessionClosed = sessionStorage.getItem('session-closed')
      
      if (sessionEnding === 'true' || sessionClosed === 'true') {
        this.clearAuthData()
        sessionStorage.removeItem('session-ending')
        sessionStorage.removeItem('session-closed')
      }
    })

    // Mark session as ending on page unload
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem('session-ending', 'true')
    })

    // REMOVED: visibility change cleanup moved to AuthContext to prevent duplicate API calls
  }
}

// Initialize cleanup when module is loaded
if (typeof window !== 'undefined') {
  SessionCleanup.initializeCleanup()
}
