// CRITICAL: Import React first to ensure it's available before any components
import 'react'
import 'react-dom'

// Polyfill process for Node.js libraries in browser (e.g., @koush/arlo)
import './lib/process-polyfill'

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { migrateDeviceStorage } from './lib/migrate-devices'

import './index.css'
import './main.css'

// Run device storage migration before app starts
// This ensures devices are never empty
migrateDeviceStorage()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
