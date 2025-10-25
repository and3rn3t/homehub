/**
 * Haptic Feedback Hook
 *
 * Provides iOS-like haptic feedback for touch interactions.
 * Uses the Vibration API where available (mobile devices).
 *
 * Different patterns for different interaction types:
 * - Light: Quick tap (10ms) - buttons, toggles
 * - Medium: Standard feedback (20ms) - selections, confirmations
 * - Heavy: Strong feedback (30ms) - important actions, errors
 * - Success: Double tap (10ms, 50ms gap, 10ms) - success states
 * - Error: Triple tap (15ms, 30ms gap, 15ms, 30ms gap, 15ms) - errors
 *
 * @example
 * const haptic = useHaptic()
 * <button onClick={() => { haptic.light(); doSomething(); }}>Click</button>
 */

interface HapticFeedback {
  /** Light tap (10ms) - for buttons, toggles */
  light: () => void
  /** Medium tap (20ms) - for selections, confirmations */
  medium: () => void
  /** Heavy tap (30ms) - for important actions, errors */
  heavy: () => void
  /** Success pattern (double tap) - for success states */
  success: () => void
  /** Error pattern (triple tap) - for errors, warnings */
  error: () => void
  /** Check if haptic feedback is supported */
  isSupported: boolean
}

export function useHaptic(): HapticFeedback {
  // Check if Vibration API is available
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator

  const vibrate = (pattern: number | number[]) => {
    if (!isSupported) return

    try {
      navigator.vibrate(pattern)
    } catch (error) {
      // Silently fail if vibration not available
      // (e.g., desktop browsers, iOS Safari restrictions)
      console.debug('Haptic feedback not available:', error)
    }
  }

  return {
    // Light tap - quick feedback for buttons, toggles
    light: () => vibrate(10),

    // Medium tap - standard feedback for selections
    medium: () => vibrate(20),

    // Heavy tap - strong feedback for important actions
    heavy: () => vibrate(30),

    // Success pattern - double tap
    success: () => vibrate([10, 50, 10]),

    // Error pattern - triple tap
    error: () => vibrate([15, 30, 15, 30, 15]),

    // Check support
    isSupported,
  }
}

/**
 * Haptic Feedback Wrapper Component
 *
 * Wraps children and adds haptic feedback on click.
 * Useful for simple cases where you just need a tap on click.
 *
 * @example
 * <HapticWrapper type="light">
 *   <button>Click me</button>
 * </HapticWrapper>
 */
import { cloneElement, type ReactElement } from 'react'

interface HapticWrapperProps {
  children: ReactElement
  type?: 'light' | 'medium' | 'heavy' | 'success' | 'error'
  disabled?: boolean
}

export function HapticWrapper({ children, type = 'light', disabled = false }: HapticWrapperProps) {
  const haptic = useHaptic()

  const handleClick = (event: React.MouseEvent) => {
    if (!disabled) {
      haptic[type]()
    }

    // Call original onClick if it exists
    const originalOnClick = (children.props as { onClick?: (e: React.MouseEvent) => void }).onClick
    if (originalOnClick) {
      originalOnClick(event)
    }
  }

  return cloneElement(children, {
    onClick: handleClick,
  } as Partial<typeof children.props>)
}
