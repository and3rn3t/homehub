/**
 * Discovery Types
 *
 * Type definitions for device discovery system
 */

import type { DeviceCapability, DeviceProtocol, DeviceType } from '@/types'

/**
 * Discovered device information
 */
export interface DiscoveredDevice {
  /** Unique identifier (MAC address or generated ID) */
  id: string

  /** Device name from discovery */
  name: string

  /** Device type */
  type: DeviceType

  /** Communication protocol */
  protocol: DeviceProtocol

  /** Device capabilities */
  capabilities: DeviceCapability[]

  /** Discovery metadata */
  metadata: {
    /** IP address */
    ip: string

    /** Port number */
    port: number

    /** Preset type (shelly, tplink, hue, generic) */
    preset?: string

    /** MAC address */
    mac?: string

    /** Model name */
    model?: string

    /** Firmware version */
    firmware?: string

    /** Manufacturer */
    manufacturer?: string

    /** Discovery method (http, mdns, ssdp) */
    discoveryMethod: 'http' | 'mdns' | 'ssdp'

    /** Raw discovery data */
    raw?: unknown
  }
}

/**
 * Discovery scanner interface
 */
export interface DiscoveryScanner {
  /** Scanner name */
  name: string

  /** Supported protocols */
  protocols: DeviceProtocol[]

  /** Scan for devices */
  scan(options?: DiscoveryScanOptions): Promise<DiscoveredDevice[]>
}

/**
 * Discovery scan options
 */
export interface DiscoveryScanOptions {
  /** IP range to scan (CIDR notation) */
  ipRange?: string

  /** Ports to probe */
  ports?: number[]

  /** Timeout per request (ms) */
  timeout?: number

  /** Maximum concurrent requests */
  maxConcurrent?: number

  /** Device types to search for */
  deviceTypes?: string[]
}

/**
 * Discovery progress callback
 */
export interface DiscoveryProgress {
  /** Total IPs to scan */
  total: number

  /** IPs scanned so far */
  current: number

  /** Devices found */
  found: number

  /** Current IP being scanned */
  currentIP?: string
}
