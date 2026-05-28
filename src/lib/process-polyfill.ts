/**
 * Process polyfill for browser environment
 * Required by Node.js libraries that reference `process` when bundled for the browser
 */

declare global {
  interface Window {
    process: {
      env: Record<string, string>
      platform: string
      version: string
      exit: (code?: number) => void
      cwd: () => string
      nextTick: (callback: () => void) => void
    }
  }
}

// Create a minimal process object for browser
if (typeof window !== 'undefined') {
  window.process = window.process || {
    env: {},
    platform: 'browser',
    version: 'v20.0.0',
    exit: (code?: number) => {
      console.warn('[process.exit] Called with code:', code)
      // In browser, we can't actually exit, so just log
    },
    cwd: () => '/',
    nextTick: (callback: () => void) => {
      setTimeout(callback, 0)
    },
  }
}

export {}
