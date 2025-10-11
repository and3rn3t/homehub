import { useKV } from '@/hooks/use-kv'

export type UnitSystem = 'metric' | 'imperial'

export interface UnitPreferences {
  system: UnitSystem
  temperature: 'celsius' | 'fahrenheit'
  distance: 'kilometers' | 'miles'
  weight: 'kilograms' | 'pounds'
  volume: 'liters' | 'gallons'
  speed: 'kmh' | 'mph'
}

const METRIC_PREFERENCES: UnitPreferences = {
  system: 'metric',
  temperature: 'celsius',
  distance: 'kilometers',
  weight: 'kilograms',
  volume: 'liters',
  speed: 'kmh',
}

const IMPERIAL_PREFERENCES: UnitPreferences = {
  system: 'imperial',
  temperature: 'fahrenheit',
  distance: 'miles',
  weight: 'pounds',
  volume: 'gallons',
  speed: 'mph',
}

export function useUnits() {
  const [unitPreferences, setUnitPreferences] = useKV<UnitPreferences>(
    'unit-preferences',
    IMPERIAL_PREFERENCES
  )

  const setUnitSystem = (system: UnitSystem) => {
    const preferences = system === 'metric' ? METRIC_PREFERENCES : IMPERIAL_PREFERENCES
    setUnitPreferences(preferences)
  }

  // Temperature conversions
  const celsiusToFahrenheit = (celsius: number): number => {
    return (celsius * 9) / 5 + 32
  }

  const fahrenheitToCelsius = (fahrenheit: number): number => {
    return ((fahrenheit - 32) * 5) / 9
  }

  const formatTemperature = (value: number, fromUnit?: 'celsius' | 'fahrenheit'): string => {
    const sourceUnit = fromUnit || unitPreferences.temperature
    let displayValue = value

    // Convert if source and display units differ
    if (sourceUnit !== unitPreferences.temperature) {
      displayValue =
        sourceUnit === 'celsius' ? celsiusToFahrenheit(value) : fahrenheitToCelsius(value)
    }

    const symbol = unitPreferences.temperature === 'celsius' ? '°C' : '°F'
    return `${Math.round(displayValue)}${symbol}`
  }

  // Distance conversions
  const kilometersToMiles = (km: number): number => {
    return km * 0.621371
  }

  const milesToKilometers = (miles: number): number => {
    return miles * 1.60934
  }

  const formatDistance = (value: number, fromUnit?: 'kilometers' | 'miles'): string => {
    const sourceUnit = fromUnit || unitPreferences.distance
    let displayValue = value

    if (sourceUnit !== unitPreferences.distance) {
      displayValue =
        sourceUnit === 'kilometers' ? kilometersToMiles(value) : milesToKilometers(value)
    }

    const unit = unitPreferences.distance === 'kilometers' ? 'km' : 'mi'
    return `${displayValue.toFixed(1)} ${unit}`
  }

  // Weight conversions
  const kilogramsToPounds = (kg: number): number => {
    return kg * 2.20462
  }

  const poundsToKilograms = (lbs: number): number => {
    return lbs * 0.453592
  }

  const formatWeight = (value: number, fromUnit?: 'kilograms' | 'pounds'): string => {
    const sourceUnit = fromUnit || unitPreferences.weight
    let displayValue = value

    if (sourceUnit !== unitPreferences.weight) {
      displayValue =
        sourceUnit === 'kilograms' ? kilogramsToPounds(value) : poundsToKilograms(value)
    }

    const unit = unitPreferences.weight === 'kilograms' ? 'kg' : 'lbs'
    return `${displayValue.toFixed(1)} ${unit}`
  }

  // Speed conversions
  const kmhToMph = (kmh: number): number => {
    return kmh * 0.621371
  }

  const mphToKmh = (mph: number): number => {
    return mph * 1.60934
  }

  const formatSpeed = (value: number, fromUnit?: 'kmh' | 'mph'): string => {
    const sourceUnit = fromUnit || unitPreferences.speed
    let displayValue = value

    if (sourceUnit !== unitPreferences.speed) {
      displayValue = sourceUnit === 'kmh' ? kmhToMph(value) : mphToKmh(value)
    }

    const unit = unitPreferences.speed === 'kmh' ? 'km/h' : 'mph'
    return `${displayValue.toFixed(0)} ${unit}`
  }

  // Volume conversions (for energy usage, water, etc.)
  const litersToGallons = (liters: number): number => {
    return liters * 0.264172
  }

  const gallonsToLiters = (gallons: number): number => {
    return gallons * 3.78541
  }

  const formatVolume = (value: number, fromUnit?: 'liters' | 'gallons'): string => {
    const sourceUnit = fromUnit || unitPreferences.volume
    let displayValue = value

    if (sourceUnit !== unitPreferences.volume) {
      displayValue = sourceUnit === 'liters' ? litersToGallons(value) : gallonsToLiters(value)
    }

    const unit = unitPreferences.volume === 'liters' ? 'L' : 'gal'
    return `${displayValue.toFixed(1)} ${unit}`
  }

  return {
    preferences: unitPreferences,
    system: unitPreferences.system,
    setUnitSystem,
    setUnitPreferences,

    // Temperature
    formatTemperature,
    celsiusToFahrenheit,
    fahrenheitToCelsius,

    // Distance
    formatDistance,
    kilometersToMiles,
    milesToKilometers,

    // Weight
    formatWeight,
    kilogramsToPounds,
    poundsToKilograms,

    // Speed
    formatSpeed,
    kmhToMph,
    mphToKmh,

    // Volume
    formatVolume,
    litersToGallons,
    gallonsToLiters,
  }
}
