import { Badge } from '@/components/ui/badge'
import type { DeviceProtocol } from '@/types'
import { CloudArrowUp, WifiHigh } from '@phosphor-icons/react'

interface ProtocolBadgeProps {
  protocol: DeviceProtocol
  className?: string
}

/**
 * Visual indicator for device communication protocol
 *
 * Displays a badge with an icon and label to show whether a device
 * uses MQTT (pub/sub via broker) or HTTP (direct REST API).
 */
export function ProtocolBadge({ protocol, className }: ProtocolBadgeProps) {
  return (
    <Badge variant={protocol === 'mqtt' ? 'secondary' : 'outline'} className={className}>
      {protocol === 'mqtt' ? (
        <>
          <CloudArrowUp weight="regular" className="mr-1 h-3 w-3" />
          MQTT
        </>
      ) : (
        <>
          <WifiHigh weight="regular" className="mr-1 h-3 w-3" />
          HTTP
        </>
      )}
    </Badge>
  )
}
