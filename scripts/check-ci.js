#!/usr/bin/env node

/**
 * GitHub Actions CI/CD Status Checker
 *
 * Check the status of GitHub Actions workflows from the command line.
 *
 * Usage:
 *   node scripts/check-ci.js           # Check latest run
 *   node scripts/check-ci.js --all     # Show last 5 runs
 *   node scripts/check-ci.js --watch   # Watch until complete
 *   node scripts/check-ci.js --verbose # Show job details
 *
 * Environment Variables:
 *   GITHUB_TOKEN - Personal access token for higher rate limits (optional)
 */

import https from 'https'

// Configuration
const OWNER = 'and3rn3t'
const REPO = 'homehub'
const WORKFLOW_FILE = 'ci.yml' // Or use workflow ID
const POLL_INTERVAL = 10000 // 10 seconds
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// Parse command-line arguments
const args = process.argv.slice(2)
const showAll = args.includes('--all')
const watch = args.includes('--watch')
const verbose = args.includes('--verbose')

// Status emoji mapping
const STATUS_EMOJI = {
  completed: '✅',
  in_progress: '⏳',
  queued: '⏸️',
  waiting: '⏸️',
  requested: '⏸️',
  pending: '⏸️',
}

const CONCLUSION_EMOJI = {
  success: '✅',
  failure: '❌',
  cancelled: '⚫',
  skipped: '⏭️',
  timed_out: '⏱️',
  action_required: '⚠️',
  neutral: '⚪',
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

/**
 * Make GitHub API request
 */
function githubRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'HomeHub-CI-Checker',
        Accept: 'application/vnd.github.v3+json',
      },
    }

    if (GITHUB_TOKEN) {
      options.headers.Authorization = `token ${GITHUB_TOKEN}`
    }

    const req = https.request(options, res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} ${res.statusMessage}\n${data}`))
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Format date as relative time
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  } else {
    return 'just now'
  }
}

/**
 * Display workflow run details
 */
function displayRun(run, index = null) {
  const status = run.status
  const conclusion = run.conclusion
  const emoji = STATUS_EMOJI[status] || '❓'
  const conclusionEmoji = conclusion ? CONCLUSION_EMOJI[conclusion] || '❓' : ''

  // Calculate duration
  const startTime = new Date(run.created_at)
  const endTime = run.updated_at ? new Date(run.updated_at) : new Date()
  const duration = endTime - startTime

  // Header
  if (index !== null) {
    console.log(
      `\n${colors.dim}───────────────────────────────────────────────────────${colors.reset}`
    )
    console.log(`${colors.bright}Run #${index + 1}${colors.reset}`)
  }

  // Status line
  const statusColor =
    status === 'completed'
      ? conclusion === 'success'
        ? colors.green
        : colors.red
      : status === 'in_progress'
        ? colors.yellow
        : colors.gray

  console.log(
    `${emoji} ${statusColor}${status.toUpperCase()}${colors.reset}${conclusionEmoji ? ` ${conclusionEmoji} ${conclusion}` : ''}`
  )

  // Details
  console.log(`${colors.cyan}Commit:${colors.reset} ${run.head_commit?.message || 'N/A'}`)
  console.log(
    `${colors.cyan}Branch:${colors.reset} ${run.head_branch || 'N/A'} (${run.head_sha.substring(0, 7)})`
  )
  console.log(
    `${colors.cyan}Started:${colors.reset} ${formatRelativeTime(run.created_at)} (${new Date(run.created_at).toLocaleString()})`
  )
  console.log(`${colors.cyan}Duration:${colors.reset} ${formatDuration(duration)}`)

  if (run.html_url) {
    console.log(`${colors.cyan}URL:${colors.reset} ${colors.blue}${run.html_url}${colors.reset}`)
  }

  // Job details (if available)
  if (run.jobs && verbose) {
    console.log(`\n${colors.bright}Jobs:${colors.reset}`)
    run.jobs.forEach(job => {
      const jobEmoji = STATUS_EMOJI[job.status] || '❓'
      const jobConclusionEmoji = job.conclusion ? CONCLUSION_EMOJI[job.conclusion] || '❓' : ''
      console.log(
        `  ${jobEmoji} ${job.name} - ${job.status}${jobConclusionEmoji ? ` ${jobConclusionEmoji}` : ''}`
      )
    })
  }
}

