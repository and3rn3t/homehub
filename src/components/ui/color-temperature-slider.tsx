/**
 * Color Temperature Slider Component
 *
 * Enhanced slider with gradient background showing warm to cool white spectrum.
 * Ranges from 2000K (warm) to 6500K (cool) for Hue lights.
 *
 * Usage:
 *   <ColorTemperatureSlider
 *     value={3000}
 *     onChange={(kelvin) => setColorTemp(kelvin)}
 *     disabled={false}
 *   />
 */

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ThermometerIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ColorTemperatureSliderProps {
  /** Current color temperature in Kelvin (2000-6500) */
  value: number
  /** Callback when temperature changes (fires continuously during drag) */
  onChange: (kelvin: number) => void
  /** Callback when user finishes changing temperature (fires on release) */
  onValueCommit?: (kelvin: number) => void
  /** Whether the slider is disabled */
  disabled?: boolean
  /** Whether the control is updating (shows loading state) */
  isUpdating?: boolean
  /** Additional CSS classes */
  className?: string
}

export function ColorTemperatureSlider({
  value,
  onChange,
  onValueCommit,
  disabled,
  isUpdating,
  className,
}: ColorTemperatureSliderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn('space-y-3', className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ThermometerIcon className="h-5 w-5" />
          <Label className="text-base">Color Temperature</Label>
        </div>
        <span className="text-muted-foreground text-sm font-medium tabular-nums">
          {value}K
          {isUpdating && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-1 text-xs">
              ⋯
            </motion.span>
          )}
        </span>
      </div>

      {/* Slider with gradient background */}
      <div className="relative">
        {/* Gradient background - warm to cool */}
        <div className="absolute inset-0 h-2 translate-y-1 rounded-full opacity-40">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-orange-400 via-yellow-100 to-blue-200" />
        </div>

        {/* Actual slider */}
        <Slider
          value={[value]}
          onValueChange={values => onChange(values[0] ?? value)}
          onValueCommit={onValueCommit ? values => onValueCommit(values[0] ?? value) : undefined}
          min={2000}
          max={6500}
          step={100}
          disabled={disabled || isUpdating}
          className="relative cursor-pointer"
        />
      </div>

      {/* Temperature labels */}
      <div className="text-muted-foreground flex justify-between text-xs">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          Warm (2000K)
        </span>
        <span className="flex items-center gap-1">
          Cool (6500K)
          <span className="h-2 w-2 rounded-full bg-blue-200" />
        </span>
      </div>

      {/* Temperature indicator */}
      <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-400 via-yellow-100 to-blue-200"
          initial={false}
          animate={{ width: `${((value - 2000) / (6500 - 2000)) * 100}%` }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        />
      </div>
    </motion.div>
  )
}
