import { Badge } from '@/components/ui/badge'
import { LightbulbIcon, RadioIcon, WifiIcon } from '@/lib/icons'
import type { DeviceProtocol } from '@/types'

interface ProtocolBadgeProps {
  protocol: DeviceProtocol
  className?: string
}

/**
 * Visual indicator for device communication protocol
 *
 * Displays a badge with an icon and label to show whether a device
 * uses MQTT (pub/sub via broker), HTTP (direct REST API), or Hue (Philips Hue Bridge).
 */
export function ProtocolBadge({ protocol, className }: ProtocolBadgeProps) {
  return (
    <Badge
      variant={protocol === 'mqtt' ? 'secondary' : protocol === 'hue' ? 'default' : 'outline'}
      className={className}
    >
      {protocol === 'mqtt' ? (
        <>
          <RadioIcon className="mr-1 h-3 w-3" />
          MQTT
        </>
      ) : protocol === 'hue' ? (
        <>
          <LightbulbIcon className="mr-1 h-3 w-3" />
          Hue
        </>
      ) : (
        <>
          <WifiIcon className="mr-1 h-3 w-3" />
          HTTP
        </>
      )}
    </Badge>
  )
}
