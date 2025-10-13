/**
 * SSDP/UPnP Scanner
 *
 * Discovers UPnP devices via SSDP (Simple Service Discovery Protocol).
 * This includes TP-Link smart plugs, Belkin WeMo devices, and other UPnP-compatible hardware.
 *
 * Note: Browser-based SSDP discovery is not possible due to UDP multicast limitations.
 * This implementation requires a backend service or Node.js environment.
 */

import { logger } from '@/lib/logger'
import type {
  DeviceCapability,
  DiscoveredDevice,
  DiscoveryScanner,
  DiscoveryScanOptions,
  SSDPResponse,
  UPnPDeviceDescription,
} from './types'

export class SSDPScanner implements DiscoveryScanner {
  name = 'SSDP Scanner'
  protocols: 'http'[] = ['http']

  /**
   * Scan for SSDP/UPnP devices
   *
   * Browser limitations:
   * - No direct UDP multicast access from browser
   * - Requires backend API or Node.js server
   * - This implementation provides a placeholder structure
   */
  async scan(options?: DiscoveryScanOptions): Promise<DiscoveredDevice[]> {
    logger.debug('Starting SSDP discovery...')
    logger.warn('Browser-based SSDP requires a backend service. Checking for local API...')

    const devices: DiscoveredDevice[] = []

    // Check if we have a local discovery API available
    const hasBackend = await this.checkForBackendAPI()

    if (hasBackend) {
      // Use backend API for SSDP discovery
      const backendDevices = await this.discoverViaBackend(options)
      devices.push(...backendDevices)
    } else {
      // Fallback: Try known UPnP device HTTP endpoints
      const knownDevices = await this.discoverKnownUPnPDevices(options)
      devices.push(...knownDevices)
    }

    logger.debug(`SSDP discovery complete: ${devices.length} devices found`)
    return devices
  }

