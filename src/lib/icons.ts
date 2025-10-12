/**
 * Icon System - Lucide React
 *
 * Centralized icon exports with Phosphor → Lucide mapping.
 * All icons follow iOS design principles with consistent sizing.
 *
 * Usage:
 *   import { LightbulbIcon, ThermometerIcon } from '@/lib/icons'
 *   <LightbulbIcon className="h-5 w-5" />
 */

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowLeft,
  // Arrow Icons
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  AtSign,
  BarChart3,
  Bath,
  Battery,
  BatteryLow,
  BatteryWarning,
  Bed,
  // Communication Icons
  Bell,
  BellOff,
  Bluetooth,
  // Energy Icons
  Bolt,
  Bookmark,
  Box,
  Briefcase,
  // Building Icons
  Building,
  Building2,
  Calendar,
  // Automation Icons
  CalendarDays,
  Camera,
  Cast,
  Check,
  // Status Icons
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  // Time & Schedule Icons
  Clock,
  CloudSun,
  Cog,
  Compass,
  Copy,
  DollarSign,
  Download,
  Droplet,
  Edit,
  // Security Icons
  Eye,
  EyeOff,
  Fan,
  // File Icons
  File,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  GitBranch,
  Hash,
  // Other Icons
  Heart,
  // Room Icons
  Home,
  // Navigation Icons
  House,
  Info,
  Layers,
  LayoutGrid,
  // Device Icons
  Lightbulb,
  LineChart,
  // Connection Icons
  Link2,
  Lock,
  Mail,
  Map,
  // Location Icons
  MapPin,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Moon,
  MoreHorizontal,
  MoreVertical,
  Navigation,
  Package,
  Pause,
  Percent,
  Phone,
  PhoneOff,
  PieChart,
  // Media Icons
  Play,
  // Action Icons
  Plus,
  Power,
  Radio,
  RefreshCw,
  Save,
  School,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Signal,
  SignalLow,
  SkipBack,
  SkipForward,
  Sliders,
  SlidersHorizontal,
  Sofa,
  Sparkles,
  Speaker,
  Star,
  StopCircle,
  Store,
  Sun as SunIcon,
  Sunrise,
  Sunset,
  Tag,
  Thermometer,
  Timer,
  Trash2,
  TreePine,
  TrendingDown,
  TrendingUp,
  Tv,
  Unlink2,
  Upload,
  Usb,
  // User Icons
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  UtensilsCrossed,
  Video,
  VideoOff,
  Volume1,
  Volume2,
  VolumeX,
  Warehouse,
  Wifi,
  WifiOff,
  Workflow,
  // Utility Icons
  Wrench,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react'

