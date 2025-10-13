#!/usr/bin/env node
/**
 * Arlo Authentication - Real Browser Profile Method
 *
 * This script uses YOUR actual Chrome profile where you're already logged into Arlo.
 * It extracts the cookies from your real browser session, eliminating bot detection entirely.
 *
 * Steps:
 * 1. Make sure you're logged into my.arlo.com in your regular Chrome browser
 * 2. Run this script - it will use your real Chrome profile
 * 3. Extract the authentication cookies
 * 4. Save them for use with ArloAdapter
 */

import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use stealth plugin
puppeteer.use(StealthPlugin())

/**
 * Get Chrome user data directory path for different OS
 */
function getChromeUserDataDir() {
  const platform = os.platform()

  if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data')
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome')
  } else if (platform === 'linux') {
    return path.join(os.homedir(), '.config', 'google-chrome')
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

/**
 * Extract Arlo authentication from real Chrome profile
 */
async function extractArloAuthFromRealBrowser(options = {}) {
  const { headless = false, profile = 'Default' } = options

  let browser = null
  let page = null

  try {
    console.log("\n🌐 Using YOUR real Chrome profile (where you're already logged in)")

    const userDataDir = getChromeUserDataDir()
    console.log(`📁 Chrome profile: ${userDataDir}`)
    console.log(`👤 Profile name: ${profile}`)

    // Check if profile exists
    try {
      await fs.access(userDataDir)
    } catch (error) {
      throw new Error(
        `Chrome profile not found at ${userDataDir}\n` +
          'Please make sure Chrome is installed and you have used it at least once.'
      )
    }

    console.log('🚀 Launching Chrome with your profile...')
    console.log('⚠️  If Chrome is already running, close it first!\n')

    // Find Chrome executable on Windows
    const possibleChromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ]

    let executablePath = null
    for (const chromePath of possibleChromePaths) {
      try {
        await fs.access(chromePath)
        executablePath = chromePath
        console.log(`✅ Found Chrome at: ${chromePath}`)
        break
      } catch {
        // Try next path
      }
    }

    if (!executablePath) {
      throw new Error(
        'Could not find Chrome executable. Checked:\n' +
          possibleChromePaths.map(p => `  - ${p}`).join('\n') +
          '\n\nPlease install Chrome or set CHROME_PATH environment variable.'
      )
    }

    browser = await puppeteer.launch({
      headless: headless ? 'new' : false,
      executablePath,
      userDataDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        `--profile-directory=${profile}`,
      ],
    })

    page = await browser.newPage()

    console.log('📱 Navigating to Arlo...')
    await page.goto('https://my.arlo.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Wait a bit for any redirects
    await new Promise(resolve => setTimeout(resolve, 3000))

    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)

    // Check if we're logged in
    if (currentUrl.includes('login')) {
      console.log('\n❌ You are NOT logged into Arlo in this Chrome profile')
      console.log('\n📋 Next steps:')
      console.log('   1. Close Chrome completely')
      console.log('   2. Open Chrome normally (not via this script)')
      console.log('   3. Log into https://my.arlo.com/')
      console.log('   4. Once logged in, run this script again\n')
      return null
    }

    console.log('✅ You are logged in! Extracting cookies...\n')

    // Get all cookies
    const cookies = await page.cookies()

    // Filter for Arlo-specific cookies
    const arloCookies = cookies.filter(
      c =>
        c.domain.includes('arlo.com') ||
        c.name.includes('token') ||
        c.name.includes('auth') ||
        c.name.includes('session')
    )

    console.log(`🍪 Found ${arloCookies.length} Arlo cookies:`)
    arloCookies.forEach(cookie => {
      const valuePreview =
        cookie.value.length > 50 ? cookie.value.substring(0, 50) + '...' : cookie.value
      console.log(`   - ${cookie.name}: ${valuePreview}`)
    })

    // Try to extract auth token from localStorage
    const authData = await page.evaluate(() => {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('access_token')

      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id')

      return { token, userId, localStorage: { ...localStorage } }
    })

    console.log('\n📦 LocalStorage data:')
    if (authData.token) {
      const tokenPreview = authData.token.substring(0, 50) + '...'
      console.log(`   ✓ Token: ${tokenPreview}`)
    }
    if (authData.userId) {
      console.log(`   ✓ User ID: ${authData.userId}`)
    }

    // Return authentication data
    const result = {
      cookies: arloCookies,
      token: authData.token,
      userId: authData.userId,
      localStorage: authData.localStorage,
      extractedAt: new Date().toISOString(),
    }

    // Save to file
    const outputPath = path.join(__dirname, '..', 'data', 'arlo-real-auth.json')
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2))

    console.log(`\n💾 Saved authentication data to: ${outputPath}`)
    console.log('\n✅ SUCCESS! You can now use these cookies with ArloAdapter\n')

    return result
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    throw error
  } finally {
    if (page) await page.close().catch(() => {})
    if (browser) await browser.close().catch(() => {})
  }
}

// Main execution - always run when script is executed directly
const args = process.argv.slice(2)
const headless = args.includes('--headless')
const profile = args.find(arg => arg.startsWith('--profile='))?.split('=')[1] || 'Default'

console.log('======================================================================')
console.log('🎭 Arlo Real Browser Authentication Extractor')
console.log('======================================================================\n')

extractArloAuthFromRealBrowser({ headless, profile })
  .then(result => {
    if (result) {
      console.log('🎉 Authentication extraction complete!')
      process.exit(0)
    } else {
      console.log('⚠️  Please log into Arlo in Chrome first')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })

export { extractArloAuthFromRealBrowser, getChromeUserDataDir }
