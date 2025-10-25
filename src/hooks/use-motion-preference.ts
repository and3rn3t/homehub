/**
 * Hook to detect user's motion preferences
 *
 * Respects the prefers-reduced-motion media query for users with
 * vestibular disorders or motion sensitivity.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 * @see WCAG 2.3.3 - Animation from Interactions
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useMotionPreference()
 *
 * const animationProps = prefersReducedMotion
 *   ? { initial: {}, animate: {}, transition: { duration: 0 } }
 *   : { initial: { opacity: 0 }, animate: { opacity: 1 } }
 * ```
 */

import { useEffect, useState } from 'react'

export function useMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if matchMedia is supported
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes to user preference
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
    // Legacy browsers (Safari < 14)
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }

    return undefined
  }, [])

  return prefersReducedMotion
}