  /**
   * Check if backend SSDP API is available
   */
  private async checkForBackendAPI(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/ssdp/status', {
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
      const response = await fetch('http://localhost:3001/api/ssdp/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        throw new Error(`Backend API returned ${response.status}`)
      }

      const data = await response.json()
      return this.parseSSDPResponses(data.devices || [])
    } catch (error) {
      logger.error('SSDP backend API error', { error })
      return []
    }
  }

  /**
   * Discover known UPnP device patterns (fallback)
   */
  private async discoverKnownUPnPDevices(
    _options?: DiscoveryScanOptions
  ): Promise<DiscoveredDevice[]> {
    const devices: DiscoveredDevice[] = []

    // Try TP-Link Kasa devices (port 9999)
    // const tpLinkDevices = await this.discoverTPLink()
    // devices.push(...tpLinkDevices)

    // Try Belkin WeMo devices (port 49153)
    // const wemoDevices = await this.discoverWeMo()
    // devices.push(...wemoDevices)

    logger.debug('Known UPnP patterns not yet implemented')

    return devices
  }

  /**
   * Parse SSDP responses into discovered devices
   */
  private async parseSSDPResponses(responses: SSDPResponse[]): Promise<DiscoveredDevice[]> {
    const devices: DiscoveredDevice[] = []

    for (const response of responses) {
      try {
        const device = await this.parseSSDPResponse(response)
        if (device) {
          devices.push(device)
        }
      } catch (error) {
        logger.error('Failed to parse SSDP response', { error, response })
      }
    }

    return devices
  }

  /**
   * Parse single SSDP response and fetch device description
   */
  private async parseSSDPResponse(response: SSDPResponse): Promise<DiscoveredDevice | null> {
    // Fetch device description XML from location URL
    const description = await this.fetchDeviceDescription(response.location)
    if (!description) return null

    // Extract IP address from location URL
    const url = new URL(response.location)
    const ip = url.hostname
    const port = parseInt(url.port) || 80

    // Determine device type and capabilities
    const { type, protocol, capabilities } = this.identifyDeviceType(description)

    return {
      id: this.generateDeviceId(description, ip),
      name: description.friendlyName || `UPnP Device (${ip})`,
      type,
      protocol,
      capabilities,
      metadata: {
        ip,
        port,
        model: description.modelName,
        firmware: description.modelNumber,
        manufacturer: description.manufacturer,
        discoveryMethod: 'ssdp',
        ssdp: {
          location: response.location,
          usn: response.usn,
          deviceType: description.deviceType,
          presentationURL: description.presentationURL,
        },
        raw: description,
      },
    }
  }

  /**
   * Fetch and parse UPnP device description XML
   */
  private async fetchDeviceDescription(locationURL: string): Promise<UPnPDeviceDescription | null> {
    try {
      const response = await fetch(locationURL, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) return null

      const xmlText = await response.text()
      return this.parseDeviceDescriptionXML(xmlText)
    } catch (error) {
      logger.error('Failed to fetch device description', { error, url: descriptionUrl })
      return null
    }
  }

  /**
   * Parse UPnP device description XML
   */
  private parseDeviceDescriptionXML(xml: string): UPnPDeviceDescription | null {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'text/xml')

      // Check for parsing errors
      const parserError = doc.querySelector('parsererror')
      if (parserError) {
        logger.error('XML parsing error', { error: parserError.textContent })
        return null
      }

      // Extract device information
      const device = doc.querySelector('device')
      if (!device) return null

      const getTextContent = (tagName: string): string | undefined => {
        const element = device.querySelector(tagName)
        return element?.textContent || undefined
      }

      return {
        deviceType: getTextContent('deviceType') || '',
        friendlyName: getTextContent('friendlyName') || '',
        manufacturer: getTextContent('manufacturer'),
        manufacturerURL: getTextContent('manufacturerURL'),
        modelDescription: getTextContent('modelDescription'),
        modelName: getTextContent('modelName'),
        modelNumber: getTextContent('modelNumber'),
        serialNumber: getTextContent('serialNumber'),
        UDN: getTextContent('UDN') || '',
        presentationURL: getTextContent('presentationURL'),
        serviceList: this.parseServiceList(device),
      }
    } catch (error) {
      logger.error('XML parsing failed', { error })
      return null
    }
  }

  /**
   * Parse service list from device XML
   */
  private parseServiceList(deviceElement: Element): UPnPDeviceDescription['serviceList'] {
    const serviceList = deviceElement.querySelector('serviceList')
    if (!serviceList) return undefined

    const services = Array.from(serviceList.querySelectorAll('service'))
    return services.map(service => {
      const getTextContent = (tagName: string): string => {
        const element = service.querySelector(tagName)
        return element?.textContent || ''
      }

      return {
        serviceType: getTextContent('serviceType'),
        serviceId: getTextContent('serviceId'),
        controlURL: getTextContent('controlURL'),
        eventSubURL: getTextContent('eventSubURL'),
        SCPDURL: getTextContent('SCPDURL'),
      }
    })
  }

  /**
   * Identify device type/protocol from UPnP description
   */
  private identifyDeviceType(description: UPnPDeviceDescription): {
    type: 'light' | 'thermostat' | 'security' | 'sensor'
    protocol: 'http'
    capabilities: DeviceCapability[]
  } {
    const deviceType = description.deviceType.toLowerCase()
    const modelName = description.modelName?.toLowerCase() || ''
    const manufacturer = description.manufacturer?.toLowerCase() || ''

    // TP-Link smart plug/switch
    if (manufacturer.includes('tp-link') || modelName.includes('kasa')) {
      return {
        type: 'light',
        protocol: 'http',
        capabilities: ['toggle', 'set_value'],
      }
    }

    // Belkin WeMo
    if (manufacturer.includes('belkin') || deviceType.includes('belkin')) {
      return {
        type: 'light',
        protocol: 'http',
        capabilities: ['toggle'],
      }
    }

    // Dimmable light
    if (deviceType.includes('dimmablelight')) {
      return {
        type: 'light',
        protocol: 'http',
        capabilities: ['toggle', 'dimming'],
      }
    }

    // Binary light (on/off only)
    if (deviceType.includes('binarylight') || deviceType.includes('light')) {
      return {
        type: 'light',
        protocol: 'http',
        capabilities: ['toggle'],
      }
    }

    // Default to generic sensor
    return {
      type: 'sensor',
      protocol: 'http',
      capabilities: ['status'],
    }
  }

  /**
   * Generate unique device ID from UPnP data
   */
  private generateDeviceId(description: UPnPDeviceDescription, ip: string): string {
    // Prefer UDN (Unique Device Name)
    if (description.UDN) {
      return `ssdp-${description.UDN.replace(/[^a-zA-Z0-9]/g, '-')}`
    }

    // Fallback to serial number
    if (description.serialNumber) {
      return `ssdp-${description.serialNumber}`
    }

    // Fallback to IP address
    return `ssdp-${ip.replace(/\./g, '-')}`
  }
}
