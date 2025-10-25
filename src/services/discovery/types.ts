/**
 * Discovery Types
 *
 * Type definitions for device discovery system
 */

import type { DeviceProtocol, DeviceType } from '@/types'

/**
 * Device capabilities (copied from services/devices/types.ts to avoid circular deps)
 */
export type DeviceCapability =
  | 'toggle' // On/off control
  | 'dimming' // Brightness control (0-100%)
  | 'color' // RGB color control
  | 'color-temp' // Color temperature control (Kelvin)
  | 'set_value' // Generic value setting
  | 'set_color' // Color setting (hex/rgb)
  | 'get_state' // State reading
  | 'status' // Status reporting

/**
 * Discovery method types
 */
export type DiscoveryMethod = 'http' | 'mdns' | 'ssdp' | 'upnp'

/**
 * mDNS service types for different device categories
 */
export type MDNSServiceType = string // Examples: _hap._tcp, _homekit._tcp, _http._tcp, etc.

/**
 * Common mDNS service types
 */
export const KNOWN_MDNS_SERVICES = {
  HOMEKIT: '_hap._tcp',
  HOMEKIT_ALT: '_homekit._tcp',
  HTTP: '_http._tcp',
  GOOGLECAST: '_googlecast._tcp',
  HUE: '_philips-hue._tcp',
  HUE_ALT: '_hue._tcp',
  SSH: '_ssh._tcp',
  SFTP: '_sftp-ssh._tcp',
  WORKSTATION: '_workstation._tcp',
} as const

/**
 * mDNS service record data
 */
export interface MDNSServiceRecord {
  /** Service name */
  name: string

  /** Service type */
  type: MDNSServiceType

  /** Service protocol (tcp/udp) */
  protocol: 'tcp' | 'udp'

  /** Host name */
  host: string

  /** IP addresses */
  addresses: string[]

  /** Port number */
  port: number

  /** TXT record data */
  txt?: Record<string, string | boolean | number>

  /** Full domain name */
  fqdn?: string
}

/**
 * SSDP/UPnP device types
 */
export type SSDPDeviceType = string // URN format, e.g., urn:schemas-upnp-org:device:Basic:1

/**
 * Common SSDP/UPnP device types
 */
export const KNOWN_SSDP_TYPES = {
  BASIC: 'urn:schemas-upnp-org:device:Basic:1',
  BINARY_LIGHT: 'urn:schemas-upnp-org:device:BinaryLight:1',
  DIMMABLE_LIGHT: 'urn:schemas-upnp-org:device:DimmableLight:1',
  WEMO_SWITCH: 'urn:Belkin:device:controllee:1',
  WEMO_INSIGHT: 'urn:Belkin:device:insight:1',
  TPLINK_SWITCH: 'urn:tp-link:device:IOT.SMARTPLUGSWITCH:1',
} as const

/**
 * SSDP discovery response
 */
export interface SSDPResponse {
  /** Device location URL */
  location: string

  /** Search target / device type */
  st: string

  /** Unique service name */
  usn: string

  /** Server identification */
  server?: string

  /** Cache control max-age */
  cacheControl?: string

  /** IP address */
  address?: string

  /** Headers */
  headers: Record<string, string>
}

/**
 * UPnP device description (parsed from XML)
 */
export interface UPnPDeviceDescription {
  /** Device type URN */
  deviceType: string

  /** Friendly name */
  friendlyName: string

  /** Manufacturer */
  manufacturer?: string

  /** Manufacturer URL */
  manufacturerURL?: string

  /** Model description */
  modelDescription?: string

  /** Model name */
  modelName?: string

  /** Model number */
  modelNumber?: string

  /** Serial number */
  serialNumber?: string

  /** Unique device name */
  UDN: string

  /** Presentation URL */
  presentationURL?: string

  /** Service list */
  serviceList?: Array<{
    serviceType: string
    serviceId: string
    controlURL: string
    eventSubURL: string
    SCPDURL: string
  }>
}

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

    /** Discovery method */
    discoveryMethod: DiscoveryMethod

    /** mDNS-specific data */
    mdns?: {
      serviceType: string
      host: string
      txt?: Record<string, string | boolean | number>
    }

    /** SSDP/UPnP-specific data */
    ssdp?: {
      location: string
      usn: string
      deviceType?: string
      presentationURL?: string
    }

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
