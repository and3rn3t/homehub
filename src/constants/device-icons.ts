/**
 * Device Icon Mappings
 *
 * Maps device types to Lucide icon components from centralized icon library.
 * All icons are tree-shakeable and optimized for iOS design.
 */

import {
  BathIcon,
  BedIcon,
  BoltIcon,
  BriefcaseIcon,
  CameraIcon,
  ClockIcon,
  DropletIcon,
  FanIcon,
  LightbulbIcon,
  LockIcon,
  MapPinIcon,
  ShieldIcon,
  SofaIcon,
  SpeakerIcon,
  ThermometerIcon,
  TvIcon,
  UtensilsIcon,
  WarehouseIcon,
  WifiIcon,
} from '@/lib/icons'

export const DEVICE_ICONS = {
  light: LightbulbIcon,
  thermostat: ThermometerIcon,
  security: ShieldIcon,
  sensor: WifiIcon,
  camera: CameraIcon,
  lock: LockIcon,
  fan: FanIcon,
  tv: TvIcon,
  speaker: SpeakerIcon,
  switch: BoltIcon,
  valve: DropletIcon,
} as const

export const AUTOMATION_ICONS = {
  schedule: ClockIcon,
  geofence: MapPinIcon,
  condition: ClockIcon, // CalendarBlank → Clock (close equivalent)
} as const

export const ROOM_ICONS = {
  'living-room': SofaIcon,
  bedroom: BedIcon,
  kitchen: UtensilsIcon,
  bathroom: BathIcon,
  office: BriefcaseIcon,
  garage: WarehouseIcon,
} as const
