/**
 * Device Storage Migration
 *
 * Fixes empty device storage by ensuring devices always exist.
 * Run this once on app init to repair any broken device data.
 */

import { KV_KEYS, MOCK_DEVICES } from '@/constants'
import { logger } from '@/lib/logger'

export function migrateDeviceStorage(): void {
  try {
    const devicesKey = `kv:${KV_KEYS.DEVICES}`
    const storedDevices = localStorage.getItem(devicesKey)

    // Check if devices exist and are valid
    if (storedDevices) {
      try {
        const devices = JSON.parse(storedDevices)

        // If devices array exists but is empty, restore from mock
        if (Array.isArray(devices) && devices.length === 0) {
          logger.warn('[Migration] Devices array is empty, restoring from MOCK_DEVICES')
          localStorage.setItem(devicesKey, JSON.stringify(MOCK_DEVICES))
          logger.info(`[Migration] Restored ${MOCK_DEVICES.length} devices from mock data`)
          return
        }

        // If devices exist and have data, we're good
        if (Array.isArray(devices) && devices.length > 0) {
          logger.debug(`[Migration] Devices OK: ${devices.length} devices found`)
          return
        }

        // Invalid format, restore from mock
        logger.warn('[Migration] Devices format invalid, restoring from MOCK_DEVICES')
        localStorage.setItem(devicesKey, JSON.stringify(MOCK_DEVICES))
        logger.info(`[Migration] Restored ${MOCK_DEVICES.length} devices from mock data`)
      } catch (e) {
        // Parse error, restore from mock
        logger.error('[Migration] Failed to parse devices, restoring from MOCK_DEVICES', e as Error)
        localStorage.setItem(devicesKey, JSON.stringify(MOCK_DEVICES))
        logger.info(`[Migration] Restored ${MOCK_DEVICES.length} devices from mock data`)
      }
    } else {
      // No devices key exists, initialize with mock
      logger.info('[Migration] No devices found, initializing with MOCK_DEVICES')
      localStorage.setItem(devicesKey, JSON.stringify(MOCK_DEVICES))
      logger.info(`[Migration] Initialized ${MOCK_DEVICES.length} devices from mock data`)
    }
  } catch (error) {
    logger.error('[Migration] Device storage migration failed', error as Error)
  }
}
