/**
 * Phosphor to Lucide Migration Script
 *
 * Automatically converts Phosphor icon imports to Lucide React imports.
 * Run with: node scripts/migrate-icons.js [file-pattern]
 *
 * Examples:
 *   node scripts/migrate-icons.js src/components/Dashboard.tsx
 *   node scripts/migrate-icons.js "src/components/*.tsx"
 */

import fs from 'fs'
import { glob } from 'glob'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Phosphor → Lucide icon name mapping
const ICON_MAP = {
  // Device Icons
  Lightbulb: 'LightbulbIcon',
  Thermometer: 'ThermometerIcon',
  Shield: 'ShieldIcon',
  WifiHigh: 'WifiIcon',
  WifiSlash: 'WifiOffIcon',
  Camera: 'CameraIcon',
  Lock: 'LockIcon',
  Fan: 'FanIcon',
  Television: 'TvIcon',
  SpeakerHigh: 'SpeakerIcon',
  Lightning: 'ZapIcon',
  Drop: 'DropletIcon',
  Power: 'PowerIcon',

  // Room Icons
  House: 'HouseIcon',
  Couch: 'SofaIcon',
  Bed: 'BedIcon',
  ForkKnife: 'UtensilsIcon',
  Bathtub: 'BathIcon',
  Desk: 'BriefcaseIcon',
  Garage: 'WarehouseIcon',
  Tree: 'TreeIcon',
  Sun: 'SunRoomIcon',

  // Navigation Icons
  HomeIcon: 'HouseIcon',
  Layers: 'LayersIcon',
  FlowArrow: 'WorkflowIcon',
  Sparkle: 'SparklesIcon',
  BatteryMedium: 'BatteryIcon',
  Activity: 'ActivityIcon',
  ShieldCheck: 'ShieldCheckIcon',
  Users: 'UsersIcon',
  ChartLine: 'LineChartIcon',
  Archive: 'ArchiveIcon',
  Gear: 'SettingsIcon',

  // Action Icons
  Plus: 'PlusIcon',
  X: 'XIcon',
  Check: 'CheckIcon',
  CaretRight: 'ChevronRightIcon',
  CaretLeft: 'ChevronLeftIcon',
  CaretDown: 'ChevronDownIcon',
  CaretUp: 'ChevronUpIcon',
  DotsThree: 'MoreHorizontalIcon',
  DotsThreeVertical: 'MoreVerticalIcon',
  Pencil: 'EditIcon',
  Trash: 'TrashIcon',
  Copy: 'CopyIcon',
  ShareNetwork: 'ShareIcon',
  DownloadSimple: 'DownloadIcon',
  UploadSimple: 'UploadIcon',
  ArrowsClockwise: 'RefreshIcon',
  MagnifyingGlass: 'SearchIcon',
  FunnelSimple: 'FilterIcon',
  Sliders: 'SlidersIcon',

  // Status Icons
  CheckCircle: 'CheckCircleIcon',
  XCircle: 'XCircleIcon',
  Warning: 'AlertTriangleIcon',
  WarningCircle: 'AlertCircleIcon',
  Info: 'InfoIcon',
  BatteryWarning: 'BatteryWarningIcon',
  WifiMedium: 'SignalIcon',
  WifiLow: 'SignalLowIcon',

  // Time & Schedule Icons
  Clock: 'ClockIcon',
  CalendarBlank: 'CalendarIcon',
  Timer: 'TimerIcon',
  SunHorizon: 'SunriseIcon',
  Moon: 'MoonIcon',
  CloudSun: 'CloudSunIcon',

  // Location Icons
  MapPin: 'MapPinIcon',
  NavigationArrow: 'NavigationIcon',
  Compass: 'CompassIcon',
  MapTrifold: 'MapIcon',

  // Communication Icons
  Bell: 'BellIcon',
  BellSlash: 'BellOffIcon',
  Phone: 'PhoneIcon',
  PhoneDisconnect: 'PhoneOffIcon',
  Video: 'VideoIcon',
  VideoSlash: 'VideoOffIcon',
  Microphone: 'MicIcon',
  MicrophoneSlash: 'MicOffIcon',
  ChatCircle: 'MessageIcon',
  EnvelopeSimple: 'MailIcon',

  // Media Icons
  Play: 'PlayIcon',
  Pause: 'PauseIcon',
  SkipForward: 'SkipForwardIcon',
  SkipBack: 'SkipBackIcon',
  SpeakerSimpleHigh: 'VolumeIcon',
  SpeakerSimpleSlash: 'VolumeOffIcon',
  SpeakerSimpleLow: 'VolumeLowIcon',

  // Automation Icons
  CalendarDays: 'CalendarDaysIcon',
  GitBranch: 'GitBranchIcon',

  // Energy Icons
  Zap: 'BoltIcon',
  TrendUp: 'TrendingUpIcon',
  TrendDown: 'TrendingDownIcon',
  ChartBar: 'BarChartIcon',
  ChartPie: 'PieChartIcon',
  ChartLineUp: 'LineChartIcon',

  // Security Icons
  Eye: 'EyeIcon',
  EyeSlash: 'EyeOffIcon',
  ShieldWarning: 'ShieldAlertIcon',
  ShieldSlash: 'ShieldXIcon',

  // Building Icons
  Buildings: 'BuildingIcon',
  Storefront: 'StoreIcon',
  GraduationCap: 'SchoolIcon',
  ShoppingBag: 'StoreIcon',

  // Utility Icons
  Wrench: 'WrenchIcon',
  GearSix: 'CogIcon',
  Package: 'PackageIcon',

  // Arrow Icons
  ArrowRight: 'ArrowRightIcon',
  ArrowLeft: 'ArrowLeftIcon',
  ArrowUp: 'ArrowUpIcon',
  ArrowDown: 'ArrowDownIcon',

  // Connection Icons
  Link: 'LinkIcon',
  LinkBreak: 'UnlinkIcon',
  BluetoothConnected: 'BluetoothIcon',

  // User Icons
  User: 'UserIcon',
  UserPlus: 'UserPlusIcon',
  UserMinus: 'UserMinusIcon',

  // Other Icons
  Heart: 'HeartIcon',
  Star: 'StarIcon',
  BookmarkSimple: 'BookmarkIcon',
  Tag: 'TagIcon',
  Hash: 'HashIcon',
  At: 'AtSignIcon',
  CurrencyDollar: 'DollarSignIcon',
  Percent: 'PercentIcon',

  // Special cases
  Record: 'VideoIcon', // Recording icon
  Desktop: 'BriefcaseIcon', // Office/desktop
  Stairs: 'HouseIcon', // Stairs -> House
  DeviceMobile: 'UserIcon', // Mobile device -> User
}

