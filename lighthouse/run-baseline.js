/**
 * Lighthouse Baseline Runner for HomeHub
 *
 * Generates performance baselines and tracks improvements over time.
 * Run this script to establish initial metrics and compare against future runs.
 *
 * Usage:
 *   node lighthouse/run-baseline.js [options]
 *
 * Options:
 *   --url <url>       URL to test (default: http://localhost:5173)
 *   --mobile          Run mobile tests instead of desktop
 *   --compare         Compare against previous baseline
 *   --save            Save results as new baseline
 *   --verbose         Show detailed output
 */

import * as chromeLauncher from 'chrome-launcher'
import fs from 'fs'
import lighthouse from 'lighthouse'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse CLI arguments
const args = process.argv.slice(2)
const options = {
  url: args.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:5173',
  mobile: args.includes('--mobile'),
  compare: args.includes('--compare'),
  save: args.includes('--save'),
  verbose: args.includes('--verbose'),
}

// Directories
const REPORTS_DIR = path.join(__dirname, 'reports')
const BASELINES_DIR = path.join(__dirname, 'baselines')

// Ensure directories exist
;[REPORTS_DIR, BASELINES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Load Lighthouse config
const configPath = options.mobile
  ? path.join(__dirname, 'config-mobile.js')
  : path.join(__dirname, 'config.js')

// Convert to file:// URL for Windows compatibility
const configUrl = pathToFileURL(configPath).href
const config = await import(configUrl).then(m => m.default)

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function formatScore(score) {
  const percentage = Math.round(score * 100)
  const color = percentage >= 90 ? 'green' : percentage >= 50 ? 'yellow' : 'red'
  return `${colors[color]}${percentage}${colors.reset}`
}

function formatMetric(value, unit = 'ms') {
  if (typeof value === 'number') {
    return `${Math.round(value)}${unit}`
  }
  return value
}

async function runLighthouse(url) {
  log(`\n🚀 Launching Chrome...`, 'cyan')

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  })

  try {
    log(`📊 Running Lighthouse on ${url}...`, 'cyan')
    log(`   Device: ${options.mobile ? 'Mobile (iPhone 13 Pro)' : 'Desktop (1920x1080)'}`, 'gray')
    log(`   Runs: ${config.settings.runs} (averaging results)`, 'gray')

    const runnerResult = await lighthouse(
      url,
      {
        logLevel: options.verbose ? 'info' : 'error',
        output: 'json',
        port: chrome.port,
      },
      config
    )

    return runnerResult
  } finally {
    await chrome.kill()
  }
}

function extractMetrics(lhr) {
  const { categories, audits } = lhr

  return {
    scores: {
      performance: categories.performance?.score,
      accessibility: categories.accessibility?.score,
      bestPractices: categories['best-practices']?.score,
      pwa: categories.pwa?.score,
    },
    metrics: {
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue,
      interactive: audits['interactive']?.numericValue,
      speedIndex: audits['speed-index']?.numericValue,
      totalBlockingTime: audits['total-blocking-time']?.numericValue,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue,
    },
    timing: {
      timestamp: new Date().toISOString(),
      formFactor: lhr.configSettings.formFactor,
      url: lhr.finalUrl,
    },
  }
}

function printResults(metrics) {
  log(`\n📈 Performance Scores:`, 'bright')
  log(`   Performance:      ${formatScore(metrics.scores.performance)}`)
  log(`   Accessibility:    ${formatScore(metrics.scores.accessibility)}`)
  log(`   Best Practices:   ${formatScore(metrics.scores.bestPractices)}`)
  log(`   PWA:              ${formatScore(metrics.scores.pwa)}`)

  log(`\n⏱️  Core Web Vitals:`, 'bright')
  log(`   FCP:  ${formatMetric(metrics.metrics.firstContentfulPaint)}`, 'cyan')
  log(`   LCP:  ${formatMetric(metrics.metrics.largestContentfulPaint)}`, 'cyan')
  log(`   TTI:  ${formatMetric(metrics.metrics.interactive)}`, 'cyan')
  log(`   SI:   ${formatMetric(metrics.metrics.speedIndex)}`, 'cyan')
  log(`   TBT:  ${formatMetric(metrics.metrics.totalBlockingTime)}`, 'cyan')
  log(`   CLS:  ${formatMetric(metrics.metrics.cumulativeLayoutShift, '')}`, 'cyan')
}

