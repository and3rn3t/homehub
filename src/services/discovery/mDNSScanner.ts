/**
 * mDNS/Bonjour Scanner
 *
 * Discovers devices advertising via mDNS/Zeroconf on the local network.
 * This includes Philips Hue bridges, HomeKit devices, Chromecast, etc.
 *
 * Note: Browser-based mDNS discovery is limited due to security restrictions.
 * For full functionality, consider running a local discovery service or Node.js backend.
 */

import { logger } from '@/lib/logger'
import type {
  DeviceCapability,
  DiscoveredDevice,
  DiscoveryScanner,
  DiscoveryScanOptions,
  MDNSServiceRecord,
} from './types'

export class MDNSScanner implements DiscoveryScanner {
  name = 'mDNS Scanner'
  protocols: ('http' | 'hue')[] = ['http', 'hue']

  /**
   * Scan for mDNS devices
   *
   * Browser limitations:
   * - No direct mDNS multicast access from browser
   * - Requires backend API or browser extension
   * - This implementation provides a placeholder structure
   */
  async scan(options?: DiscoveryScanOptions): Promise<DiscoveredDevice[]> {
    logger.debug('Starting mDNS discovery...')
    logger.warn('Browser-based mDNS has limited support. Consider using a local discovery service.')

    const devices: DiscoveredDevice[] = []

    // Check if we have a local discovery API available
    const hasBackend = await this.checkForBackendAPI()

    if (hasBackend) {
      // Use backend API for mDNS discovery
      const backendDevices = await this.discoverViaBackend(options)
      devices.push(...backendDevices)
    } else {
      // Fallback: Try known device patterns (e.g., Hue bridge default ports)
      const knownDevices = await this.discoverKnownPatterns(options)
      devices.push(...knownDevices)
    }

    logger.debug(`mDNS discovery complete: ${devices.length} devices found`)
    return devices
  }

