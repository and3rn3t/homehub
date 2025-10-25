/**
 * React Hook for Service Worker Update Detection
 *
 * Monitors for service worker updates and provides user-friendly notifications
 * when a new version is available. Handles the update process with skipWaiting
 * and client reloads.
 *
 * Features:
 * - Automatic update detection
 * - User confirmation before update
 * - Reload all tabs after update
 * - Preserve queued sync requests
 * - Version tracking
 *
 * Usage:
 * ```typescript
 * const {
 *   needRefresh,
 *   updateAvailable,
 *   updateServiceWorker
 * } = useServiceWorkerUpdate()
 *
 * // Show update prompt
 * {updateAvailable && (
 *   <Alert>
 *     New version available!
 *     <Button onClick={() => updateServiceWorker(true)}>
 *       Update Now
 *     </Button>
 *   </Alert>
 * )}
 * ```
 */

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface UpdateInfo {
  version?: string
  timestamp: number
}

interface RegisterSWOptions {
  immediate?: boolean
  onRegisteredSW?: (
    swScriptUrl: string,
    registration: ServiceWorkerRegistration | undefined
  ) => void
  onRegisterError?: (error: Error) => void
}

interface UseRegisterSWReturn {
  needRefresh: [boolean, (value: boolean) => void]
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
}

/**
 * Hook for PWA service worker registration
 * This is a simplified implementation - the full version comes from vite-plugin-pwa
 */
function useRegisterSW(options: RegisterSWOptions): UseRegisterSWReturn {
  const [needRefresh, setNeedRefresh] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service workers not supported in this browser')
      return
    }

    const registerSW = async () => {
      try {
        console.log('[SW] Starting service worker registration...')
        const registration = await navigator.serviceWorker.register('/sw.js', {
          type: 'module',
        })

        console.log('[SW] ✅ Registered successfully:', registration.scope)

        if (options.onRegisteredSW) {
          options.onRegisteredSW('/sw.js', registration)
        }

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing

          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[SW] Update available')
              setNeedRefresh(true)
            }
          })
        })

        // Check for waiting service worker
        if (registration.waiting) {
          console.log('[SW] Update already waiting')
          setNeedRefresh(true)
        }
      } catch (error) {
        console.error('[SW] Registration failed:', error)
        if (options.onRegisterError && error instanceof Error) {
          options.onRegisterError(error)
        }
      }
    }

    registerSW()
  }, [options])

  const updateServiceWorker = async (reloadPage = true) => {
    const registration = await navigator.serviceWorker.ready

    if (registration.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      if (reloadPage) {
        // Reload after the new service worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      }
    }
  }

  return {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  }
}

export function useServiceWorkerUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Check for updates every hour
    onRegisteredSW(swUrl, registration) {
      console.log('[SW Update] Service worker registered:', swUrl)

      if (registration) {
        // Set up periodic update checks
        setInterval(
          () => {
            console.log('[SW Update] Checking for updates...')
            registration.update()
          },
          60 * 60 * 1000
        ) // Check every hour
      }
    },

    // New service worker waiting to activate
    onRegisterError(error) {
      console.error('[SW Update] Registration error:', error)
      toast.error('Failed to register service worker')
    },

    // Immediate update available (skipWaiting)
    immediate: false,
  })

  /**
   * Listen for service worker update messages
   */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATE_AVAILABLE') {
        const info: UpdateInfo = {
          version: event.data.version,
          timestamp: Date.now(),
        }

        setUpdateInfo(info)
        console.log('[SW Update] Update available:', info)

        // Show update notification
        toast.info('New version available!', {
          description: 'Click to update and refresh the app',
          duration: Infinity,
          action: {
            label: 'Update Now',
            onClick: () => {
              updateServiceWorker(true)
            },
          },
          cancel: {
            label: 'Later',
            onClick: () => {
              setNeedRefresh(false)
            },
          },
        })
      }

      if (event.data?.type === 'SW_UPDATED') {
        console.log('[SW Update] Service worker updated, reloading...')
        // Wait a moment for other tabs to update
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [updateServiceWorker, setNeedRefresh])

  /**
   * Handle update button click
   */
  const handleUpdate = async (reloadPage = true) => {
    try {
      console.log('[SW Update] Applying update...')

      // Update service worker (calls skipWaiting)
      await updateServiceWorker(reloadPage)

      if (reloadPage) {
        toast.success('Updating app...')
      } else {
        toast.success('Update applied! Refresh to see changes.')
      }
    } catch (error) {
      console.error('[SW Update] Update failed:', error)
      toast.error('Failed to apply update')
    }
  }

  /**
   * Dismiss update notification
   */
  const dismissUpdate = () => {
    setNeedRefresh(false)
    setUpdateInfo(null)
    toast.dismiss()
  }

  /**
   * Check for updates manually
   */
  const checkForUpdates = async () => {
    if (!('serviceWorker' in navigator)) {
      toast.error('Service workers not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready

      console.log('[SW Update] Checking for updates...')
      toast.info('Checking for updates...')

      await registration.update()

      // Give it a moment to detect updates
      setTimeout(() => {
        if (!needRefresh) {
          toast.success('You are on the latest version')
        }
      }, 2000)
    } catch (error) {
      console.error('[SW Update] Update check failed:', error)
      toast.error('Failed to check for updates')
    }
  }

  return {
    needRefresh,
    updateAvailable: needRefresh || updateInfo !== null,
    updateInfo,
    updateServiceWorker: handleUpdate,
    dismissUpdate,
    checkForUpdates,
  }
}
