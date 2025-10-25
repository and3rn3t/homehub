import { useEffect } from 'react'

/**
 * Custom hook to handle iOS keyboard avoidance
 * Automatically scrolls focused input fields into view when keyboard opens
 *
 * @example
 * ```tsx
 * function MyDialog() {
 *   useKeyboardAvoidance()
 *   return <Dialog>...</Dialog>
 * }
 * ```
 */
export function useKeyboardAvoidance() {
  useEffect(() => {
    // Only run on touch devices (mobile)
    if (!('ontouchstart' in window)) return

    let previousHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDiff = previousHeight - currentHeight

      // Keyboard is likely open if viewport shrunk significantly (>150px)
      const isKeyboardOpen = heightDiff > 150

      if (isKeyboardOpen && document.activeElement) {
        // Small delay to ensure keyboard animation is complete
        setTimeout(() => {
          const activeElement = document.activeElement as HTMLElement

          // Only scroll if it's an input/textarea
          if (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.getAttribute('contenteditable') === 'true'
          ) {
            activeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest',
            })
          }
        }, 100)
      }

      previousHeight = currentHeight
    }

    // iOS fires resize event when keyboard opens/closes
    window.addEventListener('resize', handleResize)

    // Also listen for focusin to handle manual focus changes
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement

      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true'
      ) {
        // Delay to let keyboard animation start
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          })
        }, 300)
      }
    }

    document.addEventListener('focusin', handleFocusIn)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [])
}
