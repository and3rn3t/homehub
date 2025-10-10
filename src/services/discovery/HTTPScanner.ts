/**
 * HTTP Network Scanner
 *
 * Discovers devices by probing HTTP endpoints on the local network.
 * Checks for known device API endpoints (Shelly, TP-Link, etc.)
 */

import type { DiscoveredDevice, DiscoveryScanner, DiscoveryScanOptions } from './types'

export class HTTPScanner implements DiscoveryScanner {
  name = 'HTTP Scanner'
  protocols: 'http'[] = ['http']

  /**
   * Scan network for HTTP devices
   */
  async scan(options?: DiscoveryScanOptions): Promise<DiscoveredDevice[]> {
    const {
      ipRange = '192.168.1.0/24',
      ports = [80, 8080, 443, 8081, 8001], // Include 8001 for virtual device
      timeout = 2000,
      maxConcurrent = 10,
    } = options || {}

    const devices: DiscoveredDevice[] = []
    const ips = this.expandIPRange(ipRange)

    console.log(`[HTTPScanner] Scanning ${ips.length} IPs on ports ${ports.join(', ')}`)

    // Scan in batches to avoid overwhelming the network
    for (let i = 0; i < ips.length; i += maxConcurrent) {
      const batch = ips.slice(i, i + maxConcurrent)
      const batchPromises = batch.flatMap(ip =>
        ports.map(port => this.probeDevice(ip, port, timeout))
      )

      const results = await Promise.allSettled(batchPromises)
      const foundDevices = results
        .filter(
          (r): r is PromiseFulfilledResult<DiscoveredDevice | null> => r.status === 'fulfilled'
        )
        .map(r => r.value)
        .filter((d): d is DiscoveredDevice => d !== null)

      devices.push(...foundDevices)

      console.log(
        `[HTTPScanner] Progress: ${i + batch.length}/${ips.length} IPs scanned, ${devices.length} devices found`
      )
    }

    console.log(`[HTTPScanner] Scan complete: ${devices.length} devices found`)
    return devices
  }

  /**
   * Probe a single device at IP:port
   */
  private async probeDevice(
    ip: string,
    port: number,
    timeout: number
  ): Promise<DiscoveredDevice | null> {
    const baseUrl = `http://${ip}:${port}`

    // Try Shelly endpoint first
    try {
      const shellyInfo = await this.fetchWithTimeout(`${baseUrl}/shelly`, timeout)
      if (shellyInfo && typeof shellyInfo === 'object') {
        return this.parseShellyDevice(shellyInfo, ip, port)
      }
    } catch {
      // Not a Shelly device or unreachable
    }

    // Try TP-Link endpoint
    try {
      const tplinkInfo = await this.fetchWithTimeout(`${baseUrl}/api/system/info`, timeout)
      if (tplinkInfo && typeof tplinkInfo === 'object') {
        return this.parseTPLinkDevice(tplinkInfo, ip, port)
      }
    } catch {
      // Not a TP-Link device
    }

    // Try Philips Hue bridge
    try {
      const hueInfo = await this.fetchWithTimeout(`${baseUrl}/api/config`, timeout)
      if (hueInfo && typeof hueInfo === 'object' && hueInfo.bridgeid) {
        return this.parseHueDevice(hueInfo, ip, port)
      }
    } catch {
      // Not a Hue bridge
    }

    // Try generic HTTP device detection
    try {
      const response = await this.fetchWithTimeout(`${baseUrl}/`, timeout)
      if (response && typeof response === 'object') {
        return this.parseGenericDevice(response, ip, port)
      }
    } catch {
      // Not reachable or not an HTTP device
    }

    return null
  }

  /**
   * Parse Shelly device info
   */
  private parseShellyDevice(
    info: Record<string, unknown>,
    ip: string,
    port: number
  ): DiscoveredDevice {
    let firmware: string | undefined
    if (info.fw_id) {
      firmware = String(info.fw_id)
    } else if (info.fw) {
      firmware = String(info.fw)
    }

    return {
      id: String(info.mac || `shelly-${ip.replace(/\./g, '-')}`),
      name: String(info.name || info.type || 'Shelly Device'),
      type: this.getShellyDeviceType(String(info.type || '')),
      protocol: 'http',
      capabilities: this.getShellyCapabilities(String(info.type || '')),
      metadata: {
        ip,
        port,
        preset: 'shelly',
        mac: info.mac ? String(info.mac) : undefined,
        model: info.type ? String(info.type) : undefined,
        firmware,
        manufacturer: 'Shelly',
        discoveryMethod: 'http',
        raw: info,
      },
    }
  }

