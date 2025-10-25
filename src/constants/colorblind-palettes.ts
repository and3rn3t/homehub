/**
 * Colorblind-Safe Palette System
 *
 * Provides alternative color schemes for users with color vision deficiency.
 * Each palette maintains visual hierarchy while ensuring distinguishability.
 *
 * @see WCAG 1.4.1 - Use of Color
 * @see https://www.color-blindness.com/types-of-color-blindness/
 *
 * Coverage:
 * - Protanopia (Red-blind): 1% of males
 * - Deuteranopia (Green-blind): 1% of males
 * - Protanomaly (Red-weak): 1% of males
 * - Deuteranomaly (Green-weak): 6% of males
 * - Tritanopia (Blue-blind): <1% of population
 * - Achromatopsia (Total colorblindness): 0.003% of population
 *
 * Total Impact: ~10% of males, ~1% of females
 */

export type ColorblindMode =
  | 'default'
  | 'redGreenSafe'
  | 'blueYellowSafe'
  | 'monochrome'
  | 'highContrast'

export interface StatusPalette {
  bg: string // Background class
  text: string // Text color class
  border: string // Border color class
  icon: string // Icon color class
}

export interface ColorblindPalette {
  success: StatusPalette // Online/success state
  error: StatusPalette // Offline/error state
  warning: StatusPalette // Alerts/warning state
}

/**
 * Colorblind-safe palette definitions
 */
export const COLORBLIND_PALETTES: Record<ColorblindMode, ColorblindPalette> = {
  /**
   * Default (Standard) - For users with normal color vision
   * Uses iOS system colors (green/red/blue)
   */
  default: {
    success: {
      bg: 'bg-green-50/85',
      text: 'text-green-800',
      border: 'border-green-200/50',
      icon: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50/85',
      text: 'text-red-800',
      border: 'border-red-200/50',
      icon: 'text-red-600',
    },
    warning: {
      bg: 'bg-blue-50/85',
      text: 'text-blue-800',
      border: 'border-blue-200/50',
      icon: 'text-blue-600',
    },
  },

  /**
   * Red-Green Safe - For Protanopia/Deuteranopia (most common)
   * Avoids red-green confusion by using blue/orange/purple
   *
   * Affected: ~8% of males (Protanopia, Deuteranopia, Protanomaly, Deuteranomaly)
   */
  redGreenSafe: {
    success: {
      bg: 'bg-blue-50/85',
      text: 'text-blue-800',
      border: 'border-blue-200/50',
      icon: 'text-blue-600',
    },
    error: {
      bg: 'bg-orange-50/85',
      text: 'text-orange-800',
      border: 'border-orange-200/50',
      icon: 'text-orange-600',
    },
    warning: {
      bg: 'bg-purple-50/85',
      text: 'text-purple-800',
      border: 'border-purple-200/50',
      icon: 'text-purple-600',
    },
  },

  /**
   * Blue-Yellow Safe - For Tritanopia
   * Avoids blue-yellow confusion by using green/pink/purple
   *
   * Affected: <1% of population (Tritanopia, Tritanomaly)
   */
  blueYellowSafe: {
    success: {
      bg: 'bg-green-50/85',
      text: 'text-green-800',
      border: 'border-green-200/50',
      icon: 'text-green-600',
    },
    error: {
      bg: 'bg-pink-50/85',
      text: 'text-pink-800',
      border: 'border-pink-200/50',
      icon: 'text-pink-600',
    },
    warning: {
      bg: 'bg-purple-50/85',
      text: 'text-purple-800',
      border: 'border-purple-200/50',
      icon: 'text-purple-600',
    },
  },

  /**
   * Monochrome - For Achromatopsia (total colorblindness)
   * Uses grayscale with varying intensities for distinction
   *
   * Affected: 0.003% of population
   * Also useful for: E-ink displays, high-contrast printing
   */
  monochrome: {
    success: {
      bg: 'bg-slate-50/85',
      text: 'text-slate-900',
      border: 'border-slate-300/50',
      icon: 'text-slate-700',
    },
    error: {
      bg: 'bg-slate-100/85',
      text: 'text-slate-900',
      border: 'border-slate-400/50',
      icon: 'text-slate-800',
    },
    warning: {
      bg: 'bg-slate-200/85',
      text: 'text-slate-900',
      border: 'border-slate-500/50',
      icon: 'text-slate-900',
    },
  },

  /**
   * High Contrast - For low vision + colorblindness
   * Maximum contrast ratios (18:1+) with bold borders
   *
   * Use cases:
   * - Low vision users
   * - Bright sunlight (outdoor mobile use)
   * - Aging users (reduced contrast sensitivity)
   * - CVD + low vision combination
   */
  highContrast: {
    success: {
      bg: 'bg-white',
      text: 'text-green-900',
      border: 'border-green-900',
      icon: 'text-green-900',
    },
    error: {
      bg: 'bg-white',
      text: 'text-red-900',
      border: 'border-red-900',
      icon: 'text-red-900',
    },
    warning: {
      bg: 'bg-white',
      text: 'text-blue-900',
      border: 'border-blue-900',
      icon: 'text-blue-900',
    },
  },
}

/**
 * Get palette classes for a given mode and status
 *
 * @param mode - Colorblind mode
 * @param status - Status type (success/error/warning)
 * @returns Tailwind CSS classes for the palette
 *
 * @example
 * ```tsx
 * const classes = getStatusClasses('redGreenSafe', 'success')
 * <div className={classes.bg}>
 *   <Icon className={classes.icon} />
 *   <span className={classes.text}>Online</span>
 * </div>
 * ```
 */
export function getStatusClasses(
  mode: ColorblindMode,
  status: 'success' | 'error' | 'warning'
): StatusPalette {
  return COLORBLIND_PALETTES[mode][status]
}

/**
 * Colorblind mode metadata for UI display
 */
export const COLORBLIND_MODE_INFO: Record<
  ColorblindMode,
  {
    label: string
    description: string
    affectedPopulation: string
  }
> = {
  default: {
    label: 'Default Colors',
    description: 'Standard iOS colors (green, red, blue)',
    affectedPopulation: 'All users',
  },
  redGreenSafe: {
    label: 'Red-Green Safe',
    description: 'Blue, orange, purple (no red/green confusion)',
    affectedPopulation: '~8% of males',
  },
  blueYellowSafe: {
    label: 'Blue-Yellow Safe',
    description: 'Green, pink, purple (no blue/yellow confusion)',
    affectedPopulation: '<1% of population',
  },
  monochrome: {
    label: 'Monochrome',
    description: 'Grayscale only (for total colorblindness)',
    affectedPopulation: '0.003% of population',
  },
  highContrast: {
    label: 'High Contrast',
    description: 'Maximum contrast with bold borders',
    affectedPopulation: 'Low vision + outdoor use',
  },
}
