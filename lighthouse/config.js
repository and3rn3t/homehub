/**
 * Lighthouse Configuration for HomeHub
 *
 * Optimized settings for home automation dashboard testing:
 * - Desktop & Mobile device emulation
 * - Focus on performance, accessibility, PWA compliance
 * - Custom thresholds for real-time dashboard requirements
 */

export default {
  extends: 'lighthouse:default',

  settings: {
    // Run on both mobile and desktop
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      disabled: false,
    },

    // Throttling settings (simulate real-world conditions)
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024, // 10 Mbps
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },

    // Focus on key categories
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'pwa'],

    // Multiple runs for consistent results
    runs: 3,
  },

  // Custom audit thresholds for HomeHub
  // Real-time dashboards need fast interaction
  thresholds: {
    // Performance metrics (stricter for real-time UI)
    'first-contentful-paint': 1500, // 1.5s max
    'largest-contentful-paint': 2500, // 2.5s max
    interactive: 3000, // 3s max for TTI
    'speed-index': 2000, // 2s max
    'total-blocking-time': 300, // 300ms max
    'cumulative-layout-shift': 0.1, // Minimal layout shift

    // Accessibility (WCAG AA compliance)
    accessibility: 90, // 90+ score
    'color-contrast': 1, // Must pass
    'aria-allowed-attr': 1, // Must pass
    'aria-required-attr': 1, // Must pass

    // Best practices
    'best-practices': 90, // 90+ score
    'uses-https': 1, // Must use HTTPS
    'no-vulnerable-libraries': 1, // No known vulnerabilities

    // PWA (for future mobile app)
    pwa: 70, // 70+ score (baseline)
    'installable-manifest': 1, // Must have manifest
    'service-worker': 0, // Optional for now
  },
}
