#!/usr/bin/env node

/**
 * Virtual HTTP Device Server
 *
 * Creates mock HTTP/REST devices for testing HTTPDeviceAdapter.
 * Simulates Shelly Gen2, TPLink Kasa, and generic REST APIs.
 *
 * Usage:
 *   node scripts/http-virtual-device.js --port 8001 --name "Living Room Light" --type shelly
 *   node scripts/launch-http-devices.js --preset full-house
 */

import cors from 'cors'
import express from 'express'

/**
 * Virtual HTTP Device
 */
class VirtualHTTPDevice {
  constructor(config) {
    this.config = {
      port: config.port || 8001,
      name: config.name || 'Virtual Device',
      type: config.type || 'light',
      preset: config.preset || 'shelly', // shelly, tplink, hue, generic
      deviceId: config.deviceId || '0',
      mac: config.mac || this.generateMAC(),
    }

    this.state = {
      enabled: false,
      value: 0, // brightness, temperature, etc.
      lastUpdated: new Date(),
    }

    this.app = express()
    this.app.use(cors())
    this.app.use(express.json())

    this.setupRoutes()
  }

  /**
   * Generate random MAC address
   */
  generateMAC() {
    return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => {
      return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16))
    })
  }

  /**
   * Setup HTTP routes based on preset
   */
  setupRoutes() {
    switch (this.config.preset) {
      case 'shelly':
        this.setupShellyRoutes()
        break
      case 'tplink':
        this.setupTPLinkRoutes()
        break
      case 'hue':
        this.setupHueRoutes()
        break
      case 'generic':
      default:
        this.setupGenericRoutes()
        break
    }

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', device: this.config.name })
    })
  }

  /**
   * Shelly Gen2 API routes
   */
  setupShellyRoutes() {
    // Device info
    this.app.get('/shelly', (req, res) => {
      res.json({
        name: this.config.name,
        type: this.config.type,
        mac: this.config.mac,
        model: 'Shelly Plus 1',
        gen: 2,
        fw_id: '1.0.0',
        app: 'Switch',
      })
    })

    // Get switch status
    this.app.get('/rpc/Switch.GetStatus', (req, res) => {
      const id = parseInt(req.query.id || '0')
      res.json({
        id,
        source: 'http',
        output: this.state.enabled,
        apower: this.state.enabled ? 15.5 : 0,
        voltage: 230.1,
        current: this.state.enabled ? 0.067 : 0,
        temperature: {
          tC: 45.2,
          tF: 113.4,
        },
      })
    })

    // Set switch state
    this.app.post('/rpc/Switch.Set', (req, res) => {
      const on = req.query.on === 'true'
      const was_on = this.state.enabled

      this.state.enabled = on
      this.state.lastUpdated = new Date()

      console.log(`[${this.config.name}] State changed: ${was_on} → ${on}`)

      res.json({
        was_on,
      })
    })

    // Toggle switch
    this.app.post('/rpc/Switch.Toggle', (req, res) => {
      const was_on = this.state.enabled
      this.state.enabled = !this.state.enabled
      this.state.lastUpdated = new Date()

      console.log(`[${this.config.name}] Toggled: ${was_on} → ${this.state.enabled}`)

      res.json({
        was_on,
      })
    })

    console.log(`[${this.config.name}] Shelly API routes registered`)
  }

  /**
   * TPLink Kasa API routes
   */
  setupTPLinkRoutes() {
    // System info
    this.app.get('/api/system/get_sysinfo', (req, res) => {
      res.json({
        sw_ver: '1.0.0',
        hw_ver: '1.0',
        model: 'HS100(US)',
        deviceId: this.config.mac,
        alias: this.config.name,
        relay_state: this.state.enabled ? 1 : 0,
        on_time: this.state.enabled ? 3600 : 0,
        feature: 'TIM',
        updating: 0,
        rssi: -45,
      })
    })

    // Set relay state
    this.app.post('/api/system/set_relay_state', (req, res) => {
      const state = req.body.state === 1
      const was_on = this.state.enabled

      this.state.enabled = state
      this.state.lastUpdated = new Date()

      console.log(`[${this.config.name}] State changed: ${was_on} → ${state}`)

      res.json({
        err_code: 0,
      })
    })

    console.log(`[${this.config.name}] TPLink API routes registered`)
  }

  /**
   * Philips Hue API routes
   */
  setupHueRoutes() {
    // Get light info
    this.app.get(`/api/lights/${this.config.deviceId}`, (req, res) => {
      res.json({
        state: {
          on: this.state.enabled,
          bri: Math.round((this.state.value / 100) * 254),
          hue: 8418,
          sat: 140,
          effect: 'none',
          ct: 366,
          alert: 'none',
          colormode: 'ct',
          reachable: true,
        },
        type: 'Extended color light',
        name: this.config.name,
        modelid: 'LCT007',
        manufacturername: 'Philips',
        uniqueid: this.config.mac,
        swversion: '5.127.1.26581',
      })
    })

    // Set light state
    this.app.put(`/api/lights/${this.config.deviceId}/state`, (req, res) => {
      const { on, bri, hue, sat, ct } = req.body

      if (on !== undefined) {
        this.state.enabled = on
      }
      if (bri !== undefined) {
        this.state.value = Math.round((bri / 254) * 100)
      }

      this.state.lastUpdated = new Date()

      console.log(`[${this.config.name}] State updated:`, { on, bri, hue, sat, ct })

      res.json([
        { success: { [`/lights/${this.config.deviceId}/state/on`]: on } },
        { success: { [`/lights/${this.config.deviceId}/state/bri`]: bri } },
      ])
    })

    console.log(`[${this.config.name}] Hue API routes registered`)
  }

  /**
   * Generic REST API routes
   */
  setupGenericRoutes() {
    // List devices
    this.app.get('/api/devices', (req, res) => {
      res.json([
        {
          id: this.config.deviceId,
          name: this.config.name,
          type: this.config.type,
          capabilities: ['toggle', 'set_value'],
        },
      ])
    })

    // Get device status
    this.app.get(`/api/devices/${this.config.deviceId}/status`, (req, res) => {
      res.json({
        enabled: this.state.enabled,
        value: this.state.value,
        status: 'online',
        lastUpdated: this.state.lastUpdated,
      })
    })

    // Send device command
    this.app.post(`/api/devices/${this.config.deviceId}/command`, (req, res) => {
      const { command, value } = req.body

      if (command === 'toggle') {
        this.state.enabled = !this.state.enabled
      } else if (command === 'set_value') {
        this.state.enabled = value > 0
        this.state.value = value
      }

      this.state.lastUpdated = new Date()

      console.log(`[${this.config.name}] Command executed:`, command, value)

      res.json({
        success: true,
        state: {
          enabled: this.state.enabled,
          value: this.state.value,
        },
      })
    })

    console.log(`[${this.config.name}] Generic API routes registered`)
  }

  /**
   * Start HTTP server
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log(`\n✅ Virtual HTTP Device Started`)
        console.log(`   Name: ${this.config.name}`)
        console.log(`   Type: ${this.config.type}`)
        console.log(`   Preset: ${this.config.preset}`)
        console.log(`   URL: http://localhost:${this.config.port}`)
        console.log(`   Device ID: ${this.config.deviceId}`)
        console.log(`   MAC: ${this.config.mac}\n`)
        resolve()
      })

      this.server.on('error', reject)
    })
  }

  /**
   * Stop HTTP server
   */
  stop() {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          console.log(`[${this.config.name}] Stopped`)
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}

// CLI usage - always run when script is executed
const args = process.argv.slice(2)
if (args.length > 0) {
  const config = {}

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '')
    const value = args[i + 1]
    config[key] = isNaN(value) ? value : parseInt(value)
  }

  const device = new VirtualHTTPDevice(config)

  device.start().catch(error => {
    console.error('Failed to start device:', error)
    process.exit(1)
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...')
    await device.stop()
    process.exit(0)
  })
}

export { VirtualHTTPDevice }
