import { useEffect, useState } from 'react'

/**
 * Custom hook to detect online/offline network status
 * Monitors both browser connectivity and application-level connection state
 *
 * @returns boolean - true if online, false if offline
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useNetworkStatus()
 *
 *   return isOnline ? <div>Connected</div> : <div>Offline</div>
 * }
 * ```
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize with current status
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine
    }
    return true // Assume online by default
  })

  useEffect(() => {
    // Update online status
    const handleOnline = () => {
      console.log('[NetworkStatus] Connection restored')
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log('[NetworkStatus] Connection lost')
      setIsOnline(false)
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Also check periodically (every 30s) by attempting to fetch a small resource
    const checkConnection = async () => {
      try {
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
        })
        if (response.ok || response.type === 'opaque') {
          if (!isOnline) {
            setIsOnline(true)
          }
        } else {
          if (isOnline) {
            setIsOnline(false)
          }
        }
      } catch (error) {
        if (isOnline) {
          console.warn('[NetworkStatus] Connection check failed:', error)
          setIsOnline(false)
        }
      }
    }

    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isOnline])

  return isOnline
}
