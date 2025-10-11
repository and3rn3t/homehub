import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  ActivityIcon,
  AlertTriangleIcon,
  BoltIcon,
  CheckCircleIcon,
  LightbulbIcon,
  PowerIcon,
  ShieldIcon,
  ThermometerIcon,
  WifiIcon,
  WifiOffIcon,
} from '@/lib/icons'
import type { Device } from '@/types'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

const deviceTypeIcons = {
  light: LightbulbIcon,
  thermostat: ThermometerIcon,
  security: ShieldIcon,
  sensor: WifiIcon,
}

interface RoomStatisticsProps {
  devices: Device[]
}

export function RoomStatistics({ devices }: RoomStatisticsProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const total = devices.length
    const online = devices.filter(d => d.status === 'online' && d.enabled).length
    const offline = devices.filter(d => d.status === 'offline').length
    const warning = devices.filter(d => d.status === 'warning').length
    const idle = devices.filter(d => d.status === 'online' && !d.enabled).length

    // Device type breakdown
    const byType = devices.reduce(
      (acc, device) => {
        acc[device.type] = (acc[device.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Power consumption (if available)
    const totalPower = devices
      .filter(d => d.enabled && d.unit === 'W')
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Low battery devices
    const lowBattery = devices.filter(d => d.batteryLevel && d.batteryLevel < 20).length

    // Weak signal devices
    const weakSignal = devices.filter(d => d.signalStrength && d.signalStrength < 30).length

    return {
      total,
      online,
      offline,
      warning,
      idle,
      byType,
      totalPower,
      lowBattery,
      weakSignal,
      onlinePercent: total > 0 ? (online / total) * 100 : 0,
    }
  }, [devices])

  return (
    <div className="space-y-4">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Devices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <Card variant="glass" className="border-blue-200/50 bg-blue-50/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <motion.p
                    className="text-2xl font-bold text-blue-700 tabular-nums"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    {stats.total}
                  </motion.p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200/50">
                  <ActivityIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Online Devices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
        >
          <Card variant="glass" className="border-green-200/50 bg-green-50/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">Active</p>
                  <motion.p
                    className="text-2xl font-bold text-green-700 tabular-nums"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.05 }}
                  >
                    {stats.online}
                  </motion.p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200/50">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Offline Devices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        >
          <Card variant="glass" className="border-red-200/50 bg-red-50/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">Offline</p>
                  <motion.p
                    className="text-2xl font-bold text-red-700 tabular-nums"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                  >
                    {stats.offline}
                  </motion.p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-200/50">
                  <WifiOffIcon className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Warning Devices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.15 }}
        >
          <Card variant="glass" className="border-yellow-200/50 bg-yellow-50/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">Issues</p>
                  <motion.p
                    className="text-2xl font-bold text-yellow-700 tabular-nums"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
                  >
                    {stats.warning + stats.lowBattery + stats.weakSignal}
                  </motion.p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-200/50">
                  <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Device Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Device Types</h3>
              <div className="space-y-3">
                {Object.entries(stats.byType).map(([type, count], index) => {
                  const Icon = deviceTypeIcons[type as keyof typeof deviceTypeIcons] || WifiIcon
                  const percentage = (count / stats.total) * 100
                  return (
                    <div key={type}>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="text-muted-foreground h-4 w-4" />
                          <span className="text-sm capitalize">{type}s</span>
                        </div>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{
                          type: 'spring',
                          stiffness: 100,
                          damping: 15,
                          delay: 0.3 + index * 0.1,
                        }}
                      >
                        <Progress value={percentage} className="h-2" />
                      </motion.div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Health & Power */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.25 }}
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold">System Health</h3>
              <div className="space-y-3">
                {/* Online Percentage */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Availability</span>
                    </div>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {stats.onlinePercent.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={stats.onlinePercent} className="h-2" />
                </div>

                {/* Power Consumption */}
                {stats.totalPower > 0 && (
                  <div className="border-border flex items-center justify-between rounded-lg border p-2">
                    <div className="flex items-center gap-2">
                      <BoltIcon className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Power Usage</span>
                    </div>
                    <Badge variant="outline" className="tabular-nums">
                      {stats.totalPower.toFixed(0)}W
                    </Badge>
                  </div>
                )}

                {/* Low Battery Alert */}
                {stats.lowBattery > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-2">
                    <div className="flex items-center gap-2">
                      <PowerIcon className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">Low Battery</span>
                    </div>
                    <Badge variant="destructive" className="tabular-nums">
                      {stats.lowBattery}
                    </Badge>
                  </div>
                )}

                {/* Weak Signal Alert */}
                {stats.weakSignal > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-2">
                    <div className="flex items-center gap-2">
                      <WifiOffIcon className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">Weak Signal</span>
                    </div>
                    <Badge variant="outline" className="border-yellow-300 tabular-nums">
                      {stats.weakSignal}
                    </Badge>
                  </div>
                )}

                {/* All Clear Message */}
                {stats.lowBattery === 0 && stats.weakSignal === 0 && stats.offline === 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">All systems operational</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
