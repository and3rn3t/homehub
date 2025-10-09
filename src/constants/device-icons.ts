/**
 * Device Icon Mappings
 * 
 * Maps device types to Phosphor icon components.
 */

import {
  Lightbulb,
  Thermometer,
  Shield,
  Wifi,
  Camera,
  Lock,
  Fan,
  Television,
  Speaker,
  Lightning,
  Drop
} from "@phosphor-icons/react"

export const DEVICE_ICONS = {
  light: Lightbulb,
  thermostat: Thermometer,
  security: Shield,
  sensor: Wifi,
  camera: Camera,
  lock: Lock,
  fan: Fan,
  tv: Television,
  speaker: Speaker,
  switch: Lightning,
  valve: Drop,
} as const

export const AUTOMATION_ICONS = {
  schedule: import("@phosphor-icons/react").then(m => m.Clock),
  geofence: import("@phosphor-icons/react").then(m => m.MapPin),
  condition: import("@phosphor-icons/react").then(m => m.CalendarBlank),
} as const

export const ROOM_ICONS = {
  'living-room': import("@phosphor-icons/react").then(m => m.Couch),
  'bedroom': import("@phosphor-icons/react").then(m => m.Bed),
  'kitchen': import("@phosphor-icons/react").then(m => m.ForkKnife),
  'bathroom': import("@phosphor-icons/react").then(m => m.Bathtub),
  'office': import("@phosphor-icons/react").then(m => m.Desk),
  'garage': import("@phosphor-icons/react").then(m => m.GarageDoor),
} as const
