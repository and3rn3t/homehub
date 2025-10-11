/**
 * Discovery Manager
 *
 * Orchestrates multiple discovery scanners and manages the discovery process.
 */

import { HTTPScanner } from './HTTPScanner'
import { MDNSScanner } from './mDNSScanner'
import { SSDPScanner } from './SSDPScanner'
import type { DiscoveredDevice, DiscoveryScanner, DiscoveryScanOptions } from './types'

export class DiscoveryManager {
  private scanners: DiscoveryScanner[] = []

  constructor() {
    // Register available scanners
    this.scanners.push(new HTTPScanner())
    this.scanners.push(new MDNSScanner())
    this.scanners.push(new SSDPScanner())
    console.log(`[DiscoveryManager] Registered ${this.scanners.length} scanners`)
  }

  /**
   * Scan for devices using all available scanners
   */
  async discoverDevices(options?: DiscoveryScanOptions): Promise<DiscoveredDevice[]> {
    console.log('[DiscoveryManager] Starting discovery...')

    const results = await Promise.allSettled(this.scanners.map(scanner => scanner.scan(options)))

    const allDevices = results
      .filter((r): r is PromiseFulfilledResult<DiscoveredDevice[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)

    // Deduplicate by ID
    const uniqueDevices = Array.from(new Map(allDevices.map(d => [d.id, d])).values())

    console.log(`[DiscoveryManager] Discovery complete: ${uniqueDevices.length} devices found`)
    return uniqueDevices
  }

  /**
   * Scan using specific scanner
   */
  async discoverWith(
    scannerName: string,
    options?: DiscoveryScanOptions
  ): Promise<DiscoveredDevice[]> {
    const scanner = this.scanners.find(s => s.name === scannerName)
    if (!scanner) {
      throw new Error(`Scanner not found: ${scannerName}`)
    }

    return scanner.scan(options)
  }

  /**
   * Get list of available scanners
   */
  getAvailableScanners(): string[] {
    return this.scanners.map(s => s.name)
  }
}

// Singleton instance
export const discoveryManager = new DiscoveryManager()
