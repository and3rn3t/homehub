/**
 * Protocol Detector
 *
 * Auto-identifies device types via HTTP endpoint fingerprinting.
 * Probes common API endpoints to determine device protocol and capabilities.
 */

import { logger } from '@/lib/logger'
import type { DeviceProtocol } from '@/types'
import type { DeviceCapability } from './types'

/**
 * Protocol detection result
 */
export interface ProtocolDetectionResult {
  /** Detected protocol */
  protocol: DeviceProtocol | null

  /** Device preset/type */
  preset?: 'shelly' | 'tplink' | 'hue' | 'generic'

  /** Detected capabilities */
  capabilities: DeviceCapability[]

  /** Confidence score (0-1) */
  confidence: number

  /** Device metadata from detection */
  metadata?: {
    model?: string
    firmware?: string
    manufacturer?: string
    deviceType?: string
  }
}

/**
 * Protocol fingerprint patterns
 */
interface ProtocolFingerprint {
  /** Protocol name */
  protocol: DeviceProtocol

  /** Device preset */
  preset: 'shelly' | 'tplink' | 'hue' | 'generic'

  /** Endpoints to probe (relative paths) */
  endpoints: string[]

  /** Expected response patterns (for detection) */
  patterns: {
    /** Response body contains this string */
    contains?: string[]
    /** Response has this JSON structure */
    jsonKeys?: string[]
    /** Response headers contain these */
    headers?: Record<string, string>
  }

  /** Capabilities to assign if detected */
  capabilities: DeviceCapability[]
}

/**
 * Known protocol fingerprints
 */
const PROTOCOL_FINGERPRINTS: ProtocolFingerprint[] = [
  // Shelly devices
  {
    protocol: 'http',
    preset: 'shelly',
    endpoints: ['/shelly', '/status', '/settings'],
    patterns: {
      contains: ['shelly', 'SHSW-'],
      jsonKeys: ['type', 'mac', 'fw', 'wifi_sta'],
    },
    capabilities: ['toggle', 'set_value'],
  },
  // TP-Link Kasa
  {
    protocol: 'http',
    preset: 'tplink',
    endpoints: ['/status', '/system'],
    patterns: {
      contains: ['TP-Link', 'Kasa', 'system'],
      jsonKeys: ['system', 'get_sysinfo'],
    },
    capabilities: ['toggle', 'set_value', 'set_color'],
  },
  // Philips Hue Bridge
  {
    protocol: 'hue',
    preset: 'hue',
    endpoints: ['/api/config', '/api', '/description.xml'],
    patterns: {
      contains: ['Philips hue', 'bridgeid', 'modelid'],
      jsonKeys: ['bridgeid', 'modelid', 'swversion'],
    },
    capabilities: ['toggle', 'dimming', 'color', 'color-temp'],
  },
]

export class ProtocolDetector {
  /**
   * Detect device protocol by probing HTTP endpoints
   */
  async detect(ip: string, port: number = 80): Promise<ProtocolDetectionResult> {
    logger.debug(`Detecting protocol for ${ip}:${port}...`)

    // Try each fingerprint pattern
    for (const fingerprint of PROTOCOL_FINGERPRINTS) {
      const result = await this.testFingerprint(ip, port, fingerprint)
      if (result.confidence > 0.5) {
        logger.debug(`Detected ${fingerprint.preset} (confidence: ${result.confidence.toFixed(2)})`)
        return result
      }
    }

    // No match found - return generic HTTP
    logger.debug('No specific protocol detected, defaulting to generic HTTP')
    return {
      protocol: 'http',
      preset: 'generic',
      capabilities: ['toggle'],
      confidence: 0.3,
    }
  }

  /**
   * Test a specific protocol fingerprint
   */
  private async testFingerprint(
    ip: string,
    port: number,
    fingerprint: ProtocolFingerprint
  ): Promise<ProtocolDetectionResult> {
    let maxConfidence = 0
    let detectedMetadata: ProtocolDetectionResult['metadata'] = {}

    // Test each endpoint
    for (const endpoint of fingerprint.endpoints) {
      try {
        const url = `http://${ip}:${port}${endpoint}`
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        })

        if (!response.ok) continue

        const contentType = response.headers.get('content-type') || ''
        const text = await response.text()

        // Calculate confidence based on pattern matches
        const confidence = this.calculateConfidence(text, contentType, fingerprint.patterns)

        if (confidence > maxConfidence) {
          maxConfidence = confidence
          detectedMetadata = this.extractMetadata(text, contentType, fingerprint.preset)
        }
      } catch {
        // Endpoint not available or timeout
        continue
      }
    }

    return {
      protocol: fingerprint.protocol,
      preset: fingerprint.preset,
      capabilities: fingerprint.capabilities,
      confidence: maxConfidence,
      metadata:
        detectedMetadata && Object.keys(detectedMetadata).length > 0 ? detectedMetadata : undefined,
    }
  }

  /**
   * Calculate confidence score from response patterns
   */
  private calculateConfidence(
    responseText: string,
    contentType: string,
    patterns: ProtocolFingerprint['patterns']
  ): number {
    let score = 0
    const responseLower = responseText.toLowerCase()

    // Check for string patterns
    if (patterns.contains) {
      const matchCount = patterns.contains.filter(pattern =>
        responseLower.includes(pattern.toLowerCase())
      ).length
      score += (matchCount / patterns.contains.length) * 0.5
    }

    // Check for JSON structure
    if (patterns.jsonKeys && contentType.includes('application/json')) {
      try {
        const json = JSON.parse(responseText)
        const keyMatchCount = patterns.jsonKeys.filter(key => key in json).length
        score += (keyMatchCount / patterns.jsonKeys.length) * 0.5
      } catch {
        // Not valid JSON
      }
    }

    return Math.min(score, 1.0)
  }

  /**
   * Extract device metadata from response
   */
  private extractMetadata(
    responseText: string,
    contentType: string,
    preset: string
  ): ProtocolDetectionResult['metadata'] {
    if (!contentType.includes('application/json')) {
      return {}
    }

    try {
      const json = JSON.parse(responseText)

      // Shelly-specific
      if (preset === 'shelly') {
        return {
          model: json.type || json.device?.type,
          firmware: json.fw || json.fw_version,
          manufacturer: 'Shelly',
          deviceType: json.type,
        }
      }

      // TP-Link-specific
      if (preset === 'tplink') {
        const sysinfo = json.system?.get_sysinfo || json
        return {
          model: sysinfo.model,
          firmware: sysinfo.sw_ver,
          manufacturer: 'TP-Link',
          deviceType: sysinfo.mic_type,
        }
      }

      // Hue-specific
      if (preset === 'hue') {
        return {
          model: json.modelid,
          firmware: json.swversion,
          manufacturer: 'Signify (Philips Hue)',
          deviceType: 'bridge',
        }
      }

      return {}
    } catch {
      return {}
    }
  }

  /**
   * Batch detect protocols for multiple devices
   */
  async detectBatch(
    devices: Array<{ ip: string; port?: number }>
  ): Promise<Map<string, ProtocolDetectionResult>> {
    const results = new Map<string, ProtocolDetectionResult>()

    const promises = devices.map(async device => {
      const key = `${device.ip}:${device.port || 80}`
      const result = await this.detect(device.ip, device.port)
      return { key, result }
    })

    const settled = await Promise.allSettled(promises)

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.set(result.value.key, result.value.result)
      }
    }

    return results
  }
}

// Singleton instance
export const protocolDetector = new ProtocolDetector()
