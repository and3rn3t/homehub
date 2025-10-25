/**
 * Generate PWA Icons from SVG or Create Placeholders
 *
 * This script helps generate the required PWA icon sizes.
 *
 * OPTION 1: Use with Sharp (recommended for production)
 * npm install sharp --save-dev
 * node scripts/generate-pwa-icons.js path/to/your/icon.svg
 *
 * OPTION 2: Manual creation (for now)
 * Use any of these free tools:
 * - https://realfavicongenerator.net/
 * - https://favicon.io/
 * - https://www.pwabuilder.com/imageGenerator
 *
 * Required sizes:
 * - icon-192.png (192×192px) - Android install prompt
 * - icon-512.png (512×512px) - Android splash screen, maskable
 * - apple-touch-icon.png (180×180px) - iOS home screen
 * - favicon.ico (32×32px or multi-size) - Browser tab
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if Sharp is installed
let sharp
try {
  const sharpModule = await import('sharp')
  sharp = sharpModule.default
  console.log('✅ Sharp found - generating icons from source...')
} catch (error) {
  console.log('⚠️  Sharp not installed - generating placeholder instructions...')
  console.log('   Install with: npm install sharp --save-dev')
  console.log('')
  generatePlaceholderInstructions()
  process.exit(0)
} // Get source file from command line
const sourceFile = process.argv[2]

if (!sourceFile || !fs.existsSync(sourceFile)) {
  console.error('❌ Usage: node generate-pwa-icons.js <source-image>')
  console.error('   Example: node generate-pwa-icons.js logo.svg')
  console.error('')
  console.error('   Source file not found or not provided.')
  console.error('   Using placeholder instructions instead...')
  console.error('')
  generatePlaceholderInstructions()
  process.exit(1)
}

const publicDir = path.join(__dirname, '../public')

// Icon specifications
const icons = [
  { name: 'icon-192.png', size: 192, purpose: 'Android install prompt' },
  { name: 'icon-512.png', size: 512, purpose: 'Android splash screen' },
  { name: 'apple-touch-icon.png', size: 180, purpose: 'iOS home screen' },
  { name: 'favicon.ico', size: 32, purpose: 'Browser tab' },
]

console.log('🎨 Generating PWA icons...')
console.log('   Source:', sourceFile)
console.log('   Output:', publicDir)
console.log('')

// Generate each icon
Promise.all(
  icons.map(async icon => {
    const outputPath = path.join(publicDir, icon.name)

    try {
      await sharp(sourceFile)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toFile(outputPath)

      console.log(`✅ ${icon.name} (${icon.size}×${icon.size}px) - ${icon.purpose}`)
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}:`, error.message)
    }
  })
).then(() => {
  console.log('')
  console.log('✅ Icon generation complete!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('   1. Verify icons look good in public/ folder')
  console.log('   2. Run: npm run build')
  console.log('   3. Test PWA install prompt in Chrome DevTools')
  console.log('   4. Optional: Optimize with https://squoosh.app/')
})

function generatePlaceholderInstructions() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 PWA ICON GENERATION GUIDE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('You need to create these icon files in the public/ folder:')
  console.log('')
  console.log('📱 REQUIRED ICONS:')
  console.log('   ┌─────────────────────────────────────────────────────────┐')
  console.log('   │ icon-192.png        192×192px   Android install prompt  │')
  console.log('   │ icon-512.png        512×512px   Android splash screen   │')
  console.log('   │ apple-touch-icon.png 180×180px  iOS home screen         │')
  console.log('   │ favicon.ico         32×32px     Browser tab             │')
  console.log('   └─────────────────────────────────────────────────────────┘')
  console.log('')
  console.log('🛠️  OPTION 1: Use Online Tools (Fastest)')
  console.log('   1. Go to: https://realfavicongenerator.net/')
  console.log('   2. Upload your logo/icon (SVG or high-res PNG)')
  console.log('   3. Customize iOS, Android, and browser icons')
  console.log('   4. Download the package')
  console.log('   5. Copy files to public/ folder')
  console.log('')
  console.log('🛠️  OPTION 2: Use PWA Builder (Microsoft)')
  console.log('   1. Go to: https://www.pwabuilder.com/imageGenerator')
  console.log('   2. Upload your 512×512px+ source image')
  console.log('   3. Download generated icons')
  console.log('   4. Copy to public/ folder')
  console.log('')
  console.log('🛠️  OPTION 3: Use Favicon.io (Simple)')
  console.log('   1. Go to: https://favicon.io/')
  console.log('   2. Create from text, image, or emoji')
  console.log('   3. Download and extract')
  console.log('   4. Rename files to match requirements')
  console.log('')
  console.log('🛠️  OPTION 4: Use Sharp (Automated - Recommended)')
  console.log('   1. Install: npm install sharp --save-dev')
  console.log('   2. Run: node scripts/generate-pwa-icons.js logo.svg')
  console.log('   3. Icons auto-generated in public/')
  console.log('')
  console.log('🎨 DESIGN TIPS:')
  console.log('   • Use a simple, recognizable icon')
  console.log('   • Avoid text (hard to read at small sizes)')
  console.log('   • Use solid background or transparency')
  console.log('   • Test on both light and dark themes')
  console.log('   • For maskable: keep important content in "safe zone"')
  console.log('     (80% of icon area to avoid cropping)')
  console.log('')
  console.log('📱 iOS SPECIFIC:')
  console.log('   • iOS always adds rounded corners')
  console.log('   • Use square image with 20% padding')
  console.log('   • Avoid pre-rounded corners')
  console.log('   • Solid background recommended')
  console.log('')
  console.log('🤖 ANDROID SPECIFIC (Maskable Icons):')
  console.log('   • Adaptive icons can be cropped to circles/squares')
  console.log('   • Keep logo in center 80% area')
  console.log('   • Test at: https://maskable.app/')
  console.log('   • Consider different shapes')
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('✅ QUICK START FOR HOMEHUB:')
  console.log('   Theme: iOS Blue (#4a9eff)')
  console.log('   Suggestion: "🏠" house emoji on blue background')
  console.log('   OR: "H" letter in SF Pro font on blue background')
  console.log('')
  console.log('   Try this at favicon.io:')
  console.log('   1. Text: H')
  console.log('   2. Background: #4a9eff (iOS Blue)')
  console.log('   3. Font: Inter or Arial Bold')
  console.log('   4. Generate and download')
  console.log('')
}
