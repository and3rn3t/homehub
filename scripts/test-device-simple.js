#!/usr/bin/env node

/**
 * Quick Test - Single Shelly Device
 *
 * Simple script to test a single virtual Shelly device
 */

import cors from 'cors'
import express from 'express'

const app = express()
const port = 8001

// State
let deviceState = {
  enabled: false,
  lastUpdated: new Date(),
}

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', device: 'Test Shelly Device' })
})

app.get('/shelly', (req, res) => {
  res.json({
    name: 'Test Shelly Device',
    type: 'light',
    mac: 'AA:BB:CC:DD:EE:FF',
    model: 'Shelly Plus 1',
    gen: 2,
    fw_id: '1.0.0',
    app: 'Switch',
  })
})

app.get('/rpc/Switch.GetStatus', (req, res) => {
  const id = parseInt(req.query.id || '0')
  res.json({
    id,
    source: 'http',
    output: deviceState.enabled,
    apower: deviceState.enabled ? 15.5 : 0,
    voltage: 230.1,
    current: deviceState.enabled ? 0.067 : 0,
    temperature: {
      tC: 45.2,
      tF: 113.4,
    },
  })
})

app.post('/rpc/Switch.Set', (req, res) => {
  const on = req.query.on === 'true'
  const was_on = deviceState.enabled

  deviceState.enabled = on
  deviceState.lastUpdated = new Date()

  console.log(`State changed: ${was_on} → ${on}`)

  res.json({
    was_on,
  })
})

app.post('/rpc/Switch.Toggle', (req, res) => {
  const was_on = deviceState.enabled
  deviceState.enabled = !deviceState.enabled
  deviceState.lastUpdated = new Date()

  console.log(`Toggled: ${was_on} → ${deviceState.enabled}`)

  res.json({
    was_on,
  })
})

// Start server
app.listen(port, () => {
  console.log(`\n✅ Test Shelly Device Running`)
  console.log(`   URL: http://localhost:${port}`)
  console.log(`   State: ${deviceState.enabled ? 'ON' : 'OFF'}`)
  console.log(`\n📋 Test Commands:`)
  console.log(`   Get Info:   http://localhost:${port}/shelly`)
  console.log(`   Get Status: http://localhost:${port}/rpc/Switch.GetStatus?id=0`)
  console.log(`   Toggle:     POST http://localhost:${port}/rpc/Switch.Toggle?id=0`)
  console.log(`   Set ON:     POST http://localhost:${port}/rpc/Switch.Set?id=0&on=true`)
  console.log(`\n⏹️  Press Ctrl+C to stop\n`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...')
  process.exit(0)
})
