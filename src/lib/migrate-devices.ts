/**
 * Device Storage Migration
 *
 * Fixes empty device storage by ensuring devices always exist.
 * Run this once on app init to repair any broken device data.
 */

import { KV_KEYS, MOCK_DEVICES } from '@/constants'
import { logger } from '@/lib/logger'

/**
 * Test if localStorage is available and writable
 */
function testLocalStorageAvailability(): boolean {
  try {
    localStorage.setItem('migration-test', 'test')
    localStorage.removeItem('migration-test')
    return true
  } catch (error) {
    logger.error('[Migration] localStorage is not available', error as Error)
    console.error('❌ localStorage blocked or full. Check browser privacy settings.')
    return false
  }
}

/**
 * Write devices to localStorage with verification
 */
function writeDevicesToStorage(devicesKey: string): boolean {
  try {
    const deviceJson = JSON.stringify(MOCK_DEVICES)
    logger.debug(`[Migration] Writing ${MOCK_DEVICES.length} devices (${deviceJson.length} chars)`)
    
    localStorage.setItem(devicesKey, deviceJson)
    
    // Verify write succeeded
    const verify = localStorage.getItem(devicesKey)
    if (verify) {
      const verifyParsed = JSON.parse(verify)
      logger.info(`[Migration] ✅ Write verified: ${verifyParsed.length} devices in storage`)
      return true
    } else {
      logger.error('[Migration] ❌ Write verification failed - storage is still empty!')
      return false
    }
  } catch (error) {
    logger.error('[Migration] Failed to write devices', error as Error)
    return false
  }
}

/**
 * Handle existing device storage
 */
function handleExistingDevices(devicesKey: string, storedDevices: string): boolean {
  try {
    const devices = JSON.parse(storedDevices)
    logger.debug(`[Migration] Parsed storage: ${devices.length} devices`)

    // If devices exist and have data, we're good
    if (Array.isArray(devices) && devices.length > 0) {
      logger.info(`[Migration] ✅ Devices OK: ${devices.length} devices found`)
      return true
    }

    // If devices array is empty or invalid, restore from mock
    logger.warn('[Migration] Devices array empty/invalid, restoring from MOCK_DEVICES')
    return writeDevicesToStorage(devicesKey)
  } catch (parseError) {
    // Parse error, restore from mock
    logger.error('[Migration] Failed to parse devices, restoring from MOCK_DEVICES', parseError as Error)
    return writeDevicesToStorage(devicesKey)
  }
}

/**
 * Main migration function
 */
export function migrateDeviceStorage(): void {
  const devicesKey = `kv:${KV_KEYS.DEVICES}`
  
  try {
    // Test localStorage availability first
    if (!testLocalStorageAvailability()) {
      return
    }

    logger.info('[Migration] Starting device storage migration...')
    const storedDevices = localStorage.getItem(devicesKey)
    logger.debug(`[Migration] Current storage state: ${storedDevices ? 'EXISTS' : 'NULL'}`)

    // Handle existing devices or initialize new
    const success = storedDevices 
      ? handleExistingDevices(devicesKey, storedDevices)
      : (() => {
          logger.info('[Migration] No devices key found, initializing with MOCK_DEVICES')
          return writeDevicesToStorage(devicesKey)
        })()

    if (!success) {
      console.error('❌ Migration completed but verification failed. Check console for errors.')
    }
  } catch (error) {
    logger.error('[Migration] Device storage migration failed', error as Error)
    console.error('❌ Migration crashed:', error)
    
    // Last resort - try emergency initialization
    try {
      console.log('🔄 Attempting emergency device initialization...')
      localStorage.setItem(devicesKey, JSON.stringify(MOCK_DEVICES))
      console.log('✅ Emergency initialization complete')
    } catch (emergencyError) {
      console.error('❌ Emergency initialization failed:', emergencyError)
      console.error('   localStorage may be disabled or full')
    }
  }
}
