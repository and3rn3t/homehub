/**
 * Arlo Puppeteer Authentication Service (JavaScript)
 *
 * Uses headless Chrome to bypass Cloudflare protection and extract Arlo auth tokens.
 * Now with stealth mode to avoid bot detection!
 */

import fs from 'fs/promises'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// Use stealth plugin to hide automation
puppeteer.use(StealthPlugin())

/**
 * Authenticate with Arlo using Puppeteer browser automation
 */
export async function authenticateWithPuppeteer(email, password, options = {}) {
  const {
    headless = true,
    timeout = 60000,
    slowMo = 0,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  } = options

  let browser = null
  let page = null

  try {
    console.log('🚀 Launching browser...')

    // Launch browser with custom settings
    browser = await puppeteer.launch({
      headless: headless ? 'new' : false,
      slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    })

    page = await browser.newPage()

    // Set user agent to mimic real browser
    await page.setUserAgent(userAgent)

    // Set viewport to common desktop resolution
    await page.setViewport({ width: 1920, height: 1080 })

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    })

    // Add extra evasions on every page load
    await page.evaluateOnNewDocument(() => {
      // Hide webdriver more thoroughly
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })

      // Mock chrome runtime
      window.chrome = { runtime: {} }

      // Mock permissions
      const originalQuery = window.navigator.permissions.query
      window.navigator.permissions.query = parameters =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters)
    })

    console.log('📱 Navigating to Arlo login page...')

    // Navigate to Arlo login page
    await page.goto('https://my.arlo.com/#/login', {
      waitUntil: 'networkidle2',
      timeout,
    })

    // Random delay before interacting (2-4 seconds) - appear more human
    const initialDelay = Math.floor(Math.random() * 2000) + 2000
    console.log(`⏳ Initial delay: ${initialDelay}ms (simulating human reading)`)
    await new Promise(resolve => setTimeout(resolve, initialDelay))

    // Move mouse randomly like a human would
    const mouseX = Math.floor(Math.random() * 400) + 300
    const mouseY = Math.floor(Math.random() * 400) + 200
    console.log(`🖱️  Moving mouse to (${mouseX}, ${mouseY})`)
    await page.mouse.move(mouseX, mouseY, { steps: 10 })

    // Wait for page to load and dynamic content to render
    console.log('⏳ Waiting for login form to load...')
    await new Promise(resolve => setTimeout(resolve, 5000)) // Increased wait time

    console.log('✍️  Filling in credentials...')

    // Try multiple selectors for email field
    let emailSelector = null
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      'input[autocomplete="email"]',
      'input[autocomplete="username"]',
    ]

    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        emailSelector = selector
        console.log(`   ✓ Found email field: ${selector}`)
        break
      } catch (e) {
        // Try next selector
      }
    }

    if (!emailSelector) {
      throw new Error('Could not find email input field. Arlo page structure may have changed.')
    }

    // Move mouse to email field and click (like a human)
    const emailBox = await page.$(emailSelector)
    const emailBoundingBox = await emailBox.boundingBox()
    if (emailBoundingBox) {
      const emailX = emailBoundingBox.x + emailBoundingBox.width / 2
      const emailY = emailBoundingBox.y + emailBoundingBox.height / 2
      console.log(`🖱️  Moving to email field (${Math.floor(emailX)}, ${Math.floor(emailY)})`)
      await page.mouse.move(emailX, emailY, { steps: 15 })
      await new Promise(resolve => setTimeout(resolve, 300)) // Pause before clicking
    }

    // Click and type email with realistic delays
    await page.click(emailSelector, { clickCount: 3 }) // Select all
    await new Promise(resolve => setTimeout(resolve, 200)) // Pause after selecting

    // Type email with random delays between keystrokes (50-150ms)
    for (const char of email) {
      await page.keyboard.type(char, { delay: Math.floor(Math.random() * 100) + 50 })
    }
    console.log('   ✓ Email entered with human-like timing')

    // Random delay before moving to password (500ms-1500ms)
    const betweenFieldsDelay = Math.floor(Math.random() * 1000) + 500
    await new Promise(resolve => setTimeout(resolve, betweenFieldsDelay))

    // Try multiple selectors for password field
    let passwordSelector = null
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Password" i]',
      'input[autocomplete="current-password"]',
    ]

    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        passwordSelector = selector
        console.log(`   ✓ Found password field: ${selector}`)
        break
      } catch (e) {
        // Try next selector
      }
    }

    if (!passwordSelector) {
      throw new Error('Could not find password input field. Arlo page structure may have changed.')
    }

    // Move mouse to password field and click (like a human)
    const passwordBox = await page.$(passwordSelector)
    const passwordBoundingBox = await passwordBox.boundingBox()
    if (passwordBoundingBox) {
      const passwordX = passwordBoundingBox.x + passwordBoundingBox.width / 2
      const passwordY = passwordBoundingBox.y + passwordBoundingBox.height / 2
      console.log(
        `🖱️  Moving to password field (${Math.floor(passwordX)}, ${Math.floor(passwordY)})`
      )
      await page.mouse.move(passwordX, passwordY, { steps: 15 })
      await new Promise(resolve => setTimeout(resolve, 300)) // Pause before clicking
    }

    // Click and type password with realistic delays
    await page.click(passwordSelector, { clickCount: 3 }) // Select all
    await new Promise(resolve => setTimeout(resolve, 200)) // Pause after selecting

    // Type password with random delays between keystrokes (50-150ms)
    for (const char of password) {
      await page.keyboard.type(char, { delay: Math.floor(Math.random() * 100) + 50 })
    }
    console.log('   ✓ Password entered with human-like timing')

    // Random delay before clicking submit (500ms-2000ms)
    const beforeSubmitDelay = Math.floor(Math.random() * 1500) + 500
    console.log(`⏳ Pausing ${beforeSubmitDelay}ms before submitting...`)
    await new Promise(resolve => setTimeout(resolve, beforeSubmitDelay))

    console.log('🔐 Submitting login form...')

    // Try multiple selectors for submit button
    let submitSelector = null
    const submitSelectors = [
      'button[type="submit"]',
      'button[id*="login" i]',
      'button[id*="signin" i]',
      'button[class*="login" i]',
      'button[class*="submit" i]',
      'input[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Log In")',
      'button:has-text("Login")',
    ]

    for (const selector of submitSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        submitSelector = selector
        console.log(`   ✓ Found submit button: ${selector}`)
        break
      } catch (e) {
        // Try next selector
      }
    }

    if (!submitSelector) {
      console.warn('⚠️  Could not find submit button, trying Enter key instead')
      await page.keyboard.press('Enter')
    } else {
      await page.click(submitSelector)
    }

    console.log('⏳ Waiting for Cloudflare challenge and login...')
    console.log('   (This may take 10-30 seconds)')

    // Wait for successful login
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
      const currentUrl = page.url()
      if (currentUrl.includes('/login')) {
        throw new Error(
          'Login failed - still on login page. Check credentials or 2FA requirements.'
        )
      }
      throw error
    }

    console.log('✅ Login successful!')

    // Wait for cookies to be set
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('🍪 Extracting auth tokens and cookies...')

    // Get all cookies
    const cookies = await page.cookies()

    // Find auth cookie
    const authCookie = cookies.find(
      c =>
        c.name === 'auth_token' || c.name === 'arlo_auth' || c.name.toLowerCase().includes('auth')
    )

    if (!authCookie) {
      console.warn('⚠️  Warning: Could not find standard auth cookie')
      console.log('Available cookies:', cookies.map(c => c.name).join(', '))
    }

    // Extract user ID
    const userId = await page.evaluate(() => {
      const userIdFromStorage =
        localStorage.getItem('userId') || localStorage.getItem('arlo_user_id')
      if (userIdFromStorage) return userIdFromStorage

      if (window.arlo && window.arlo.userId) return window.arlo.userId

      return 'unknown'
    })

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const tokens = {
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
 */
export function areTokensValid(tokens) {
  if (!tokens.token) return false
  if (!tokens.expiresAt) return false

  const now = new Date()
  const expiresAt = new Date(tokens.expiresAt)
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  return expiresAt > oneHourFromNow
}

/**
 * Save tokens to file
 */
export async function saveTokens(tokens, filePath = '.arlo-tokens.json') {
  await fs.writeFile(filePath, JSON.stringify(tokens, null, 2))
  console.log(`💾 Tokens saved to ${filePath}`)
}

/**
 * Load tokens from file
 */
export async function loadTokens(filePath = '.arlo-tokens.json') {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    const tokens = JSON.parse(data)
    tokens.expiresAt = new Date(tokens.expiresAt)
    return tokens
  } catch (_error) {
    return null
  }
}
