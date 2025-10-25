/**
 * Simple Icon Migration Script
 * Converts Phosphor icons to Lucide in a single file
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Icon mapping
const ICON_MAP = {
  Lightbulb: 'LightbulbIcon',
  Thermometer: 'ThermometerIcon',
  Shield: 'ShieldIcon',
  WifiHigh: 'WifiIcon',
  WifiSlash: 'WifiOffIcon',
  DotsThree: 'MoreHorizontalIcon',
  Plus: 'PlusIcon',
  Clock: 'ClockIcon',
  ArrowsClockwise: 'RefreshIcon',
  BatteryFull: 'BatteryIcon',
  BatteryMedium: 'BatteryIcon',
  BatteryWarning: 'BatteryWarningIcon',
  Palette: 'PaletteIcon',
  Pencil: 'EditIcon',
  Sun: 'SunRoomIcon',
  Trash: 'TrashIcon',
  Trash2: 'TrashIcon',
  X: 'XIcon',
  Check: 'CheckIcon',
  CheckCircle: 'CheckCircleIcon',
  XCircle: 'XCircleIcon',
  Warning: 'AlertTriangleIcon',
  WarningCircle: 'AlertCircleIcon',
  Info: 'InfoIcon',
  Bell: 'BellIcon',
  BellSlash: 'BellOffIcon',
  Camera: 'CameraIcon',
  Lock: 'LockIcon',
  Play: 'PlayIcon',
  Pause: 'PauseIcon',
  Record: 'VideoIcon',
  Eye: 'EyeIcon',
  EyeSlash: 'EyeOffIcon',
  MapPin: 'MapPinIcon',
  CalendarBlank: 'CalendarIcon',
  FlowArrow: 'WorkflowIcon',
  CaretRight: 'ChevronRightIcon',
  Gear: 'SettingsIcon',
  GearSix: 'CogIcon',
  Wrench: 'WrenchIcon',
  ChartLineUp: 'LineChartIcon',
  TrendUp: 'TrendingUpIcon',
  TrendDown: 'TrendingDownIcon',
  Lightning: 'ZapIcon',
  Phone: 'PhoneIcon',
  PhoneDisconnect: 'PhoneOffIcon',
  Video: 'VideoIcon',
  VideoSlash: 'VideoOffIcon',
  Microphone: 'MicIcon',
  MicrophoneSlash: 'MicOffIcon',
  User: 'UserIcon',
  Users: 'UsersIcon',
  SpeakerHigh: 'SpeakerIcon',
  Television: 'TvIcon',
  DeviceMobile: 'UserIcon',
}

function convertFile(filePath) {
  console.log(`\n📄 Converting: ${filePath}`)

  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false

  // Convert import statement
  if (content.includes('@phosphor-icons/react')) {
    const importRegex = /import\s*{([^}]+)}\s*from\s*['"]@phosphor-icons\/react['"]/
    const match = content.match(importRegex)

    if (match) {
      const icons = match[1].split(',').map(i => i.trim())
      const lucideIcons = icons.map(icon => ICON_MAP[icon] || icon).join(', ')

      content = content.replace(importRegex, `import { ${lucideIcons} } from '@/lib/icons'`)

      modified = true
      console.log(`  ✓ Converted import: ${icons.length} icons`)
    }
  }

  // Convert size props to className
  const sizeMap = {
    16: 'h-4 w-4',
    18: 'h-[18px] w-[18px]',
    20: 'h-5 w-5',
    24: 'h-6 w-6',
  }

  for (const [size, className] of Object.entries(sizeMap)) {
    const regex = new RegExp(`size={${size}}`, 'g')
    if (content.match(regex)) {
      content = content.replace(regex, `className="${className}"`)
      modified = true
    }
  }

  // Fix duplicate classNames
  content = content.replace(/className="([^"]+)" className="([^"]+)"/g, 'className="$1 $2"')

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`  ✅ File updated`)
  } else {
    console.log(`  ⏭️  No changes needed`)
  }
}

// Get file path from command line
const filePath = process.argv[2]

if (!filePath) {
  console.error('❌ Please provide a file path')
  console.error('Usage: node scripts/simple-migrate.js <file-path>')
  process.exit(1)
}

const fullPath = path.resolve(filePath)

if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`)
  process.exit(1)
}

convertFile(fullPath)
console.log('\n✅ Migration complete!')
