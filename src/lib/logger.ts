/**
 * Centralized Logger Utility
 *
 * Provides structured logging with automatic production stripping of debug logs.
 * Future: Can be extended to send errors to monitoring services (Sentry, LogRocket, etc.)
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *
 *   logger.debug('Device state changed', { deviceId, newState })  // Stripped in production
 *   logger.info('User logged in', { userId })                      // Stripped in production
 *   logger.warn('API rate limit approaching', { remaining })       // Always logged
 *   logger.error('Failed to save data', error)                     // Always logged + sent to monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDev = import.meta.env.DEV
  private appName = 'HomeHub'

  /**
   * Debug logging - only in development
   * Use for verbose developer information
   */
  debug(message: string, context?: LogContext | Error) {
    if (!this.isDev) return

    if (context instanceof Error) {
      console.log(`[${this.appName}] 🐛 DEBUG: ${message}`, context)
    } else if (context) {
      console.log(`[${this.appName}] 🐛 DEBUG: ${message}`, context)
    } else {
      console.log(`[${this.appName}] 🐛 DEBUG: ${message}`)
    }
  }

  /**
   * Info logging - only in development
   * Use for general informational messages
   */
  info(message: string, context?: LogContext | Error) {
    if (!this.isDev) return

    if (context instanceof Error) {
      console.info(`[${this.appName}] ℹ️ INFO: ${message}`, context)
    } else if (context) {
      console.info(`[${this.appName}] ℹ️ INFO: ${message}`, context)
    } else {
      console.info(`[${this.appName}] ℹ️ INFO: ${message}`)
    }
  }

  /**
   * Warning logging - always logged
   * Use for recoverable issues that need attention
   */
  warn(message: string, context?: LogContext | Error) {
    if (context instanceof Error) {
      console.warn(`[${this.appName}] ⚠️ WARN: ${message}`, context)
    } else if (context) {
      console.warn(`[${this.appName}] ⚠️ WARN: ${message}`, context)
    } else {
      console.warn(`[${this.appName}] ⚠️ WARN: ${message}`)
    }

    // Future: Send to monitoring service
    this.sendToMonitoring('warn', message, context)
  }

  /**
   * Error logging - always logged
   * Use for errors that impact functionality
   */
  error(message: string, context?: LogContext | Error) {
    if (context instanceof Error) {
      console.error(`[${this.appName}] ❌ ERROR: ${message}`, context)
    } else if (context) {
      console.error(`[${this.appName}] ❌ ERROR: ${message}`, context)
    } else {
      console.error(`[${this.appName}] ❌ ERROR: ${message}`)
    }

    // Future: Send to monitoring service
    this.sendToMonitoring('error', message, context)
  }

  /**
   * Send logs to Cloudflare Analytics
   * Sends errors to Cloudflare Workers KV for centralized monitoring
   */
  private async sendToMonitoring(level: LogLevel, message: string, context?: LogContext | Error) {
    // Only send warn/error levels to reduce noise
    if (level !== 'warn' && level !== 'error') return

    // Only send in production to avoid dev noise
    if (!import.meta.env.PROD) return

    try {
      // Extract error details if context is an Error
      const errorDetails =
        context instanceof Error
          ? {
              message: context.message,
              stack: context.stack,
              name: context.name,
            }
          : context

      // Send to Cloudflare Worker logging endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          context: errorDetails,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          appVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
        }),
      }).catch(() => {
        // Silent fail - don't break the app if monitoring is down
      })
    } catch {
      // Silent fail - monitoring should never crash the app
    }
  }

  /**
   * Create a scoped logger for specific features
   * Useful for tracking logs from a specific service/component
   */
  scope(scopeName: string) {
    return {
      debug: (message: string, context?: LogContext | Error) =>
        this.debug(`[${scopeName}] ${message}`, context),
      info: (message: string, context?: LogContext | Error) =>
        this.info(`[${scopeName}] ${message}`, context),
      warn: (message: string, context?: LogContext | Error) =>
        this.warn(`[${scopeName}] ${message}`, context),
      error: (message: string, context?: LogContext | Error) =>
        this.error(`[${scopeName}] ${message}`, context),
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for TypeScript users
export type { LogContext, LogLevel }
