/**
 * Arlo Login - Step by Step with Screenshots
 * Takes a screenshot after each step for debugging
 */

import dotenv from 'dotenv'
import puppeteer from 'puppeteer'

dotenv.config()

async function stepByStepLogin() {
  const email = process.env.ARLO_EMAIL
  const password = process.env.ARLO_PASSWORD

  console.log('\n🎬 Arlo Login - Step by Step Debug\n')

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500, // Slow down to see what's happening
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  try {
    console.log('Step 1: Navigate to Arlo login page')
    await page.goto('https://my.arlo.com/#/login', { waitUntil: 'networkidle2' })
    await page.screenshot({ path: 'step1-initial-load.png' })
    console.log('  ✓ Screenshot: step1-initial-load.png')

    console.log('\nStep 2: Wait 5 seconds for page to fully load')
    await new Promise(r => setTimeout(r, 5000))
    await page.screenshot({ path: 'step2-after-wait.png' })
    console.log('  ✓ Screenshot: step2-after-wait.png')

    console.log('\nStep 3: Check page content')
    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log(`  Page text preview: ${bodyText.substring(0, 200)}...`)

    // Check if there's an iframe (common for login forms)
    const frames = page.frames()
    console.log(`  \n  Frames found: ${frames.length}`)
    frames.forEach((f, i) => {
      console.log(`    Frame ${i}: ${f.url()}`)
    })

    console.log('\nStep 4: Try to find email field')
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
    ]

    for (const selector of emailSelectors) {
      const found = await page.$(selector)
      console.log(`  ${selector}: ${found ? '✓ FOUND' : '✗ not found'}`)
    }

    console.log('\nStep 5: Get all input fields')
    const inputs = await page.$$eval('input', elements =>
      elements.map(el => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
      }))
    )
    console.log(`  Total inputs: ${inputs.length}`)
    inputs.forEach((inp, i) => {
      console.log(`  Input ${i + 1}:`, inp)
    })

    console.log('\nPress Ctrl+C when done inspecting the browser...')
    await new Promise(resolve => setTimeout(resolve, 120000))
  } catch (error) {
    console.error('Error:', error.message)
    await page.screenshot({ path: 'error-screenshot.png' })
  } finally {
    await browser.close()
  }
}

stepByStepLogin()
