import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void
  onPress?: (event: React.MouseEvent | React.TouchEvent) => void
  delay?: number
}

/**
 * Custom hook to detect long-press gestures (500ms default)
 * Works with both mouse and touch events
 *
 * @example
 * ```tsx
 * const longPressHandlers = useLongPress({
 *   onLongPress: () => console.log('Long pressed!'),
 *   delay: 500
 * })
 *
 * return <div {...longPressHandlers}>Hold me</div>
 * ```
 */
export function useLongPress({ onLongPress, onPress, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isLongPressRef = useRef(false)

  const startPress = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      isLongPressRef.current = false

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        onLongPress(event)
      }, delay)
    },
    [onLongPress, delay]
  )

  const cancelPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  const handleEndPress = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      cancelPress()

      // If it wasn't a long press and we have an onPress handler, call it
      if (!isLongPressRef.current && onPress) {
        onPress(event)
      }
    },
    [cancelPress, onPress]
  )

  return {
    onMouseDown: startPress,
    onMouseUp: handleEndPress,
    onMouseLeave: cancelPress,
    onTouchStart: startPress,
    onTouchEnd: handleEndPress,
  }
}
