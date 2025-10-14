// Polyfill process for Node.js libraries in browser (e.g., @koush/arlo)
import './lib/process-polyfill'

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import './index.css'
import './main.css'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
