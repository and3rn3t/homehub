/**
 * Custom useKV Hook
 *
 * Drop-in replacement for @github/spark/hooks useKV.
 * Provides persistent state management with Cloudflare KV backend.
 *
 * Features:
 * - localStorage cache for instant reads
 * - Optimistic updates
 * - Automatic sync with Cloudflare KV
 * - Same API as Spark's useKV
 * - Optional loading states
 *
 * Usage:
 *   const [devices, setDevices] = useKV<Device[]>("devices", [])
 *   const [devices, setDevices, { isLoading, isError }] = useKV<Device[]>("devices", [], { withMeta: true })
 */

import { getKVClient } from '@/lib/kv-client'
import { useCallback, useEffect, useRef, useState } from 'react'

// Cache for optimistic updates and offline support
const localCache = new Map<string, unknown>()

// Track pending sync operations
const pendingSyncs = new Map<string, Promise<void>>()

// Track loading states (reserved for future use)
// const loadingStates = new Map<string, boolean>()

/**
 * Metadata about the KV state
 */
export interface UseKVMeta {
  isLoading: boolean
  isError: boolean
  isSyncing: boolean
}

/**
 * Options for useKV hook
 */
export interface UseKVOptions {
  /** Return metadata (loading/error states) */
  withMeta?: boolean
  /** Skip initial load from KV (use cache only) */
  skipInitialLoad?: boolean
}

/**
 * Custom useKV hook with Cloudflare KV backend
 */
export function useKV<T>(
  key: string,
  defaultValue: T,
  options: UseKVOptions & { withMeta: true }
): [T, (value: T | ((prev: T) => T)) => void, UseKVMeta]

export function useKV<T>(
  key: string,
  defaultValue: T,
  options?: UseKVOptions & { withMeta?: false }
): [T, (value: T | ((prev: T) => T)) => void]

export function useKV<T>(
  key: string,
  defaultValue: T,
  options?: UseKVOptions
): [T, (value: T | ((prev: T) => T)) => void, UseKVMeta?] {
  const { withMeta = false, skipInitialLoad = false } = options || {}

  // Initialize state from cache or default
  const getCachedValue = useCallback((): T => {
    // Check memory cache first
    if (localCache.has(key)) {
      return localCache.get(key) as T
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`kv:${key}`)
      if (stored !== null) {
        const parsed = JSON.parse(stored)
        localCache.set(key, parsed)
        return parsed as T
      }
    } catch (error) {
      console.error(`Failed to parse localStorage for key "${key}":`, error)
    }

    return defaultValue
  }, [key, defaultValue])

  const [value, setValue] = useState<T>(getCachedValue)
  const [isLoading, setIsLoading] = useState(!localCache.has(key) && !skipInitialLoad)
  const [isError, setIsError] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const isMounted = useRef(true)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Load initial value from Cloudflare KV
  useEffect(() => {
    isMounted.current = true

    if (skipInitialLoad) {
      setIsLoading(false)
      return
    }

    const loadFromKV = async () => {
      try {
        setIsLoading(true)
        setIsError(false)

        const client = getKVClient()
        const remoteValue = await client.get<T>(key)

        if (!isMounted.current) return

        if (remoteValue !== null) {
          // Update both caches and state
          localCache.set(key, remoteValue)
          localStorage.setItem(`kv:${key}`, JSON.stringify(remoteValue))
          setValue(remoteValue)
        } else {
          // Key doesn't exist in KV, initialize with default
          await client.set(key, defaultValue)
          localCache.set(key, defaultValue)
          localStorage.setItem(`kv:${key}`, JSON.stringify(defaultValue))
        }

        setIsLoading(false)
      } catch (error) {
        // Ignore abort errors - these happen during component cleanup or hot reload
        if (error instanceof Error && error.name === 'AbortError') {
          console.debug(`KV load aborted for key "${key}" (component cleanup)`)
          setIsLoading(false)
          return
        }

        console.error(`Failed to load KV value for key "${key}":`, error)
        setIsError(true)
        setIsLoading(false)
        // Fall back to cached/default value on error
      }
    }

    loadFromKV()

    return () => {
      isMounted.current = false
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [key, defaultValue, skipInitialLoad])

  // Helper to handle sync after debounce
  const handleDebouncedSync = useCallback(async (syncKey: string, syncValue: T) => {
    await syncToKV(syncKey, syncValue)
    if (isMounted.current) {
      setIsSyncing(false)
    }
  }, [])

  // Update function with optimistic updates and debounced sync
  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue(prev => {
        const nextValue =
          typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue

        // Optimistic update - update caches immediately
        localCache.set(key, nextValue)
        try {
          localStorage.setItem(`kv:${key}`, JSON.stringify(nextValue))
        } catch (error) {
          console.error(`Failed to save to localStorage for key "${key}":`, error)
        }

        // Debounce sync to Cloudflare KV (500ms)
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current)
        }

        setIsSyncing(true)
        syncTimeoutRef.current = setTimeout(() => {
          handleDebouncedSync(key, nextValue)
        }, 500)

        return nextValue
      })
    },
    [key, handleDebouncedSync]
  )

  // Return with or without metadata
  if (withMeta) {
    return [value, updateValue, { isLoading, isError, isSyncing }] as [
      T,
      typeof updateValue,
      UseKVMeta,
    ]
  }

  return [value, updateValue] as [T, typeof updateValue]
}

/**
 * Sync value to Cloudflare KV (debounced)
 */
async function syncToKV(key: string, value: unknown): Promise<void> {
  // If already syncing this key, wait for that to finish
  if (pendingSyncs.has(key)) {
    await pendingSyncs.get(key)
  }

  const syncPromise = (async () => {
    try {
      const client = getKVClient()
      await client.set(key, value)
    } catch (error) {
      console.error(`Failed to sync to KV for key "${key}":`, error)
      // Retry logic can be added here in the future
      // For now, errors are logged and the update remains in localStorage
    } finally {
      pendingSyncs.delete(key)
    }
  })()

  pendingSyncs.set(key, syncPromise)
  await syncPromise
}

/**
 * Force sync all pending changes (useful before navigation/close)
 */
export async function flushKVChanges(): Promise<void> {
  const syncs = Array.from(pendingSyncs.values())
  await Promise.all(syncs)
}

/**
 * Clear local cache (useful for debugging/testing)
 */
export function clearKVCache(): void {
  localCache.clear()

  // Clear localStorage KV entries
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('kv:')) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))
}
