/**
 * Scheduler Service
 *
 * Manages time-based automation execution with cron-style scheduling.
 * Supports daily schedules, day-of-week patterns, and sunrise/sunset calculations.
 */

import { logger } from '@/lib/logger'
import type { Automation } from '@/types'
import { toast } from 'sonner'
import type {
  ExecutionResult,
  ScheduledTask,
  SchedulerOptions,
  SolarOptions,
  SolarTime,
} from './types'

/**
 * Main scheduler service for time-based automations
 */
export class SchedulerService {
  private tasks = new Map<string, ScheduledTask>()
  private executionHistory: ExecutionResult[] = []
  private options: Required<SchedulerOptions>
  private onExecute?: (automation: Automation) => Promise<void>

  constructor(options: SchedulerOptions = {}) {
    this.options = {
      debug: options.debug ?? false,
      maxConcurrent: options.maxConcurrent ?? 50,
      executionTimeout: options.executionTimeout ?? 30000,
      autoRetry: options.autoRetry ?? true,
      maxRetries: options.maxRetries ?? 3,
    }

    // Check for stale schedules on clock changes (DST)
    this.setupClockChangeDetection()
  }

  /**
   * Set the execution callback for when automations trigger
   */
  setExecutionCallback(callback: (automation: Automation) => Promise<void>): void {
    this.onExecute = callback
  }

  /**
   * Schedule an automation based on its trigger configuration
   */
  schedule(automation: Automation): void {
    if (!automation.enabled) {
      this.log(`Skipping disabled automation: ${automation.name}`)
      return
    }

    // Remove existing schedule if any
    this.unschedule(automation.id)

    const timeTriggers = automation.triggers.filter(t => t.type === 'time')

    if (timeTriggers.length === 0) {
      this.log(`No time triggers found for automation: ${automation.name}`)
      return
    }

    // Schedule each time trigger
    timeTriggers.forEach(trigger => {
      try {
        if (!trigger.time) {
          this.log(`No time specified for trigger in automation: ${automation.name}`)
          return
        }
        const nextRun = this.calculateNextRun(trigger.time, trigger.days)
        const delay = nextRun.getTime() - Date.now()

        if (delay < 0) {
          this.log(`Calculated negative delay for ${automation.name}, recalculating...`)
          return
        }

        const timer = setTimeout(() => {
          this.executeAutomation(automation)
          this.reschedule(automation) // Reschedule for next occurrence
        }, delay)

        const task: ScheduledTask = {
          id: automation.id,
          timer,
          nextRun,
          recurring: true,
        }

        this.tasks.set(automation.id, task)
        this.log(`Scheduled "${automation.name}" for ${nextRun.toLocaleString()}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`Failed to schedule automation ${automation.name}`, error as Error)
        toast.error(`Failed to schedule "${automation.name}": ${message}`)
      }
    })
  }

  /**
   * Remove a scheduled automation
   */
  unschedule(automationId: string): void {
    const task = this.tasks.get(automationId)
    if (task) {
      clearTimeout(task.timer)
      this.tasks.delete(automationId)
      this.log(`Unscheduled automation: ${automationId}`)
    }
  }

  /**
   * Reschedule an automation for its next occurrence
   */
  private reschedule(automation: Automation): void {
    this.log(`Rescheduling automation: ${automation.name}`)
    this.schedule(automation)
  }

  /**
   * Calculate the next run time for a schedule
   */
  calculateNextRun(time: string, days?: string[]): Date {
    const parts = time.split(':')
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid time format: ${time}. Expected HH:MM`)
    }

    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)

    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time format: ${time}. Expected HH:MM`)
    }

    const now = new Date()
    const next = new Date()
    next.setHours(hours, minutes, 0, 0)

    // If time has passed today, move to tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }

    // If specific days are specified, find next matching day
    if (days && days.length > 0) {
      const dayNumbers = this.parseDays(days)

      // Find the next day that matches
      let attempts = 0
      while (!dayNumbers.includes(next.getDay()) && attempts < 7) {
        next.setDate(next.getDate() + 1)
        attempts++
      }

      if (attempts >= 7) {
        throw new Error(`Could not find matching day in next week for days: ${days.join(', ')}`)
      }
    }

    return next
  }

  /**
   * Parse day names to day numbers (0-6, Sunday = 0)
   */
  private parseDays(days: string[]): number[] {
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }

    return days.map(day => {
      const dayNum = dayMap[day.toLowerCase()]
      if (dayNum === undefined) {
        throw new Error(`Invalid day name: ${day}`)
      }
      return dayNum
    })
  }

  /**
   * Execute an automation immediately
   */
  async executeAutomation(automation: Automation): Promise<ExecutionResult> {
    const startTime = Date.now()
    this.log(`Executing automation: ${automation.name}`)

    const result: ExecutionResult = {
      automationId: automation.id,
      timestamp: new Date(),
      actions: [],
      success: false,
      duration: 0,
    }

    try {
      if (this.onExecute) {
        await Promise.race([
          this.onExecute(automation),
          this.timeout(this.options.executionTimeout),
        ])
        result.success = true
      } else {
        throw new Error('No execution callback configured')
      }
    } catch (error) {
      result.success = false
      result.error = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Automation execution failed: ${automation.name}`, error as Error)
      toast.error(`Automation "${automation.name}" failed: ${result.error}`)
    }

