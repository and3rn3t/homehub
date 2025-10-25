/**
 * Debug Arlo Login Page Structure
 *
 * This script opens the Arlo login page and shows us the actual HTML structure
 * so we can find the correct selectors for email/password fields.
 */

import dotenv from 'dotenv'
import puppeteer from 'puppeteer'

dotenv.config()

async function debugArloLoginPage() {
  console.log('\n🔍 Arlo Login Page Structure Debug\n')
  console.log('This will:')
  console.log('  1. Open browser window (visible)')
  console.log('  2. Navigate to Arlo login page')
  console.log('  3. Show all input fields found')
  console.log('  4. Show all buttons found')
  console.log('  5. Take a screenshot')
  console.log()

  const browser = await puppeteer.launch({
    headless: false, // Visible
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    console.log('📱 Navigating to Arlo login page...')
    await page.goto('https://my.arlo.com/#/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    console.log('✅ Page loaded!')
    console.log()

    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Find all input fields
    console.log('📝 Input Fields Found:')
    console.log('─'.repeat(70))
    const inputs = await page.$$('input')
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const type = await input.evaluate(el => el.type)
      const name = await input.evaluate(el => el.name)
      const id = await input.evaluate(el => el.id)
      const placeholder = await input.evaluate(el => el.placeholder)
      const classes = await input.evaluate(el => el.className)

      console.log(`\nInput ${i + 1}:`)
      console.log(`  Type:        ${type}`)
      console.log(`  Name:        ${name}`)
      console.log(`  ID:          ${id}`)
      console.log(`  Placeholder: ${placeholder}`)
      console.log(`  Classes:     ${classes}`)
    }

    // Find all buttons
    console.log('\n\n🔘 Buttons Found:')
    console.log('─'.repeat(70))
    const buttons = await page.$$('button')
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]
      const type = await button.evaluate(el => el.type)
      const text = await button.evaluate(el => el.textContent?.trim())
      const classes = await button.evaluate(el => el.className)
      const id = await button.evaluate(el => el.id)

      console.log(`\nButton ${i + 1}:`)
      console.log(`  Type:    ${type}`)
      console.log(`  Text:    ${text}`)
      console.log(`  ID:      ${id}`)
      console.log(`  Classes: ${classes}`)
    }

    // Get page title and URL
    console.log('\n\n📄 Page Info:')
    console.log('─'.repeat(70))
    console.log(`Title: ${await page.title()}`)
    console.log(`URL:   ${page.url()}`)

    // Take screenshot
    await page.screenshot({ path: 'arlo-login-debug.png', fullPage: true })
    console.log('\n📸 Screenshot saved: arlo-login-debug.png')

    // Check for Cloudflare
    const bodyText = await page.evaluate(() => document.body.textContent)
    if (bodyText.includes('Cloudflare') || bodyText.includes('Just a moment')) {
      console.log('\n⚠️  CLOUDFLARE CHALLENGE DETECTED!')
      console.log('   The page is showing a Cloudflare challenge')
      console.log('   This is expected - it should resolve automatically')
    }

    console.log('\n💡 Browser will stay open for 60 seconds so you can inspect...')
    await new Promise(resolve => setTimeout(resolve, 60000))
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await browser.close()
  }
}

debugArloLoginPage()
