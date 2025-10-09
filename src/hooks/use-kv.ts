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
 * 
 * Usage:
 *   const [devices, setDevices] = useKV<Device[]>("devices", [])
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getKVClient } from '@/lib/kv-client'

// Cache for optimistic updates and offline support
const localCache = new Map<string, any>()

// Track pending sync operations
const pendingSyncs = new Map<string, Promise<void>>()

/**
 * Custom useKV hook with Cloudflare KV backend
 */
export function useKV<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
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
  const isMounted = useRef(true)
  const syncTimeoutRef = useRef<NodeJS.Timeout>()

  // Load initial value from Cloudflare KV
  useEffect(() => {
    isMounted.current = true

    const loadFromKV = async () => {
      try {
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
      } catch (error) {
        console.error(`Failed to load KV value for key "${key}":`, error)
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
  }, [key, defaultValue])

  // Update function with optimistic updates and debounced sync
  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const nextValue = typeof newValue === 'function' 
          ? (newValue as (prev: T) => T)(prev) 
          : newValue

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

        syncTimeoutRef.current = setTimeout(() => {
          syncToKV(key, nextValue)
        }, 500)

        return nextValue
      })
    },
    [key]
  )

  return [value, updateValue]
}

/**
 * Sync value to Cloudflare KV (debounced)
 */
async function syncToKV(key: string, value: any): Promise<void> {
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
      // TODO: Implement retry logic or error queue
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
    if (key && key.startsWith('kv:')) {
      keysToRemove.push(key)
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key))
}