    result.duration = Date.now() - startTime
    this.executionHistory.push(result)

    // Keep only last 1000 executions
    if (this.executionHistory.length > 1000) {
      this.executionHistory.shift()
    }

    return result
  }

  /**
   * Get all scheduled tasks
   */
  getScheduledTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ExecutionResult[] {
    return [...this.executionHistory]
  }

  /**
   * Clear all scheduled tasks
   */
  clear(): void {
    this.tasks.forEach(task => clearTimeout(task.timer))
    this.tasks.clear()
    this.log('Cleared all scheduled tasks')
  }

  /**
   * Calculate sunrise and sunset times for a location
   */
  calculateSolarTimes(options: SolarOptions): SolarTime {
    const { lat, lng, date = new Date() } = options

    // Julian day calculation
    const julianDay = this.getJulianDay(date)

    // Solar calculations (simplified algorithm)
    const n = julianDay - 2451545.0 + 0.0008
    const meanLongitude = (280.46 + 0.9856474 * n) % 360
    const meanAnomaly = (357.528 + 0.9856003 * n) % 360
    const eclipticLongitude = meanLongitude + 1.915 * Math.sin(this.toRadians(meanAnomaly))

    const obliquity = 23.439 - 0.0000004 * n
    const declination = this.toDegrees(
      Math.asin(Math.sin(this.toRadians(obliquity)) * Math.sin(this.toRadians(eclipticLongitude)))
    )

    const hourAngle = this.toDegrees(
      Math.acos(
        (Math.sin(this.toRadians(-0.833)) -
          Math.sin(this.toRadians(lat)) * Math.sin(this.toRadians(declination))) /
          (Math.cos(this.toRadians(lat)) * Math.cos(this.toRadians(declination)))
      )
    )

    const transit = 720 - 4 * lng - this.equationOfTime(n)
    const sunrise = transit - 4 * hourAngle
    const sunset = transit + 4 * hourAngle

    const baseDate = new Date(date)
    baseDate.setHours(0, 0, 0, 0)

    return {
      sunrise: new Date(baseDate.getTime() + sunrise * 60000),
      sunset: new Date(baseDate.getTime() + sunset * 60000),
      solarNoon: new Date(baseDate.getTime() + transit * 60000),
    }
  }

  /**
   * Setup detection for clock changes (DST, manual changes)
   */
  private setupClockChangeDetection(): void {
    let lastCheck = Date.now()

    setInterval(() => {
      const now = Date.now()
      const expected = lastCheck + 60000 // 1 minute
      const drift = Math.abs(now - expected)

      // If drift > 5 seconds, clock may have changed
      if (drift > 5000) {
        this.log('Clock change detected, recalculating schedules...')
        this.recalculateAllSchedules()
      }

      lastCheck = now
    }, 60000) // Check every minute
  }

  /**
   * Recalculate all scheduled tasks (used after clock changes)
   */
  private recalculateAllSchedules(): void {
    // Store current automations
    const automations = Array.from(this.tasks.keys())

    // This would need access to the full automation objects
    // In practice, this should be called from a higher level
    // that has access to the automation store
    this.log(`Need to recalculate ${automations.length} schedules`)
  }

  /**
   * Helper: Create a timeout promise
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Execution timeout after ${ms}ms`)), ms)
    )
  }

  /**
   * Helper: Get Julian day number
   */
  private getJulianDay(date: Date): number {
    return date.getTime() / 86400000 + 2440587.5
  }

  /**
   * Helper: Equation of time (for solar calculations)
   */
  private equationOfTime(n: number): number {
    const epsilon = 23.439 - 0.0000004 * n
    const l0 = (280.466 + 0.9856474 * n) % 360
    const e = 0.016708634 - 0.000042037 * n
    const m = (357.5291 + 0.98560028 * n) % 360

    const y = Math.tan(this.toRadians(epsilon) / 2) ** 2
    const sinM = Math.sin(this.toRadians(m))
    const sin2L0 = Math.sin(this.toRadians(2 * l0))

    const eot = y * sin2L0 - 2 * e * sinM + 4 * e * y * sinM * Math.cos(this.toRadians(2 * l0))

    return 4 * this.toDegrees(eot)
  }

  /**
   * Helper: Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  /**
   * Helper: Convert radians to degrees
   */
  private toDegrees(radians: number): number {
    return (radians * 180) / Math.PI
  }

  /**
   * Helper: Debug logging
   */
  private log(message: string): void {
    if (this.options.debug) {
      console.log(`[SchedulerService] ${message}`)
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService({ debug: true })
