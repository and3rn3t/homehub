import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useKV } from '@/hooks/use-kv'
import {
  BatteryMedium,
  Bell,
  CheckCircle,
  Info,
  Warning,
  WifiSlash,
  Wrench,
  X,
  XCircle,
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SystemAlert {
  id: string
  type:
    | 'device-offline'
    | 'low-battery'
    | 'weak-signal'
    | 'system-error'
    | 'maintenance'
    | 'security'
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  timestamp: Date
  deviceId?: string
  acknowledged: boolean
  autoExpire?: boolean
  expiresAt?: Date
}

const alertIcons = {
  'device-offline': WifiSlash,
  'low-battery': BatteryMedium,
  'weak-signal': WifiSlash,
  'system-error': XCircle,
  maintenance: Wrench,
  security: Warning,
}

const severityColors = {
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  critical: 'text-red-700 bg-red-100 border-red-300',
}

const severityBadgeColors = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900',
}

export function NotificationCenter() {
  const [alerts, setAlerts] = useKV<SystemAlert[]>('system-alerts', [])
  const [isVisible, setIsVisible] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useKV<Date>('last-alert-check', new Date())

  // Check for new alerts since last visit
  useEffect(() => {
    const unacknowledgedAlerts = alerts.filter(
      alert => !alert.acknowledged && alert.timestamp > lastCheckTime
    )

    if (unacknowledgedAlerts.length > 0) {
      setIsVisible(true)
    }
  }, [alerts, lastCheckTime])

  // Auto-expire alerts
  useEffect(() => {
    const now = new Date()
    const expiredAlerts = alerts.filter(
      alert => alert.autoExpire && alert.expiresAt && alert.expiresAt < now
    )

    if (expiredAlerts.length > 0) {
      setAlerts(currentAlerts =>
        currentAlerts.filter(
          alert => !(alert.autoExpire && alert.expiresAt && alert.expiresAt < now)
        )
      )
    }
  }, [alerts, setAlerts])

  // Simulate real-time alert generation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random system alerts for demo
      if (Math.random() < 0.05) {
        // 5% chance every 10 seconds
        const alertTypes: SystemAlert['type'][] = [
          'device-offline',
          'low-battery',
          'weak-signal',
          'system-error',
          'maintenance',
        ]
        const severities: SystemAlert['severity'][] = ['info', 'warning', 'error']

        const randomType =
          alertTypes[Math.floor(Math.random() * alertTypes.length)] ?? 'system-error'
        const randomSeverity = severities[Math.floor(Math.random() * severities.length)] ?? 'info'

        const newAlert: SystemAlert = {
          id: `alert-${Date.now()}`,
          type: randomType,
          title: getAlertTitle(randomType),
          message: getAlertMessage(randomType),
          severity: randomSeverity,
          timestamp: new Date(),
          acknowledged: false,
          autoExpire: randomType === 'maintenance',
          expiresAt: randomType === 'maintenance' ? new Date(Date.now() + 30000) : undefined, // 30 seconds
        }

        setAlerts(currentAlerts => [newAlert, ...currentAlerts])

        // Show toast notification
        toast.error(newAlert.title, {
          description: newAlert.message,
          duration: 5000,
        })
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [setAlerts])

  const getAlertTitle = (type: SystemAlert['type']) => {
    switch (type) {
      case 'device-offline':
        return 'Device Offline'
      case 'low-battery':
        return 'Low Battery Warning'
      case 'weak-signal':
        return 'Weak Signal Detected'
      case 'system-error':
        return 'System Error'
      case 'maintenance':
        return 'Maintenance Required'
      case 'security':
        return 'Security Alert'
      default:
        return 'System Notification'
    }
  }

  const getAlertMessage = (type: SystemAlert['type']) => {
    switch (type) {
      case 'device-offline':
        return 'A smart home device has gone offline and may need attention'
      case 'low-battery':
        return 'One or more devices have critically low battery levels'
      case 'weak-signal':
        return 'Network connectivity issues detected on some devices'
      case 'system-error':
        return 'An unexpected system error has occurred'
      case 'maintenance':
        return 'Scheduled maintenance will begin shortly'
      case 'security':
        return 'Unusual activity detected on your security system'
      default:
        return 'A system notification requires your attention'
    }
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(currentAlerts =>
      currentAlerts.map(alert => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
    )
    toast.success('Alert acknowledged')
  }

  const acknowledgeAll = () => {
    setAlerts(currentAlerts => currentAlerts.map(alert => ({ ...alert, acknowledged: true })))
    setLastCheckTime(new Date())
    toast.success('All alerts acknowledged')
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(currentAlerts => currentAlerts.filter(alert => alert.id !== alertId))
  }

  const clearAll = () => {
    setAlerts([])
    setLastCheckTime(new Date())
    toast.success('All alerts cleared')
  }

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged)
  const recentAlerts = alerts.slice(0, 10) // Show last 10 alerts

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (!isVisible && unacknowledgedAlerts.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
        >
          <Card className="border-border/50 bg-card/95 shadow-lg backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="border-border flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <Bell size={20} className="text-primary" />
                  <h3 className="text-foreground font-semibold">Notifications</h3>
                  {unacknowledgedAlerts.length > 0 && (
                    <Badge variant="destructive" className="h-5 text-xs">
                      {unacknowledgedAlerts.length}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {alerts.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={acknowledgeAll}
                        className="h-7 px-2 text-xs"
                      >
                        Mark All Read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAll}
                        className="h-7 px-2 text-xs"
                      >
                        Clear All
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVisible(false)}
                    className="h-7 w-7 p-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                    <p className="text-muted-foreground text-sm">No alerts</p>
                    <p className="text-muted-foreground text-xs">Your system is running smoothly</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {recentAlerts.map(alert => {
                      const IconComponent = alertIcons[alert.type] || Info

                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`rounded-lg border p-3 transition-all ${
                            alert.acknowledged
                              ? 'bg-muted/50 border-border opacity-60'
                              : severityColors[alert.severity]
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <IconComponent
                              size={18}
                              className={alert.acknowledged ? 'text-muted-foreground' : ''}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <h4 className="truncate text-sm font-medium">{alert.title}</h4>
                                <Badge
                                  variant="secondary"
                                  className={`h-4 text-xs ${
                                    alert.acknowledged
                                      ? 'bg-muted text-muted-foreground'
                                      : severityBadgeColors[alert.severity]
                                  }`}
                                >
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="mb-2 text-xs opacity-80">{alert.message}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs opacity-60">
                                  {getTimeAgo(alert.timestamp)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {!alert.acknowledged && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => acknowledgeAlert(alert.id)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      Acknowledge
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => dismissAlert(alert.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X size={12} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Floating notification bell for the header
export function NotificationBell() {
  const [alerts] = useKV<SystemAlert[]>('system-alerts', [])
  const [isVisible, setIsVisible] = useState(false)

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length
  const criticalCount = alerts.filter(
    alert => !alert.acknowledged && alert.severity === 'critical'
  ).length

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="relative h-11 w-11 rounded-full"
        onClick={() => setIsVisible(!isVisible)}
      >
        <Bell size={20} />
        {unacknowledgedCount > 0 && (
          <div
            className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
              criticalCount > 0 ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'
            }`}
          >
            {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
          </div>
        )}
      </Button>

      {isVisible && <NotificationCenter />}
    </>
  )
}
