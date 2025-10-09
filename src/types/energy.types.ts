/**
 * Energy Monitoring Type Definitions
 * 
 * Power consumption tracking and cost analysis.
 */

export interface EnergyReading {
  /** Timestamp of reading */
  timestamp: Date
  
  /** Energy consumption in kWh */
  consumption: number
  
  /** Optional cost calculation */
  cost?: number
}

export interface DeviceEnergyData {
  /** Device identifier */
  deviceId: string
  
  /** Device display name */
  deviceName: string
  
  /** Current power draw in watts */
  currentPower: number
  
  /** Total energy consumed today (kWh) */
  todayConsumption: number
  
  /** Total energy consumed this month (kWh) */
  monthConsumption: number
  
  /** Historical readings */
  history: EnergyReading[]
  
  /** Estimated monthly cost */
  estimatedMonthlyCost?: number
}

export interface EnergySettings {
  /** Electricity rate in $/kWh */
  electricityRate: number
  
  /** Currency symbol */
  currency: string
  
  /** Time-of-use pricing enabled */
  timeOfUsePricing: boolean
  
  /** Peak hour rate (if TOU enabled) */
  peakRate?: number
  
  /** Off-peak hour rate (if TOU enabled) */
  offPeakRate?: number
}

export interface EnergyInsight {
  /** Unique identifier */
  id: string
  
  /** Insight category */
  type: 'savings' | 'anomaly' | 'recommendation'
  
  /** Insight message */
  message: string
  
  /** Potential savings amount */
  potentialSavings?: number
  
  /** Affected device IDs */
  deviceIds?: string[]
}
