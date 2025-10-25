/**
 * Lighthouse Mobile Configuration for HomeHub
 *
 * Mobile-specific testing with realistic device constraints:
 * - Simulates iOS devices (primary target)
 * - 3G throttling for worst-case scenarios
 * - Touch interaction focus
 */

export default {
  extends: 'lighthouse:default',

  settings: {
    // Mobile device emulation (iPhone 13 Pro)
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      disabled: false,
    },

    // Mobile throttling (3G connection)
    throttling: {
      rttMs: 150, // 150ms RTT (3G)
      throughputKbps: 1.6 * 1024, // 1.6 Mbps (3G)
      cpuSlowdownMultiplier: 4, // 4x CPU slowdown
      requestLatencyMs: 150,
      downloadThroughputKbps: 1.6 * 1024,
      uploadThroughputKbps: 750,
    },

    // Focus on key categories
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'pwa'],

    // Multiple runs for consistent results
    runs: 3,
  },

  // Mobile-specific thresholds (more lenient for constrained devices)
  thresholds: {
    // Performance metrics (adjusted for mobile)
    'first-contentful-paint': 2500, // 2.5s max on mobile
    'largest-contentful-paint': 4000, // 4s max on mobile
    interactive: 5000, // 5s max for TTI on mobile
    'speed-index': 3500, // 3.5s max on mobile
    'total-blocking-time': 600, // 600ms max on mobile
    'cumulative-layout-shift': 0.1, // Minimal layout shift

    // Accessibility (same standards)
    accessibility: 90,
    'color-contrast': 1,
    'tap-targets': 1, // Touch-friendly targets

    // Best practices
    'best-practices': 90,
    'uses-https': 1,

    // PWA (higher standards for mobile)
    pwa: 80, // 80+ for mobile
    'installable-manifest': 1,
    'apple-touch-icon': 1, // iOS app icon
    'themed-omnibox': 1, // Themed address bar
  },
}
