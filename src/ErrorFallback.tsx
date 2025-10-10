import { ArrowClockwise, Bug, House, Warning } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error

  const [showDetails, setShowDetails] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Auto-retry after 10 seconds (optional)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCountdown(10)
    }, 2000) // Start countdown after 2 seconds

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (countdown === null) return

    if (countdown === 0) {
      resetErrorBoundary()
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, resetErrorBoundary])

  const handleRetry = () => {
    setCountdown(null) // Cancel auto-retry
    resetErrorBoundary()
  }

  const handleGoHome = () => {
    setCountdown(null) // Cancel auto-retry
    window.location.href = '/'
  }

  const handleReload = () => {
    setCountdown(null) // Cancel auto-retry
    window.location.reload()
  }

  // Get user-friendly error message
  const getUserMessage = (error: Error): string => {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.'
    }
    if (message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.'
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return 'You do not have permission to access this resource.'
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource was not found.'
    }
    if (message.includes('parse') || message.includes('json')) {
      return 'There was a problem processing the data. The server may have returned invalid data.'
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-destructive/50 shadow-lg">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="bg-destructive/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                <Warning size={24} className="text-destructive" weight="fill" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-foreground mb-2 text-xl">Something Went Wrong</CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  {getUserMessage(error)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button onClick={handleRetry} className="w-full" size="lg">
                <ArrowClockwise size={18} className="mr-2" />
                Try Again
                {countdown !== null && countdown > 0 && (
                  <span className="ml-2 text-xs opacity-75">({countdown}s)</span>
                )}
              </Button>

              <Button onClick={handleGoHome} variant="outline" className="w-full" size="lg">
                <House size={18} className="mr-2" />
                Go Home
              </Button>

              <Button onClick={handleReload} variant="outline" className="w-full" size="lg">
                <ArrowClockwise size={18} className="mr-2" />
                Reload Page
              </Button>
            </div>

            {/* Auto-retry notice */}
            {countdown !== null && countdown > 0 && (
              <Alert className="border-primary/50 bg-primary/5">
                <AlertDescription className="text-sm">
                  Will automatically retry in <span className="font-semibold">{countdown}</span>{' '}
                  second{countdown !== 1 ? 's' : ''}...
                </AlertDescription>
              </Alert>
            )}

            {/* Error Details (collapsible) */}
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-muted-foreground mb-2 w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Bug size={16} />
                  Technical Details
                </span>
                <motion.span
                  animate={{ rotate: showDetails ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.span>
              </Button>

              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-muted/50 rounded-lg border p-4">
                    <div className="mb-3">
                      <h4 className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                        Error Name
                      </h4>
                      <code className="text-destructive text-sm">{error.name}</code>
                    </div>

                    <div className="mb-3">
                      <h4 className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                        Error Message
                      </h4>
                      <pre className="text-destructive max-h-32 overflow-auto text-xs break-words whitespace-pre-wrap">
                        {error.message}
                      </pre>
                    </div>

                    {error.stack && (
                      <div>
                        <h4 className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                          Stack Trace
                        </h4>
                        <pre className="text-muted-foreground max-h-48 overflow-auto font-mono text-xs break-words whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Helpful Tips */}
            <Alert>
              <AlertTitle className="text-sm font-semibold">Troubleshooting Tips</AlertTitle>
              <AlertDescription className="text-muted-foreground mt-2 space-y-1 text-sm">
                <ul className="list-inside list-disc space-y-1">
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache</li>
                  <li>Make sure you're using a supported browser</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <p className="text-muted-foreground mt-4 text-center text-sm">
          If this problem persists, please contact support with the error details above.
        </p>
      </motion.div>
    </div>
  )
}