/**
 * Fetch and display CI status
 */
async function checkCI() {
  try {
    console.log(`${colors.bright}Checking CI/CD status for ${OWNER}/${REPO}...${colors.reset}\n`)

    // Fetch workflow runs
    const runsData = await githubRequest(
      `/repos/${OWNER}/${REPO}/actions/runs?per_page=${showAll ? 5 : 1}`
    )

    if (!runsData.workflow_runs || runsData.workflow_runs.length === 0) {
      console.log(`${colors.yellow}⚠️  No workflow runs found${colors.reset}`)
      console.log(`\nTip: Make sure you've pushed commits and the workflow has been triggered.`)
      return null
    }

    const runs = runsData.workflow_runs

    if (showAll) {
      console.log(`${colors.bright}Last ${runs.length} workflow runs:${colors.reset}`)
      runs.forEach((run, index) => displayRun(run, index))
    } else {
      const latestRun = runs[0]
      console.log(`${colors.bright}Latest workflow run:${colors.reset}\n`)
      displayRun(latestRun)

      // Fetch jobs for latest run if verbose
      if (verbose && latestRun.jobs_url) {
        try {
          const jobsData = await githubRequest(
            latestRun.jobs_url.replace('https://api.github.com', '')
          )
          latestRun.jobs = jobsData.jobs
          console.log(`\n${colors.bright}Jobs:${colors.reset}`)
          latestRun.jobs.forEach(job => {
            const jobEmoji = STATUS_EMOJI[job.status] || '❓'
            const jobConclusionEmoji = job.conclusion
              ? CONCLUSION_EMOJI[job.conclusion] || '❓'
              : ''
            console.log(
              `  ${jobEmoji} ${job.name} - ${job.status}${jobConclusionEmoji ? ` ${jobConclusionEmoji}` : ''}`
            )
          })
        } catch (err) {
          if (verbose) {
            console.error(`${colors.red}Failed to fetch jobs: ${err.message}${colors.reset}`)
          }
        }
      }

      return latestRun
    }

    console.log(
      `\n${colors.dim}───────────────────────────────────────────────────────${colors.reset}`
    )

    if (!GITHUB_TOKEN) {
      console.log(
        `\n${colors.yellow}💡 Tip: Set GITHUB_TOKEN environment variable for higher rate limits${colors.reset}`
      )
    }

    return runs[0]
  } catch (err) {
    console.error(`${colors.red}❌ Error: ${err.message}${colors.reset}`)
    if (err.message.includes('401')) {
      console.log(
        `\n${colors.yellow}Authentication failed. Check your GITHUB_TOKEN.${colors.reset}`
      )
    } else if (err.message.includes('404')) {
      console.log(
        `\n${colors.yellow}Repository not found. Check OWNER and REPO values.${colors.reset}`
      )
    }
    process.exit(1)
  }
}

/**
 * Watch mode - poll until completion
 */
async function watchCI() {
  console.log(`${colors.bright}👀 Watching CI/CD status (Ctrl+C to stop)...${colors.reset}\n`)

  let lastStatus = null
  let iteration = 0

  const poll = async () => {
    iteration++

    if (iteration > 1) {
      // Clear previous output (move cursor up and clear lines)
      process.stdout.write('\x1b[2K\r') // Clear current line
    }

    const run = await checkCI()

    if (!run) {
      console.log(`${colors.yellow}No runs to watch${colors.reset}`)
      return
    }

    if (run.status !== lastStatus) {
      lastStatus = run.status
      console.log(`\n${colors.bright}Status changed: ${run.status}${colors.reset}`)
    }

    if (run.status === 'completed') {
      console.log(
        `\n${colors.green}✅ Workflow completed with status: ${run.conclusion}${colors.reset}`
      )
      process.exit(run.conclusion === 'success' ? 0 : 1)
    } else {
      // Continue polling
      console.log(`\n${colors.dim}Checking again in 10 seconds...${colors.reset}`)
      setTimeout(poll, 10000)
    }
  }

  await poll()
}

// Main execution
if (watch) {
  watchCI()
} else {
  checkCI()
}
