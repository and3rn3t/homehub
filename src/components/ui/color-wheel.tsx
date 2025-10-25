/**
 * Color Wheel Picker Component
 *
 * iOS-inspired color wheel for selecting RGB colors with visual feedback.
 * Features:
 * - 360° hue wheel with saturation/brightness picker
 * - Touch/mouse support for intuitive selection
 * - Preset color buttons for quick access
 * - Real-time color preview
 * - Accessibility support
 *
 * Usage:
 *   <ColorWheelPicker
 *     value="#FF0000"
 *     onChange={(hex) => console.log(hex)}
 *     disabled={false}
 *   />
 */

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface ColorWheelPickerProps {
  /** Current color value in hex format */
  value: string
  /** Callback when color changes (fires continuously during drag) */
  onChange: (hex: string) => void
  /** Callback when user finishes changing color (fires on release) */
  onValueCommit?: (hex: string) => void
  /** Whether the picker is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

interface HSV {
  h: number // 0-360
  s: number // 0-100
  v: number // 0-100
}

/**
 * Convert HSV to RGB
 */
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = (v / 100) * (s / 100)
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v / 100 - c

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`
}

/**
 * Convert hex to HSV
 */
function hexToHsv(hex: string): HSV {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  const s = max === 0 ? 0 : (delta / max) * 100
  const v = max * 100

  if (delta === 0) {
    h = 0
  } else if (max === r) {
    h = ((g - b) / delta + (g < b ? 6 : 0)) * 60
  } else if (max === g) {
    h = ((b - r) / delta + 2) * 60
  } else {
    h = ((r - g) / delta + 4) * 60
  }

  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) }
}

export function ColorWheelPicker({
  value,
  onChange,
  onValueCommit,
  disabled,
  className,
}: ColorWheelPickerProps) {
  const [hsv, setHsv] = useState<HSV>(hexToHsv(value))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)

  // Update HSV when value prop changes
  useEffect(() => {
    setHsv(hexToHsv(value))
  }, [value])

  // Keyboard navigation for accessibility (WCAG 2.1.1)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    const newHsv = { ...hsv }
    let changed = false

    // Arrow keys adjust hue and saturation
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        newHsv.h = (hsv.h + 5) % 360
        changed = true
        break
      case 'ArrowLeft':
        e.preventDefault()
        newHsv.h = (hsv.h - 5 + 360) % 360
        changed = true
        break
      case 'ArrowUp':
        e.preventDefault()
        newHsv.s = Math.min(100, hsv.s + 5)
        changed = true
        break
      case 'ArrowDown':
        e.preventDefault()
        newHsv.s = Math.max(0, hsv.s - 5)
        changed = true
        break
      case '+':
      case '=':
        e.preventDefault()
        newHsv.v = Math.min(100, hsv.v + 5)
        changed = true
        break
      case '-':
      case '_':
        e.preventDefault()
        newHsv.v = Math.max(0, hsv.v - 5)
        changed = true
        break
    }

    if (changed) {
      const { r, g, b } = hsvToRgb(newHsv.h, newHsv.s, newHsv.v)
      const hex = rgbToHex(r, g, b)
      onChange(hex)
      if (onValueCommit) {
        onValueCommit(hex)
      }
    }
  }

  // Draw color wheel
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 0.5) * (Math.PI / 180)
      const endAngle = (angle + 0.5) * (Math.PI / 180)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      const rgb = hsvToRgb(angle, 100, 100)
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
      ctx.fill()
    }

    // Draw white center for brightness
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.6)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const handleColorSelect = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    // Handle both mouse and touch events
    const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY

    if (!clientX || !clientY) return

    const x = clientX - rect.left
    const y = clientY - rect.top

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const radius = Math.min(centerX, centerY) - 10

    if (distance > radius) return

    // Calculate hue from angle
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    if (angle < 0) angle += 360

    // Calculate saturation and value from distance
    const saturation = Math.min(100, (distance / radius) * 100)
    const brightness = 100 - (distance / (radius * 0.6)) * 30 // Brightness decreases toward edge

    const newHsv = { h: Math.round(angle), s: Math.round(saturation), v: Math.round(brightness) }
    setHsv(newHsv)

    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v)
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    onChange(hex)
  }

  const presetColors = [
    '#FF0000', // Red
    '#FF8800', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#00FFFF', // Cyan
    '#0088FF', // Blue
    '#4400FF', // Indigo
    '#FF00FF', // Magenta
    '#FFFFFF', // White
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Color Wheel Canvas */}
      <div
        className="focus:ring-primary relative mx-auto h-[240px] w-[240px] rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none"
        onKeyDown={handleKeyDown}
        role="img"
        aria-label={`Color picker showing ${value}. Use arrow keys to adjust hue and saturation, plus and minus keys to adjust brightness. Hue: ${hsv.h} degrees, Saturation: ${hsv.s}%, Brightness: ${hsv.v}%`}
        tabIndex={disabled ? -1 : 0}
      >
        <canvas
          ref={canvasRef}
          width={240}
          height={240}
          onClick={handleColorSelect}
          onMouseDown={() => {
            if (!disabled) isDragging.current = true
          }}
          onMouseUp={() => {
            if (isDragging.current && onValueCommit) {
              const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v)
              onValueCommit(rgbToHex(r, g, b))
            }
            isDragging.current = false
          }}
          onMouseMove={event => {
            if (isDragging.current && !disabled) {
              handleColorSelect(event)
            }
          }}
          onMouseLeave={() => {
            if (isDragging.current && onValueCommit) {
              const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v)
              onValueCommit(rgbToHex(r, g, b))
            }
            isDragging.current = false
          }}
          onTouchStart={e => {
            if (!disabled) {
              isDragging.current = true
              handleColorSelect(e)
            }
          }}
          onTouchMove={e => {
            if (isDragging.current && !disabled) {
              e.preventDefault()
              handleColorSelect(e)
            }
          }}
          onTouchEnd={() => {
            if (isDragging.current && onValueCommit) {
              const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v)
              onValueCommit(rgbToHex(r, g, b))
            }
            isDragging.current = false
          }}
          className={cn(
            'rounded-full shadow-lg transition-all hover:shadow-xl',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-[1.02]'
          )}
          style={{
            touchAction: 'none',
            userSelect: 'none',
          }}
        />

        {/* Current color indicator */}
        <motion.div
          className="pointer-events-none absolute"
          initial={false}
          animate={{
            // Canvas is 240x240, center at 120px, radius is 110px
            // Calculate position in pixels from canvas top-left
            left: 120 + (hsv.s / 100) * 110 * Math.cos((hsv.h * Math.PI) / 180),
            top: 120 + (hsv.s / 100) * 110 * Math.sin((hsv.h * Math.PI) / 180),
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        >
          <div
            className="h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-lg ring-2 ring-black/20"
            style={{ backgroundColor: value }}
          />
        </motion.div>
      </div>

      {/* Preset Colors */}
      <div className="flex flex-wrap justify-center gap-2">
        {presetColors.map(color => (
          <motion.button
            key={color}
            type="button"
            onClick={() => {
              if (!disabled) {
                onChange(color)
                if (onValueCommit) {
                  onValueCommit(color)
                }
              }
            }}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.1 }}
            whileTap={{ scale: disabled ? 1 : 0.9 }}
            className={cn(
              'ring-border hover:ring-primary h-10 w-10 rounded-full ring-2 transition-all hover:ring-offset-2',
              disabled && 'cursor-not-allowed opacity-50',
              value.toUpperCase() === color && 'ring-primary ring-offset-2'
            )}
            style={{ backgroundColor: color }}
            title={color}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>

      {/* Color Preview & Hex Input */}
      <div className="flex items-center gap-3">
        <div
          className="border-border h-12 w-12 flex-shrink-0 rounded-lg border-2 shadow-inner"
          style={{ backgroundColor: value }}
          aria-label="Current color preview"
        />
        <div className="flex-1">
          <div className="text-muted-foreground text-xs">Selected Color</div>
          <div className="font-mono text-lg font-semibold">{value}</div>
        </div>
      </div>

      {/* HSV Values (for debugging/info) */}
      <div className="bg-muted/50 flex justify-between rounded-lg px-3 py-2 text-xs">
        <span>
          <span className="text-muted-foreground">H:</span> {hsv.h}°
        </span>
        <span>
          <span className="text-muted-foreground">S:</span> {hsv.s}%
        </span>
        <span>
          <span className="text-muted-foreground">V:</span> {hsv.v}%
        </span>
      </div>
    </div>
  )
}
