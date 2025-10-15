// CRITICAL: Import React before any other libraries to ensure it loads first
// This prevents "Cannot read properties of undefined (reading 'useLayoutEffect')" errors
import React from 'react'
import ReactDOM from 'react-dom'

// Polyfill process for Node.js libraries in browser (e.g., @koush/arlo)
import './lib/process-polyfill'

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import './index.css'
import './main.css'

// Ensure React is available globally for debugging
if (typeof window !== 'undefined') {
  ;(window as any).React = React
  ;(window as any).ReactDOM = ReactDOM
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
