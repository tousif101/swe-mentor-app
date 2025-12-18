/**
 * Logger utility that respects development/production environment.
 * In development, all logs are shown.
 * In production, only warnings and errors are logged.
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production'

export const logger = {
  /**
   * Log informational messages (development only)
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log('[INFO]', ...args)
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Log warning messages (always shown)
   */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },

  /**
   * Log error messages (always shown)
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
    // TODO: In production, send to error tracking service (Sentry, etc.)
  },
}

export default logger