  /**
   * Parse TP-Link device info
   */
  private parseTPLinkDevice(
    info: Record<string, unknown>,
    ip: string,
    port: number
  ): DiscoveredDevice {
    return {
      id: String(info.mac || `tplink-${ip.replace(/\./g, '-')}`),
      name: String(info.alias || info.model || 'TP-Link Device'),
      type: 'light', // Most TP-Link devices are lights/plugs
      protocol: 'http',
      capabilities: ['toggle', 'set_value'],
      metadata: {
        ip,
        port,
        preset: 'tplink',
        mac: info.mac ? String(info.mac) : undefined,
        model: info.model ? String(info.model) : undefined,
        firmware: info.sw_ver ? String(info.sw_ver) : undefined,
        manufacturer: 'TP-Link',
        discoveryMethod: 'http',
        raw: info,
      },
    }
  }

  /**
   * Parse Philips Hue bridge info
   */
  private parseHueDevice(
    info: Record<string, unknown>,
    ip: string,
    port: number
  ): DiscoveredDevice {
    return {
      id: String(info.bridgeid || `hue-${ip.replace(/\./g, '-')}`),
      name: String(info.name || 'Philips Hue Bridge'),
      type: 'light', // Bridge manages lights
      protocol: 'http',
      capabilities: ['toggle', 'set_value', 'set_color'],
      metadata: {
        ip,
        port,
        preset: 'hue',
        mac: info.mac ? String(info.mac) : undefined,
        model: info.modelid ? String(info.modelid) : undefined,
        firmware: info.swversion ? String(info.swversion) : undefined,
        manufacturer: 'Philips',
        discoveryMethod: 'http',
        raw: info,
      },
    }
  }

  /**
   * Parse generic HTTP device
   */
  private parseGenericDevice(
    response: Record<string, unknown>,
    ip: string,
    port: number
  ): DiscoveredDevice | null {
    // Only return generic device if response looks device-like
    if (!response || typeof response !== 'object') {
      return null
    }

    return {
      id: `generic-${ip.replace(/\./g, '-')}-${port}`,
      name: `HTTP Device (${ip}:${port})`,
      type: 'light', // Default to light
      protocol: 'http',
      capabilities: ['toggle'],
      metadata: {
        ip,
        port,
        preset: 'generic',
        discoveryMethod: 'http',
        raw: response,
      },
    }
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    timeout: number
  ): Promise<Record<string, unknown> | string | null> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) return null

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return await response.json()
      }

      return await response.text()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Expand IP range from CIDR notation
   */
  private expandIPRange(cidr: string): string[] {
    const parts = cidr.split('/')
    const baseIP = parts[0]
    const prefixStr = parts[1]

    if (!baseIP || !prefixStr) {
      console.warn(`[HTTPScanner] Invalid CIDR notation: ${cidr}`)
      return []
    }

    const prefix = parseInt(prefixStr, 10)

    // For /32 (single host)
    if (prefix === 32) {
      return [baseIP]
    }

    // For /24 networks (most common)
    if (prefix === 24) {
      const [oct1, oct2, oct3] = baseIP.split('.').map(Number)
      const ips: string[] = []
      for (let i = 1; i < 255; i++) {
        // Skip .0 and .255
        ips.push(`${oct1}.${oct2}.${oct3}.${i}`)
      }
      return ips
    }

    // For now, only support /24 and /32 networks
    // Future: Add support for other CIDR ranges
    console.warn(`[HTTPScanner] Only /24 and /32 networks supported, got /${prefix}`)
    return []
  }

  /**
   * Get Shelly device type
   */
  private getShellyDeviceType(type: string): 'light' | 'sensor' {
    if (type?.toLowerCase().includes('dimmer') || type?.toLowerCase().includes('rgbw')) {
      return 'light'
    }
    if (type?.toLowerCase().includes('sensor') || type?.toLowerCase().includes('ht')) {
      return 'sensor'
    }
    return 'light' // Default for relays/switches (treat as lights)
  }

  /**
   * Get Shelly capabilities
   */
  private getShellyCapabilities(type: string): Array<'toggle' | 'set_value'> {
    const caps: Array<'toggle' | 'set_value'> = ['toggle']

    if (type?.toLowerCase().includes('dimmer') || type?.toLowerCase().includes('rgbw')) {
      caps.push('set_value')
    }

    return caps
  }
}
