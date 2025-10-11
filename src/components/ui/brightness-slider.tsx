/**
 * Brightness Slider Component
 *
 * Enhanced slider with gradient background showing brightness levels.
 * Integrates with Hue lights for real-time brightness control.
 *
 * Usage:
 *   <BrightnessSlider
 *     value={75}
 *     onChange={(value) => setBrightness(value)}
 *     disabled={false}
 *   />
 */

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SunRoomIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface BrightnessSliderProps {
  /** Current brightness value (0-100) */
  value: number
  /** Callback when brightness changes */
  onChange: (value: number) => void
  /** Whether the slider is disabled */
  disabled?: boolean
  /** Whether the control is updating (shows loading state) */
  isUpdating?: boolean
  /** Additional CSS classes */
  className?: string
}

export function BrightnessSlider({
  value,
  onChange,
  disabled,
  isUpdating,
  className,
}: BrightnessSliderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-3', className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SunRoomIcon className="h-5 w-5" />
          <Label className="text-base">Brightness</Label>
        </div>
        <span className="text-muted-foreground text-sm font-medium tabular-nums">
          {value}%
          {isUpdating && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-1 text-xs">
              ⋯
            </motion.span>
          )}
        </span>
      </div>

      {/* Slider with gradient background */}
      <div className="relative">
        {/* Gradient background */}
        <div className="absolute inset-0 h-2 translate-y-1 rounded-full opacity-30">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-gray-900 via-gray-600 to-white" />
        </div>

        {/* Actual slider */}
        <Slider
          value={[value]}
          onValueChange={values => onChange(values[0] ?? value)}
          min={0}
          max={100}
          step={1}
          disabled={disabled || isUpdating}
          className="relative cursor-pointer"
        />
      </div>

      {/* Brightness indicator bar */}
      <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-white"
          initial={false}
          animate={{ width: `${value}%` }}
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
