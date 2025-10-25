/**
 * AutomationMonitor Component
 * 7-Day Stability Monitoring Dashboard
 *
 * Tracks automation reliability, performance, and health metrics
 *
 * @author HomeHub Team
 * @date October 13, 2025
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useKV } from '@/hooks/use-kv'
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  XCircleIcon,
} from '@/lib/icons'
import { useEffect, useState } from 'react'

// ===================================================================
// TYPES
// ===================================================================

interface AutomationMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  errorRate: number
  uptimePercentage: number
  lastExecutionTime: Date | null
  commonErrors: Array<{ error: string; count: number }>
}

interface DeviceHealth {
  online: number
  offline: number
  warning: number
  total: number
}

interface MonitoringDataPoint {
  timestamp: Date
  metrics: AutomationMetrics
  activeAutomations: number
  deviceHealth: DeviceHealth
}

// ===================================================================
// COMPONENT
// ===================================================================

export function AutomationMonitor() {
  const [monitoringData, setMonitoringData] = useKV<MonitoringDataPoint[]>(
    'automation-monitoring',
    []
  )
  const [isCollecting, setIsCollecting] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Collect metrics every 5 minutes
  useEffect(() => {
    // Initial collection
    void collectMetrics()

    // Set up interval
    const interval = setInterval(
      () => {
        void collectMetrics()
      },
      5 * 60 * 1000
    ) // 5 minutes

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const collectMetrics = async () => {
    setIsCollecting(true)

    try {
      const dataPoint = await collectCurrentMetrics()
      setMonitoringData(prev => {
        // Keep only last 7 days of data
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const recentData = prev.filter(d => new Date(d.timestamp).getTime() > sevenDaysAgo)
        return [...recentData, dataPoint]
      })
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to collect metrics:', error)
    } finally {
      setIsCollecting(false)
    }
  }

  const exportData = () => {
    const csv = convertToCSV(monitoringData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `automation-metrics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate 7-day statistics
  const last7Days = monitoringData.filter(
    d => Date.now() - new Date(d.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
  )

  const avgSuccessRate =
    last7Days.length > 0
      ? last7Days.reduce(
          (sum, m) =>
            sum +
            (m.metrics.totalExecutions > 0
              ? m.metrics.successfulExecutions / m.metrics.totalExecutions
              : 1),
          0
        ) / last7Days.length
      : 0

  const totalExecutions = last7Days.reduce((sum, m) => sum + m.metrics.totalExecutions, 0)

  const avgResponseTime =
    last7Days.length > 0
      ? last7Days.reduce((sum, m) => sum + m.metrics.averageExecutionTime, 0) / last7Days.length
      : 0

  const currentUptime =
    last7Days.length > 0 ? last7Days[last7Days.length - 1]?.metrics.uptimePercentage : 0

  const latestDeviceHealth =
    last7Days.length > 0 ? last7Days[last7Days.length - 1]?.deviceHealth : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Monitoring</h2>
          <p className="text-muted-foreground text-sm">
            7-day stability and performance metrics
            {lastUpdate && ` • Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={collectMetrics} disabled={isCollecting}>
            <RefreshCwIcon className={`mr-2 h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
            {isCollecting ? 'Collecting...' : 'Refresh'}
          </Button>
          <Button variant="outline" onClick={exportData} disabled={monitoringData.length === 0}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Success Rate"
          value={`${(avgSuccessRate * 100).toFixed(1)}%`}
          target="≥99.5%"
          status={
            avgSuccessRate >= 0.995 ? 'success' : avgSuccessRate >= 0.95 ? 'warning' : 'error'
          }
          icon={CheckCircleIcon}
        />
        <StatCard
          title="Total Executions"
          value={totalExecutions.toLocaleString()}
          target="100+"
          status={totalExecutions >= 100 ? 'success' : 'warning'}
          icon={ActivityIcon}
        />
        <StatCard
          title="Avg Response Time"
          value={`${Math.round(avgResponseTime)}ms`}
          target="<500ms"
          status={avgResponseTime < 500 ? 'success' : avgResponseTime < 1000 ? 'warning' : 'error'}
          icon={ClockIcon}
        />
        <StatCard
          title="Uptime"
          value={currentUptime !== undefined ? `${currentUptime.toFixed(2)}%` : '0.00%'}
          target="≥99.9%"
          status={
            currentUptime === undefined
              ? 'warning'
              : currentUptime >= 99.9
                ? 'success'
                : currentUptime >= 99
                  ? 'warning'
                  : 'error'
          }
          icon={TrendingUpIcon}
        />
      </div>

      {/* Device Health */}
      {latestDeviceHealth && (
        <Card>
          <CardHeader>
            <CardTitle>Device Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{latestDeviceHealth.online}</div>
                <div className="text-muted-foreground text-sm">Online</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{latestDeviceHealth.offline}</div>
                <div className="text-muted-foreground text-sm">Offline</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {latestDeviceHealth.warning}
                </div>
                <div className="text-muted-foreground text-sm">Warning</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{latestDeviceHealth.total}</div>
                <div className="text-muted-foreground text-sm">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common Errors */}
      {(() => {
        const lastDay = last7Days.length > 0 ? last7Days[last7Days.length - 1] : null
        const hasErrors = lastDay?.metrics?.commonErrors && lastDay.metrics.commonErrors.length > 0
        return (
          hasErrors && (
            <Card>
              <CardHeader>
                <CardTitle>Common Errors (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lastDay?.metrics.commonErrors.map((error, index) => (
                    <div
                      key={index}
                      className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                        <span className="text-sm">{error.error}</span>
                      </div>
                      <Badge variant="destructive">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        )
      })()}

      {/* No Data State */}
      {monitoringData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangleIcon className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No Monitoring Data Yet</h3>
            <p className="text-muted-foreground mb-4 text-center text-sm">
              Metrics will be collected automatically every 5 minutes.
              <br />
              Click "Refresh" to collect data now.
            </p>
            <Button onClick={collectMetrics}>
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Collect First Data Point
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ===================================================================
// SUB-COMPONENTS
// ===================================================================

interface StatCardProps {
  title: string
  value: string
  target: string
  status: 'success' | 'warning' | 'error'
  icon: React.ComponentType<{ className?: string }>
}

function StatCard({ title, value, target, status, icon: Icon }: StatCardProps) {
  const statusColors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${statusColors[status].split(' ')[0]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground text-xs">Target: {target}</p>
        <Badge
          variant={
            status === 'success' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'
          }
          className="mt-2"
        >
          {status === 'success' ? 'On Track' : status === 'warning' ? 'Below Target' : 'Critical'}
        </Badge>
      </CardContent>
    </Card>
  )
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

async function collectCurrentMetrics(): Promise<MonitoringDataPoint> {
  // Collect real metrics from automation services and device state
  const { KV_KEYS } = await import('@/constants')

  try {
    // Get current automations and devices from KV store
    const automationsKey = KV_KEYS.AUTOMATIONS
    const devicesKey = KV_KEYS.DEVICES

    // Note: We can't use hooks outside components, so we'll fetch from localStorage directly
    const automationsData = localStorage.getItem(`homehub:${automationsKey}`)
    const devicesData = localStorage.getItem(`homehub:${devicesKey}`)

    const automations = automationsData ? JSON.parse(automationsData) : []
    const devices = devicesData ? JSON.parse(devicesData) : []

    // Count active automations (enabled)
    const activeAutomations = automations.filter((a: { enabled: boolean }) => a.enabled).length

    // Calculate device health
    const onlineDevices = devices.filter((d: { status: string }) => d.status === 'online').length
    const offlineDevices = devices.filter((d: { status: string }) => d.status === 'offline').length
    const warningDevices = devices.filter((d: { status: string }) => d.status === 'warning').length

    const deviceHealth: DeviceHealth = {
      online: onlineDevices,
      offline: offlineDevices,
      warning: warningDevices,
      total: devices.length,
    }

    // Get execution history from localStorage (if available)
    const executionHistoryData = localStorage.getItem('homehub:automation-execution-history')
    const executionHistory = executionHistoryData ? JSON.parse(executionHistoryData) : []

    // Calculate metrics from last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const recentExecutions = executionHistory.filter(
      (ex: { timestamp: string }) => new Date(ex.timestamp).getTime() > oneDayAgo
    )

    const totalExecutions = recentExecutions.length
    const successfulExecutions = recentExecutions.filter(
      (ex: { success: boolean }) => ex.success
    ).length
    const failedExecutions = totalExecutions - successfulExecutions

    // Calculate average execution time
    const executionTimes = recentExecutions
      .filter((ex: { duration?: number }) => ex.duration)
      .map((ex: { duration: number }) => ex.duration)
    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((a: number, b: number) => a + b, 0) / executionTimes.length
        : 0

    // Calculate error rate
    const errorRate = totalExecutions > 0 ? failedExecutions / totalExecutions : 0

    // Calculate uptime (based on successful executions)
    const uptimePercentage =
      totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 100

    // Get common errors
    const errors = recentExecutions
      .filter((ex: { success: boolean; error?: string }) => !ex.success && ex.error)
      .map((ex: { error: string }) => ex.error)

    const errorCounts = errors.reduce((acc: Record<string, number>, error: string) => {
      acc[error] = (acc[error] || 0) + 1
      return acc
    }, {})

    const commonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 errors

    // Get last execution time
    const lastExecution =
      recentExecutions.length > 0 ? recentExecutions[recentExecutions.length - 1] : null
    const lastExecutionTime = lastExecution ? new Date(lastExecution.timestamp) : null

    const metrics: AutomationMetrics = {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      errorRate,
      uptimePercentage,
      lastExecutionTime,
      commonErrors,
    }

    return {
      timestamp: new Date(),
      metrics,
      activeAutomations,
      deviceHealth,
    }
  } catch (error) {
    console.error('Failed to collect real metrics, using defaults:', error)

    // Fallback to default values on error
    const metrics: AutomationMetrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      errorRate: 0,
      uptimePercentage: 100,
      lastExecutionTime: null,
      commonErrors: [],
    }

    return {
      timestamp: new Date(),
      metrics,
      activeAutomations: 0,
      deviceHealth: {
        online: 0,
        offline: 0,
        warning: 0,
        total: 0,
      },
    }
  }
}

function convertToCSV(data: MonitoringDataPoint[]): string {
  if (data.length === 0) return ''

  const headers = [
    'Timestamp',
    'Total Executions',
    'Successful',
    'Failed',
    'Success Rate %',
    'Avg Response Time (ms)',
    'Uptime %',
    'Active Automations',
    'Devices Online',
    'Devices Offline',
    'Devices Warning',
  ]

  const rows = data.map(d => [
    new Date(d.timestamp).toISOString(),
    d.metrics.totalExecutions,
    d.metrics.successfulExecutions,
    d.metrics.failedExecutions,
    ((d.metrics.successfulExecutions / d.metrics.totalExecutions) * 100).toFixed(2),
    d.metrics.averageExecutionTime.toFixed(2),
    d.metrics.uptimePercentage.toFixed(2),
    d.activeAutomations,
    d.deviceHealth.online,
    d.deviceHealth.offline,
    d.deviceHealth.warning,
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}
