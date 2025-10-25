/**
 * Arlo Puppeteer Authentication Service
 *
 * Uses headless Chrome to bypass Cloudflare protection and extract Arlo auth tokens.
 *
 * How it works:
 * 1. Launch headless Chrome browser
 * 2. Navigate to my.arlo.com login page
 * 3. Fill in email/password credentials
 * 4. Wait for Cloudflare challenge to complete (browser handles this)
 * 5. Wait for successful login redirect
 * 6. Extract auth cookies and tokens from browser session
 * 7. Return tokens for use with Arlo API
 *
 * @module ArloPuppeteerAuth
 */

import puppeteer, { Browser, Page } from 'puppeteer'

export interface ArloAuthTokens {
  token: string // Main auth token
  userId: string // User ID
  cookies: Array<{
    name: string
    value: string
    domain: string
    path: string
  }>
  expiresAt: Date // Token expiration time
}

export interface ArloPuppeteerOptions {
  headless?: boolean // Run browser in headless mode (default: true)
  timeout?: number // Max time to wait for login (default: 60000ms)
  slowMo?: number // Slow down actions for debugging (default: 0)
  userAgent?: string // Custom user agent (default: Chrome)
}

/**
 * Authenticate with Arlo using Puppeteer browser automation
 *
 * @param email - Arlo account email
 * @param password - Arlo account password
 * @param options - Optional configuration
 * @returns Auth tokens and cookies for API access
 *
 * @example
 * ```typescript
 * const tokens = await authenticateWithPuppeteer(
 *   'user@example.com',
 *   'password123'
 * )
 * console.log('Auth token:', tokens.token)
 * ```
 */
export async function authenticateWithPuppeteer(
  email: string,
  password: string,
  options: ArloPuppeteerOptions = {}
): Promise<ArloAuthTokens> {
  const {
    headless = true,
    timeout = 60000,
    slowMo = 0,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  } = options

  let browser: Browser | null = null
  let page: Page | null = null

  try {
    console.log('🚀 Launching browser...')

    // Launch browser with custom settings
    browser = await puppeteer.launch({
      headless: headless ? 'shell' : false, // Use shell headless mode (compatible with Puppeteer types)
      slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled', // Hide automation
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    })

    page = await browser.newPage()

    // Set user agent to mimic real browser
    await page.setUserAgent(userAgent)

    // Set viewport to common desktop resolution
    await page.setViewport({ width: 1920, height: 1080 })

    // Set extra headers to look more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    })

    console.log('📱 Navigating to Arlo login page...')

    // Navigate to Arlo login page
    await page.goto('https://my.arlo.com/#/login', {
      waitUntil: 'networkidle2',
      timeout,
    })

    // Wait a moment for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('✍️  Filling in credentials...')

    // Wait for email input to be visible
    await page.waitForSelector('input[type="email"], input[name="email"], #email', {
      timeout: 10000,
    })

    // Fill in email
    await page.type('input[type="email"], input[name="email"], #email', email, {
      delay: 100, // Mimic human typing
    })

    // Fill in password
    await page.type('input[type="password"], input[name="password"], #password', password, {
      delay: 100,
    })

    console.log('🔐 Submitting login form...')

    // Click login button
    await page.click('button[type="submit"], button[class*="login"], button[class*="submit"]')

    console.log('⏳ Waiting for Cloudflare challenge and login...')
    console.log('   (This may take 10-30 seconds)')

    // Wait for navigation after login - could be any of these URLs
    try {
      await page.waitForFunction(
        () => {
          const url = window.location.href
          return (
            url.includes('/dashboard') ||
            url.includes('/cameras') ||
            url.includes('/devices') ||
            !url.includes('/login')
          )
        },
        { timeout }
      )
    } catch (error) {
      // Check if we're still on login page (authentication failed)
      const currentUrl = page.url()
      if (currentUrl.includes('/login')) {
        throw new Error(
          'Login failed - still on login page. Check credentials or 2FA requirements.'
        )
      }
      throw error
    }

    console.log('✅ Login successful!')

    // Wait a moment for all cookies to be set
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('🍪 Extracting auth tokens and cookies...')

    // Get all cookies
    const cookies = await page.cookies()

    // Find the main auth token (Arlo uses different cookie names)
    const authCookie = cookies.find(
      c =>
        c.name === 'auth_token' || c.name === 'arlo_auth' || c.name.toLowerCase().includes('auth')
    )

    if (!authCookie) {
      console.warn('⚠️  Warning: Could not find standard auth cookie')
      console.log('Available cookies:', cookies.map(c => c.name).join(', '))
    }

    // Extract user ID from local storage or cookies
    const userId = await page.evaluate(() => {
      // Try to get user ID from localStorage
      const userIdFromStorage =
        localStorage.getItem('userId') || localStorage.getItem('arlo_user_id')
      if (userIdFromStorage) return userIdFromStorage

      // Try to get from window object
      // @ts-expect-error - arlo object may not exist on window
      if (window.arlo && window.arlo.userId) return window.arlo.userId

      // Fallback to extracting from URL or other sources
      return 'unknown'
    })

    // Calculate expiration (Arlo tokens typically last 24 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const tokens: ArloAuthTokens = {
      token: authCookie?.value || cookies[0]?.value || '',
      userId: userId || 'unknown',
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
      })),
      expiresAt,
    }

    console.log('✅ Auth tokens extracted successfully!')
    console.log(`   User ID: ${tokens.userId}`)
    console.log(`   Token expires: ${tokens.expiresAt.toLocaleString()}`)
    console.log(`   Total cookies: ${tokens.cookies.length}`)

    return tokens
  } catch (error) {
    console.error('❌ Puppeteer authentication failed:', error)
    throw error
  } finally {
    // Clean up
    if (page) {
      await page.close().catch(() => {})
    }
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}

/**
 * Test if existing tokens are still valid
 *
 * @param tokens - Previously extracted tokens
 * @returns True if tokens are still valid
 */
export function areTokensValid(tokens: ArloAuthTokens): boolean {
  if (!tokens.token) return false
  if (!tokens.expiresAt) return false

  const now = new Date()
  const expiresAt = new Date(tokens.expiresAt)

  // Tokens expire in less than 1 hour? Consider them invalid
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  return expiresAt > oneHourFromNow
}

/**
 * Save tokens to file for reuse
 *
 * @param tokens - Tokens to save
 * @param filePath - Path to save tokens (default: .arlo-tokens.json)
 */
export async function saveTokens(
  tokens: ArloAuthTokens,
  filePath: string = '.arlo-tokens.json'
): Promise<void> {
  const fs = await import('fs/promises')
  await fs.writeFile(filePath, JSON.stringify(tokens, null, 2))
  console.log(`💾 Tokens saved to ${filePath}`)
}

/**
 * Load tokens from file
 *
 * @param filePath - Path to load tokens from (default: .arlo-tokens.json)
 * @returns Saved tokens or null if file doesn't exist
 */
export async function loadTokens(
  filePath: string = '.arlo-tokens.json'
): Promise<ArloAuthTokens | null> {
  try {
    const fs = await import('fs/promises')
    const data = await fs.readFile(filePath, 'utf-8')
    const tokens = JSON.parse(data) as ArloAuthTokens

    // Convert date string back to Date object
    tokens.expiresAt = new Date(tokens.expiresAt)

    return tokens
  } catch (_error) {
    return null
  }
}