function compareMetrics(current, baseline) {
  log(`\n📊 Comparison with Baseline:`, 'bright')

  const scoreDiff = (curr, base) => {
    const diff = (curr - base) * 100
    const color = diff >= 0 ? 'green' : 'red'
    const sign = diff >= 0 ? '+' : ''
    return `${colors[color]}${sign}${diff.toFixed(1)}%${colors.reset}`
  }

  const metricDiff = (curr, base) => {
    const diff = curr - base
    const percentDiff = ((curr - base) / base) * 100
    const color = diff <= 0 ? 'green' : 'red'
    const sign = diff >= 0 ? '+' : ''
    return `${colors[color]}${sign}${Math.round(diff)}ms (${sign}${percentDiff.toFixed(1)}%)${colors.reset}`
  }

  log(`   Performance:      ${scoreDiff(current.scores.performance, baseline.scores.performance)}`)
  log(
    `   Accessibility:    ${scoreDiff(current.scores.accessibility, baseline.scores.accessibility)}`
  )
  log(
    `   Best Practices:   ${scoreDiff(current.scores.bestPractices, baseline.scores.bestPractices)}`
  )
  log(`   PWA:              ${scoreDiff(current.scores.pwa, baseline.scores.pwa)}`)

  log(
    `\n   FCP:  ${metricDiff(current.metrics.firstContentfulPaint, baseline.metrics.firstContentfulPaint)}`
  )
  log(
    `   LCP:  ${metricDiff(current.metrics.largestContentfulPaint, baseline.metrics.largestContentfulPaint)}`
  )
  log(`   TTI:  ${metricDiff(current.metrics.interactive, baseline.metrics.interactive)}`)
  log(`   SI:   ${metricDiff(current.metrics.speedIndex, baseline.metrics.speedIndex)}`)
  log(
    `   TBT:  ${metricDiff(current.metrics.totalBlockingTime, baseline.metrics.totalBlockingTime)}`
  )
}

function saveBaseline(metrics, formFactor) {
  const filename = `baseline-${formFactor}-${Date.now()}.json`
  const filepath = path.join(BASELINES_DIR, filename)

  fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2))

  // Also save as "latest"
  const latestPath = path.join(BASELINES_DIR, `baseline-${formFactor}-latest.json`)
  fs.writeFileSync(latestPath, JSON.stringify(metrics, null, 2))

  log(`\n💾 Baseline saved: ${filename}`, 'green')
  log(`   Location: ${filepath}`, 'gray')
}

function loadBaseline(formFactor) {
  const filepath = path.join(BASELINES_DIR, `baseline-${formFactor}-latest.json`)

  if (!fs.existsSync(filepath)) {
    return null
  }

  return JSON.parse(fs.readFileSync(filepath, 'utf-8'))
}

async function main() {
  try {
    log(`\n${'='.repeat(60)}`, 'bright')
    log(`🏠 HomeHub Lighthouse Performance Baseline`, 'bright')
    log(`${'='.repeat(60)}`, 'bright')

    // Run Lighthouse
    const result = await runLighthouse(options.url)
    const metrics = extractMetrics(result.lhr)

    // Print results
    printResults(metrics)

    // Save full report
    const reportFilename = `report-${options.mobile ? 'mobile' : 'desktop'}-${Date.now()}.html`
    const reportPath = path.join(REPORTS_DIR, reportFilename)
    fs.writeFileSync(reportPath, result.report)
    log(`\n📄 Full report saved: ${reportFilename}`, 'gray')

    // Compare with baseline if requested
    if (options.compare) {
      const formFactor = options.mobile ? 'mobile' : 'desktop'
      const baseline = loadBaseline(formFactor)

      if (baseline) {
        compareMetrics(metrics, baseline)
      } else {
        log(`\n⚠️  No baseline found for ${formFactor}. Run with --save to create one.`, 'yellow')
      }
    }

    // Save as baseline if requested
    if (options.save) {
      const formFactor = options.mobile ? 'mobile' : 'desktop'
      saveBaseline(metrics, formFactor)
    }

    log(`\n${'='.repeat(60)}`, 'bright')
    log(`✅ Baseline run complete!`, 'green')

    if (!options.save && !options.compare) {
      log(`\n💡 Tips:`, 'cyan')
      log(`   • Run with --save to save as baseline`, 'gray')
      log(`   • Run with --compare to compare against baseline`, 'gray')
      log(`   • Use --mobile for mobile device testing`, 'gray')
      log(`   • View full report at: ${reportPath}`, 'gray')
    }

    log(`${'='.repeat(60)}\n`, 'bright')
  } catch (error) {
    log(`\n❌ Error running Lighthouse: ${error.message}`, 'red')
    if (options.verbose) {
      console.error(error)
    }
    process.exit(1)
  }
}

main()
