/**
 * Test Arlo Puppeteer Authentication
 *
 * This script tests the Puppeteer-based authentication with Arlo.
 * It will:
 * 1. Launch a browser
 * 2. Login to my.arlo.com
 * 3. Extract auth tokens
 * 4. Save tokens to file
 * 5. Test token validity
 *
 * Usage:
 *   node scripts/test-arlo-puppeteer.js
 *   node scripts/test-arlo-puppeteer.js --headless=false  (see browser)
 *   node scripts/test-arlo-puppeteer.js --save-tokens     (save for reuse)
 */

import dotenv from 'dotenv'
import {
  areTokensValid,
  authenticateWithPuppeteer,
  loadTokens,
  saveTokens,
} from './arlo-puppeteer-auth.js'

dotenv.config()

// Parse command line arguments
const args = process.argv.slice(2)
const showBrowser = args.includes('--headless=false')
const saveTokensFlag = args.includes('--save-tokens')
const useExistingTokens = args.includes('--use-existing')

async function testPuppeteerAuth() {
  console.log('\n' + '='.repeat(70))
  console.log('🎭 Arlo Puppeteer Authentication Test')
  console.log('='.repeat(70) + '\n')

  // Get credentials from environment
  const email = process.env.ARLO_EMAIL
  const password = process.env.ARLO_PASSWORD

  if (!email || !password) {
    console.error('❌ Error: ARLO_EMAIL and ARLO_PASSWORD must be set in .env file')
    process.exit(1)
  }

  console.log(`📧 Email: ${email}`)
  console.log(`🔒 Password: ${'*'.repeat(password.length)}`)
  console.log()

  try {
    let tokens

    // Check if we should use existing tokens
    if (useExistingTokens) {
      console.log('🔍 Checking for existing tokens...')
      tokens = await loadTokens()

      if (tokens && areTokensValid(tokens)) {
        console.log('✅ Found valid existing tokens!')
        console.log(`   User ID: ${tokens.userId}`)
        console.log(`   Expires: ${tokens.expiresAt.toLocaleString()}`)
        console.log()
      } else {
        console.log('⚠️  No valid existing tokens found, will authenticate...')
        tokens = null
      }
    }

    // Authenticate if we don't have valid tokens
    if (!tokens) {
      console.log('🚀 Starting Puppeteer authentication...')
      console.log()

      if (showBrowser) {
        console.log('👀 Browser window will be visible (--headless=false)')
        console.log()
      }

      const startTime = Date.now()

      tokens = await authenticateWithPuppeteer(email, password, {
        headless: !showBrowser,
        timeout: 60000, // 60 seconds
        slowMo: showBrowser ? 50 : 0, // Slow down if visible for debugging
      })

      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log()
      console.log(`✅ Authentication completed in ${duration}s`)
      console.log()

      // Save tokens if requested
      if (saveTokensFlag) {
        await saveTokens(tokens)
        console.log()
      }
    }

    // Display extracted tokens
    console.log('📊 Token Details:')
    console.log('─'.repeat(70))
    console.log(`User ID:       ${tokens.userId}`)
    console.log(`Token:         ${tokens.token.substring(0, 30)}...`)
    console.log(`Expires:       ${tokens.expiresAt.toLocaleString()}`)
    console.log(`Valid:         ${areTokensValid(tokens) ? '✅ Yes' : '❌ No'}`)
    console.log(`Cookie Count:  ${tokens.cookies.length}`)
    console.log()

    // Display cookie details
    console.log('🍪 Cookies Extracted:')
    console.log('─'.repeat(70))
    tokens.cookies.forEach((cookie, index) => {
      const valuePreview = cookie.value.substring(0, 30) + (cookie.value.length > 30 ? '...' : '')
      console.log(`${index + 1}. ${cookie.name}`)
      console.log(`   Domain: ${cookie.domain}`)
      console.log(`   Path:   ${cookie.path}`)
      console.log(`   Value:  ${valuePreview}`)
      console.log()
    })

    // Test token validity check
    console.log('🔍 Token Validity Check:')
    console.log('─'.repeat(70))
    if (areTokensValid(tokens)) {
      console.log('✅ Tokens are valid and ready to use!')
      console.log()
      console.log('💡 Next Steps:')
      console.log('   1. Use these tokens with Arlo API')
      console.log('   2. Tokens expire in ~24 hours')
      console.log('   3. Re-run this script when tokens expire')
    } else {
      console.log('⚠️  Tokens are expired or will expire soon')
      console.log('   Please re-authenticate')
    }
    console.log()

    // Show usage instructions
    console.log('📚 Usage Tips:')
    console.log('─'.repeat(70))
    console.log('• Save tokens for reuse:')
    console.log('  node scripts/test-arlo-puppeteer.js --save-tokens')
    console.log()
    console.log('• Use existing tokens:')
    console.log('  node scripts/test-arlo-puppeteer.js --use-existing')
    console.log()
    console.log('• See browser in action:')
    console.log('  node scripts/test-arlo-puppeteer.js --headless=false')
    console.log()

    console.log('='.repeat(70))
    console.log('✅ Test Complete!')
    console.log('='.repeat(70) + '\n')
  } catch (error) {
    console.error('\n❌ Authentication failed!')
    console.error('Error:', error.message)
    console.error()

    if (error.message.includes('still on login page')) {
      console.error('💡 Possible issues:')
      console.error('   • Wrong email or password')
      console.error('   • 2FA is enabled (not yet supported)')
      console.error('   • Account locked or requires verification')
      console.error()
      console.error('   Try running with --headless=false to see what happens')
    } else if (error.message.includes('timeout')) {
      console.error('💡 Possible issues:')
      console.error('   • Slow internet connection')
      console.error('   • Cloudflare taking longer than expected')
      console.error('   • Arlo website is down')
      console.error()
      console.error('   Try running again or increase timeout')
    } else if (error.message.includes('Navigation')) {
      console.error('💡 Possible issues:')
      console.error('   • Arlo website structure changed')
      console.error('   • Network connectivity issues')
      console.error()
      console.error('   Try running with --headless=false to debug')
    }

    process.exit(1)
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Test cancelled by user')
  process.exit(0)
})

// Run the test
testPuppeteerAuth()
