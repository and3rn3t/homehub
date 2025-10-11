/**
 * Device Discovery Component
 *
 * Dialog for scanning and adding discovered devices via multiple protocols.
 * Supports HTTP, mDNS, and SSDP discovery methods.
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { KV_KEYS } from '@/constants'
import { useKV } from '@/hooks/use-kv'
import type { DiscoveredDevice } from '@/services/discovery'
import { discoveryManager } from '@/services/discovery'
import type { Device } from '@/types'
import { CheckCircleIcon, MagnifyingGlass, WifiIcon, XCircleIcon } from '@/lib/icons'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'

interface DeviceDiscoveryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDevicesAdded?: (devices: Device[]) => void
}

interface ScanProgress {
  protocol: string
  status: 'pending' | 'scanning' | 'complete'
  found: number
}

export function DeviceDiscovery({
  open,
  onOpenChange,
  onDevicesAdded,
}: Readonly<DeviceDiscoveryProps>) {
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scanProgress, setScanProgress] = useState<ScanProgress[]>([])
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([])
  // Read existing devices to check for duplicates (read-only, skip initial load to avoid conflicts)
  const [devices] = useKV<Device[]>(KV_KEYS.DEVICES, [], { skipInitialLoad: true })

  const startScan = async () => {
    setScanning(true)
    setProgress(0)
    setDiscoveredDevices([])

    // Initialize scan progress for each scanner
    const availableScanners = discoveryManager.getAvailableScanners()
    setScanProgress(
      availableScanners.map(scanner => ({
        protocol: scanner,
        status: 'pending',
        found: 0,
      }))
    )

    try {
      // Simulate progress (actual progress tracking requires callback support)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 8, 90))
      }, 800)

      // Update scanner status as they run
      setScanProgress(prev => prev.map((p, i) => (i === 0 ? { ...p, status: 'scanning' } : p)))

      const found = await discoveryManager.discoverDevices({
        ipRange: '127.0.0.1/32', // Start with localhost only
        ports: [8001, 8080, 80, 443],
        timeout: 3000,
        maxConcurrent: 5,
      })

      clearInterval(progressInterval)
      setProgress(100)

      // Mark all scanners as complete
      setScanProgress(prev =>
        prev.map(p => ({
          ...p,
          status: 'complete',
          found: found.filter(d => d.metadata.discoveryMethod === p.protocol.toLowerCase()).length,
        }))
      )

      setDiscoveredDevices(found)

      const message =
        found.length === 0
          ? 'No devices found'
          : `Found ${found.length} device${found.length !== 1 ? 's' : ''}`
      toast.success(message, {
        description: `Scanned via ${availableScanners.join(', ')}`,
      })
    } catch (error) {
      console.error('[DeviceDiscovery] Scan failed:', error)
      toast.error('Discovery scan failed')
      setScanProgress(prev => prev.map(p => ({ ...p, status: 'complete' })))
    } finally {
      setScanning(false)
    }
  }

  const addDevice = (discovered: DiscoveredDevice) => {
    // Convert discovered device to Device format
    const newDevice: Device = {
      id: discovered.id,
      name: discovered.name,
      type: discovered.type,
      room: 'Unassigned',
      status: 'online',
      enabled: false,
      protocol: discovered.protocol,
      config: {
        httpEndpoint: `http://${discovered.metadata.ip}:${discovered.metadata.port}`,
        httpPreset: discovered.metadata.preset as 'shelly' | 'tplink' | 'hue' | 'generic',
      },
    }

    // Check if device already exists
    const exists = devices.some(d => d.id === newDevice.id)
    if (exists) {
      toast.error('Device already added')
      return
    }

    toast.success(`Added ${discovered.name}`)

    // Remove from discovered list
    setDiscoveredDevices(prev => prev.filter(d => d.id !== discovered.id))

    // Notify parent to add the device (parent manages the KV store)
    onDevicesAdded?.([newDevice])
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after dialog closes
    setTimeout(() => {
      setDiscoveredDevices([])
      setProgress(0)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MagnifyingGlass weight="bold" className="h-5 w-5" />
            Device Discovery
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Scan Control */}
          <div className="flex items-center gap-3">
            <Button onClick={startScan} disabled={scanning} className="w-full">
              {scanning ? 'Scanning...' : 'Start Scan'}
            </Button>
          </div>

          {/* Progress Bar */}
          {scanning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Progress value={progress} />
              <p className="text-muted-foreground text-center text-sm">
                Scanning network... {progress}%
              </p>

              {/* Scanner Status */}
              {scanProgress.length > 0 && (
                <div className="bg-muted/20 space-y-2 rounded-lg border p-3">
                  {scanProgress.map(scanner => (
                    <div key={scanner.protocol} className="flex items-center gap-2 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center">
                        {scanner.status === 'complete' ? (
                          <CheckCircle weight="fill" className="h-4 w-4 text-green-500" />
                        ) : scanner.status === 'scanning' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <WifiHigh weight="bold" className="h-4 w-4 text-blue-500" />
                          </motion.div>
                        ) : (
                          <div className="bg-muted-foreground/30 h-2 w-2 rounded-full" />
                        )}
                      </div>
                      <span className="flex-1 font-medium">{scanner.protocol}</span>
                      {scanner.found > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {scanner.found} found
                        </Badge>
                      )}
                      {scanner.status === 'scanning' && (
                        <span className="text-muted-foreground text-xs">Scanning...</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Results */}
          {discoveredDevices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h3 className="text-muted-foreground text-sm font-medium">
                Found {discoveredDevices.length} device{discoveredDevices.length !== 1 ? 's' : ''}
              </h3>

              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {discoveredDevices.map(device => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{device.name}</div>
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <span>
                          {device.metadata.ip}:{device.metadata.port}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {device.metadata.discoveryMethod.toUpperCase()}
                        </Badge>
                      </div>
                      {(device.metadata.model || device.metadata.manufacturer) && (
                        <div className="text-muted-foreground mt-1 text-xs">
                          {device.metadata.manufacturer} {device.metadata.model}
                        </div>
                      )}
                    </div>

                    <Button size="sm" onClick={() => addDevice(device)}>
                      Add
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No Results */}
          {!scanning && discoveredDevices.length === 0 && progress === 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground py-8 text-center"
            >
              <XCircle className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>No devices found</p>
              <p className="mt-1 text-sm">Try scanning again or check your network</p>
            </motion.div>
          )}

          {/* Initial State */}
          {!scanning && discoveredDevices.length === 0 && progress === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              <CheckCircle className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>Click &quot;Start Scan&quot; to discover devices</p>
              <p className="mt-1 text-sm">Scanning localhost (127.0.0.1) for testing</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