// Re-export all icons with Icon suffix for clarity
export {
  Activity as ActivityIcon,
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Archive as ArchiveIcon,
  ArrowDown as ArrowDownIcon,
  ArrowLeft as ArrowLeftIcon,
  // Arrow Icons
  ArrowRight as ArrowRightIcon,
  ArrowUp as ArrowUpIcon,
  ArrowUpRight as ArrowUpRightIcon,
  AtSign as AtSignIcon,
  BarChart3 as BarChartIcon,
  Bath as BathIcon,
  Battery as BatteryIcon,
  BatteryLow as BatteryLowIcon,
  BatteryWarning as BatteryWarningIcon,
  Bed as BedIcon,
  // Communication Icons
  Bell as BellIcon,
  BellOff as BellOffIcon,
  Bluetooth as BluetoothIcon,
  // Energy Icons
  Bolt as BoltIcon,
  Bookmark as BookmarkIcon,
  Box as BoxIcon,
  Briefcase as BriefcaseIcon,
  Building2 as Building2Icon,
  // Building Icons
  Building as BuildingIcon,
  // Automation Icons
  CalendarDays as CalendarDaysIcon,
  Calendar as CalendarIcon,
  Camera as CameraIcon,
  Cast as CastIcon,
  // Status Icons
  CheckCircle as CheckCircleIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  // Time & Schedule Icons
  Clock as ClockIcon,
  CloudSun as CloudSunIcon,
  Cog as CogIcon,
  Compass as CompassIcon,
  Copy as CopyIcon,
  DollarSign as DollarSignIcon,
  Download as DownloadIcon,
  Droplet as DropletIcon,
  Edit as EditIcon,
  // Security Icons
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Fan as FanIcon,
  // File Icons
  File as FileIcon,
  FileText as FileTextIcon,
  Filter as FilterIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  GitBranch as GitBranchIcon,
  Hash as HashIcon,
  // Other Icons
  Heart as HeartIcon,
  // Room Icons
  Home as HomeRoomIcon,
  // Navigation Icons
  House as HouseIcon,
  Info as InfoIcon,
  Layers as LayersIcon,
  LayoutGrid as LayoutGridIcon,
  // Device Icons
  Lightbulb as LightbulbIcon,
  LineChart as LineChartIcon,
  // Connection Icons
  Link2 as LinkIcon,
  Lock as LockIcon,
  Mail as MailIcon,
  Map as MapIcon,
  // Location Icons
  MapPin as MapPinIcon,
  Maximize2 as MaximizeIcon,
  MessageSquare as MessageIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Moon as MoonIcon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical as MoreVerticalIcon,
  Navigation as NavigationIcon,
  Package as PackageIcon,
  Pause as PauseIcon,
  Percent as PercentIcon,
  Phone as PhoneIcon,
  PhoneOff as PhoneOffIcon,
  PieChart as PieChartIcon,
  // Media Icons
  Play as PlayIcon,
  // Action Icons
  Plus as PlusIcon,
  Power as PowerIcon,
  Radio as RadioIcon,
  RefreshCw as RefreshCwIcon,
  RefreshCw as RefreshIcon,
  Save as SaveIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Share2 as ShareIcon,
  ShieldAlert as ShieldAlertIcon,
  ShieldCheck as ShieldCheckIcon,
  Shield as ShieldIcon,
  ShieldX as ShieldXIcon,
  Signal as SignalIcon,
  SignalLow as SignalLowIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  SlidersHorizontal as SlidersIcon,
  Sliders as SlidersIconAlt,
  Sofa as SofaIcon,
  Sparkles as SparklesIcon,
  Speaker as SpeakerIcon,
  Star as StarIcon,
  StopCircle as StopCircleIcon,
  Store as StoreIcon,
  Sunrise as SunriseIcon,
  SunIcon as SunRoomIcon,
  Sunset as SunsetIcon,
  Tag as TagIcon,
  Thermometer as ThermometerIcon,
  Timer as TimerIcon,
  Trash2 as TrashIcon,
  TreePine as TreeIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Tv as TvIcon,
  Unlink2 as UnlinkIcon,
  Upload as UploadIcon,
  Usb as UsbIcon,
  UserCheck as UserCheckIcon,
  // User Icons
  User as UserIcon,
  UserMinus as UserMinusIcon,
  UserPlus as UserPlusIcon,
  Users as UsersIcon,
  UserX as UserXIcon,
  UtensilsCrossed as UtensilsIcon,
  Video as VideoIcon,
  VideoOff as VideoOffIcon,
  Volume2 as VolumeIcon,
  Volume1 as VolumeLowIcon,
  VolumeX as VolumeOffIcon,
  Warehouse as WarehouseIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Workflow as WorkflowIcon,
  // Utility Icons
  Wrench as WrenchIcon,
  XCircle as XCircleIcon,
  X as XIcon,
  Zap as ZapIcon,
  type LucideIcon,
}

// Device Type Icon Mapping
export const DEVICE_ICONS = {
  light: Lightbulb,
  thermostat: Thermometer,
  security: Shield,
  sensor: Wifi,
  camera: Camera,
  lock: Lock,
  fan: Fan,
  tv: Tv,
  speaker: Speaker,
  switch: Zap,
  valve: Droplet,
} as const

// Room Type Icon Mapping
export const ROOM_ICONS = {
  'living-room': Sofa,
  bedroom: Bed,
  kitchen: UtensilsCrossed,
  bathroom: Bath,
  office: Briefcase,
  garage: Warehouse,
  outdoor: TreePine,
  'sun-room': SunIcon,
  entryway: Home,
  other: Home,
} as const

// Automation Type Icon Mapping
export const AUTOMATION_ICONS = {
  schedule: Clock,
  geofence: MapPin,
  condition: CalendarDays,
  'device-state': GitBranch,
} as const

// Scene Icon Mapping
export const SCENE_ICONS = {
  sun: SunIcon,
  moon: Moon,
  home: Home,
  shield: Shield,
  'cloud-sun': CloudSun,
} as const

// Status Icon Mapping
export const STATUS_ICONS = {
  online: CheckCircle,
  offline: XCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
} as const

// Integration Type Icon Mapping
export const INTEGRATION_ICONS = {
  homekit: Wifi,
  alexa: Bell,
  google: Wifi,
  matter: Check,
  thread: Radio,
  zigbee: Radio,
  zwave: Radio,
} as const

// Icon Size Presets (iOS standard sizes)
export const ICON_SIZES = {
  xs: 'h-3 w-3', // 12px
  sm: 'h-4 w-4', // 16px
  md: 'h-5 w-5', // 20px
  lg: 'h-6 w-6', // 24px
  xl: 'h-8 w-8', // 32px
  '2xl': 'h-10 w-10', // 40px
  '3xl': 'h-12 w-12', // 48px
} as const

/**
 * Animated Icon Wrapper
 *
 * Adds spring animation to icon on mount/unmount
 * Perfect for iOS-style icon transitions
 */
export interface AnimatedIconProps {
  icon: LucideIcon
  className?: string
  size?: keyof typeof ICON_SIZES | number
  animate?: boolean
}