  /**
   * Check if backend mDNS API is available
   */
  private async checkForBackendAPI(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/mdns/status', {
        method: 'GET',
        signal: AbortSignal.timeout(1000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Discover devices via backend API
   */
  private async discoverViaBackend(options?: DiscoveryScanOptions): Promise<DiscoveredDevice[]> {
    try {
      const response = await fetch('http://localhost:3001/api/mdns/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`Backend API returned ${response.status}`)
      }

      const data = await response.json()
      return this.parseMDNSServices(data.services || [])
    } catch (error) {
      logger.error('mDNS backend API error', { error })
      return []
    }
  }

  /**
   * Discover known device patterns (fallback when no mDNS backend)
   */
  private async discoverKnownPatterns(
    _options?: DiscoveryScanOptions
  ): Promise<DiscoveredDevice[]> {
    const devices: DiscoveredDevice[] = []

    // Try known Philips Hue bridge discovery
    const hueDevice = await this.discoverPhilipsHue()
    if (hueDevice) {
      devices.push(hueDevice)
    }

    // Try HomeKit via HTTP fallback (if supported)
    // const homekitDevices = await this.discoverHomeKit()
    // devices.push(...homekitDevices)

    return devices
  }

  /**
   * Discover Philips Hue bridge via UPnP description
   */
  private async discoverPhilipsHue(): Promise<DiscoveredDevice | null> {
    logger.debug('Attempting Philips Hue bridge discovery...')

    // Philips Hue bridge advertises on mDNS as _hue._tcp
    // We can try common IP patterns or use the Hue discovery API
    try {
      // Try Hue's discovery service
      const response = await fetch('https://discovery.meethue.com/', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) return null

      const bridges = await response.json()
      if (!Array.isArray(bridges) || bridges.length === 0) return null

      const bridge = bridges[0]
      const bridgeIP = bridge.internalipaddress

      // Verify bridge is accessible
      const statusResponse = await fetch(`http://${bridgeIP}/api/config`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      })

      if (!statusResponse.ok) return null

      const config = await statusResponse.json()

      return {
        id: config.bridgeid || `hue-${bridgeIP.replace(/\./g, '-')}`,
        name: config.name || 'Philips Hue Bridge',
        type: 'light',
        protocol: 'hue',
        capabilities: ['toggle', 'dimming', 'color', 'color-temp'],
        metadata: {
          ip: bridgeIP,
          port: 80,
          preset: 'hue',
          mac: config.mac || bridge.id,
          model: config.modelid || 'BSB002',
          firmware: config.swversion,
          manufacturer: 'Signify (Philips Hue)',
          discoveryMethod: 'mdns',
          mdns: {
            serviceType: '_hue._tcp',
            host: `${config.name}.local`,
            txt: {
              bridgeid: config.bridgeid,
              modelid: config.modelid,
            },
          },
          raw: config,
        },
      }
    } catch (error) {
      logger.error('Hue discovery error', { error })
      return null
    }
  }

  /**
   * Parse mDNS service records into discovered devices
   */
  private parseMDNSServices(services: MDNSServiceRecord[]): DiscoveredDevice[] {
    const devices: DiscoveredDevice[] = []

    for (const service of services) {
      const device = this.serviceToDevice(service)
      if (device) {
        devices.push(device)
      }
    }

    return devices
  }

  /**
   * Convert mDNS service record to discovered device
   */
  private serviceToDevice(service: MDNSServiceRecord): DiscoveredDevice | null {
    const ip = service.addresses[0]
    if (!ip) return null

    // Determine device type and protocol from service type
    const { type, protocol, capabilities } = this.identifyServiceType(service.type)

    return {
      id: this.generateDeviceId(service),
      name: service.name || `mDNS Device (${ip})`,
      type,
      protocol,
      capabilities,
      metadata: {
        ip,
        port: service.port,
        mac: service.txt?.mac as string | undefined,
        model: service.txt?.model as string | undefined,
        firmware: service.txt?.version as string | undefined,
        manufacturer: this.extractManufacturer(service),
        discoveryMethod: 'mdns',
        mdns: {
          serviceType: service.type,
          host: service.host,
          txt: service.txt,
        },
        raw: service,
      },
    }
  }

  /**
   * Identify device type/protocol from mDNS service type
   */
  private identifyServiceType(serviceType: string): {
    type: 'light' | 'thermostat' | 'security' | 'sensor'
    protocol: 'http' | 'hue'
    capabilities: DeviceCapability[]
  } {
    // Hue bridge
    if (serviceType.includes('hue')) {
      return {
        type: 'light',
        protocol: 'hue',
        capabilities: ['toggle', 'dimming', 'color', 'color-temp'],
      }
    }

    // HomeKit devices (usually lights or sensors)
    if (serviceType.includes('hap') || serviceType.includes('homekit')) {
      return {
        type: 'light',
        protocol: 'http',
        capabilities: ['toggle', 'dimming'],
      }
    }

    // Chromecast (treat as generic HTTP device)
    if (serviceType.includes('googlecast')) {
      return {
        type: 'sensor', // Not really a sensor, but no "media" type
        protocol: 'http',
        capabilities: ['status'],
      }
    }

    // Default to generic HTTP device
    return {
      type: 'sensor',
      protocol: 'http',
      capabilities: ['status'],
    }
  }

  /**
   * Extract manufacturer from service data
   */
  private extractManufacturer(service: MDNSServiceRecord): string | undefined {
    if (service.txt?.manufacturer) {
      return service.txt.manufacturer as string
    }

    // Guess from service type
    if (service.type.includes('hue')) return 'Signify (Philips Hue)'
    if (service.type.includes('homekit')) return 'Apple HomeKit Compatible'
    if (service.type.includes('googlecast')) return 'Google'

    return undefined
  }

  /**
   * Generate unique device ID from service data
   */
  private generateDeviceId(service: MDNSServiceRecord): string {
    // Prefer MAC address if available
    if (service.txt?.mac) {
      return `mdns-${service.txt.mac}`
    }

    // Fallback to IP + port
    const ip = service.addresses[0] || 'unknown'
    return `mdns-${ip.replace(/\./g, '-')}-${service.port}`
  }
}