/**
 * Convert Phosphor import line to Lucide import
 */
function convertImportLine(line) {
  // Check if it's a Phosphor import
  if (!line.includes('@phosphor-icons/react')) {
    return line
  }

  // Extract icon names from import
  const importMatch = line.match(/import\s+{([^}]+)}\s+from\s+'@phosphor-icons\/react'/)
  if (!importMatch) return line

  const icons = importMatch[1]
    .split(',')
    .map(icon => icon.trim())
    .map(icon => {
      // Handle 'Icon as Alias' syntax
      const aliasMatch = icon.match(/^(.+?)\s+as\s+(.+)$/)
      if (aliasMatch) {
        const [, phosphorName, alias] = aliasMatch
        return { phosphor: phosphorName, lucide: ICON_MAP[phosphorName] || phosphorName, alias }
      }
      return { phosphor: icon, lucide: ICON_MAP[icon] || icon, alias: null }
    })

  // Build new import line
  const lucideIcons = icons
    .map(({ lucide, alias }) => (alias ? `${lucide} as ${alias}` : lucide))
    .join(', ')

  return `import { ${lucideIcons} } from '@/lib/icons'`
}

/**
 * Convert icon usage in JSX (size prop)
 */
function convertIconUsage(content) {
  // Replace size={number} with className="h-{size} w-{size}"
  const sizeMap = {
    12: 'h-3 w-3',
    16: 'h-4 w-4',
    18: 'h-[18px] w-[18px]',
    20: 'h-5 w-5',
    24: 'h-6 w-6',
    28: 'h-7 w-7',
    32: 'h-8 w-8',
    40: 'h-10 w-10',
    48: 'h-12 w-12',
  }

  // Replace size prop
  Object.entries(sizeMap).forEach(([size, className]) => {
    const regex = new RegExp(`size={${size}}`, 'g')
    content = content.replace(regex, `className="${className}"`)
  })

  // Remove weight prop (Lucide doesn't have weight)
  content = content.replace(/\s+weight="[^"]*"/g, '')

  return content
}

/**
 * Convert a single file
 */
function convertFile(filePath) {
  console.log(`\n📄 Processing: ${filePath}`)

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  let modified = false
  let newLines = []

  for (const line of lines) {
    if (line.includes('@phosphor-icons/react')) {
      const newLine = convertImportLine(line)
      if (newLine !== line) {
        console.log(`  ✓ Converted import line`)
        modified = true
      }
      newLines.push(newLine)
    } else {
      newLines.push(line)
    }
  }

  let newContent = newLines.join('\n')

  // Convert icon usage
  const contentWithUsage = convertIconUsage(newContent)
  if (contentWithUsage !== newContent) {
    console.log(`  ✓ Converted icon usage (size → className)`)
    modified = true
  }
  newContent = contentWithUsage

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf-8')
    console.log(`  ✅ File updated`)
    return true
  } else {
    console.log(`  ⏭️  No changes needed`)
    return false
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const pattern = args[0] || 'src/components/**/*.tsx'

  console.log(`🔍 Searching for files matching: ${pattern}`)

  const files = await glob(pattern, {
    cwd: path.join(__dirname, '..'),
    absolute: true,
  })

  console.log(`\n📦 Found ${files.length} files to process`)

  let convertedCount = 0

  for (const file of files) {
    if (convertFile(file)) {
      convertedCount++
    }
  }

  console.log(`\n✅ Migration complete!`)
  console.log(`   ${convertedCount} files converted`)
  console.log(`   ${files.length - convertedCount} files unchanged`)
}

main().catch(console.error)
