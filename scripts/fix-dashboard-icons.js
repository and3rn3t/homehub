/**
 * Quick Dashboard Icon Migration
 * Converts Phosphor icons to Lucide icons in Dashboard.tsx
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const filePath = path.join(__dirname, '../src/components/Dashboard.tsx')

let content = fs.readFileSync(filePath, 'utf-8')

// Icon size conversions
const sizeReplacements = [
  ['<Plus size={20}', '<PlusIcon className="h-5 w-5"'],
  ['<Plus size={24}', '<PlusIcon className="h-6 w-6"'],
  ['<Warning size={16}', '<AlertTriangleIcon className="h-4 w-4"'],
  ['<Warning size={20}', '<AlertTriangleIcon className="h-5 w-5"'],
  ['<CheckCircle size={20}', '<CheckCircleIcon className="h-5 w-5"'],
  ['<Pulse size={20}', '<ActivityIcon className="h-5 w-5"'],
  ['<CaretRight size={16}', '<ChevronRightIcon className="h-4 w-4"'],
  ['<WifiHigh size={14}', '<WifiIcon className="h-3.5 w-3.5"'],
  ['<WifiSlash size={14}', '<WifiOffIcon className="h-3.5 w-3.5"'],
  ['<ArrowsClockwise size={14}', '<RefreshIcon className="h-3.5 w-3.5"'],
  ['<ArrowsClockwise size={16}', '<RefreshIcon className="h-4 w-4"'],
]

// Room icon mapping fixes
const iconMappingFixes = [
  ['ForkKnife:', 'UtensilsIcon:'],
  ['Users:', 'UsersIcon:'],
  ['Desktop:', 'BriefcaseIcon:'],
  ['Tree:', 'TreeIcon:'],
  ['Stairs:', 'HouseIcon:'],
  ['Sun:', 'SunRoomIcon:'],
  ['ForkKnife,', 'UtensilsIcon,'],
  ['Users,', 'UsersIcon,'],
  ['Desktop,', 'BriefcaseIcon,'],
  ['Tree,', 'TreeIcon,'],
  ['StairsIcon,', 'HouseIcon,'],
]

// Apply size replacements
for (const [old, newVal] of sizeReplacements) {
  const regex = new RegExp(old.replace(/[{}]/g, '\\$&'), 'g')
  content = content.replace(regex, newVal)
}

// Apply room icon mapping fixes
for (const [old, newVal] of iconMappingFixes) {
  const regex = new RegExp(old.replace(/[{}]/g, '\\$&'), 'g')
  content = content.replace(regex, newVal)
}

// Fix room icon map
content = content.replace(
  /const iconMap.*?= \{[^}]+\}/s,
  `const iconMap: Record<string, typeof UsersIcon> = {
  UtensilsIcon: UtensilsIcon,
  UsersIcon: UsersIcon,
  House: HouseIcon,
  BriefcaseIcon: BriefcaseIcon,
  TreeIcon: TreeIcon,
  HouseIcon: HouseIcon,
  SunRoomIcon: SunRoomIcon,
}`
)

// Add Activity icon import
content = content.replace('  AlertTriangleIcon,', '  ActivityIcon,\n  AlertTriangleIcon,')

fs.writeFileSync(filePath, content, 'utf-8')

console.log('✅ Dashboard.tsx icon migration complete!')
console.log(`   - Converted ${sizeReplacements.length} icon size props`)
console.log(`   - Fixed ${iconMappingFixes.length} room icon mappings`)
