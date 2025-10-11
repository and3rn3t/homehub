import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowClockwise, AlertTriangleIcon, WifiOffIcon } from '@/lib/icons'
import { motion } from 'framer-motion'

interface ErrorStateProps {
  /** Error object or error message */
  error?: Error | string
  /** Callback to retry the failed operation */
  onRetry?: () => void
  /** Custom title for the error */
  title?: string
  /** Custom description */
  description?: string
  /** Show as inline alert instead of full card */
  variant?: 'card' | 'inline' | 'minimal'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * ErrorState Component
 *
 * Displays error states with user-friendly messages and retry functionality.
 * Can be used inline or as a standalone card.
 *
 * @example
 * ```tsx
 * // In a component
 * if (isError) {
 *   return <ErrorState error={error} onRetry={() => refetch()} />
 * }
 * ```
 */
export function ErrorState({
  error,
  onRetry,
  title = 'Unable to Load Data',
  description,
  variant = 'card',
  size = 'md',
}: ErrorStateProps) {
  // Get user-friendly error message
  const getErrorMessage = (): string => {
    if (description) return description

    if (!error) return 'An unexpected error occurred. Please try again.'

    const message = typeof error === 'string' ? error : error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.'
    }
    if (message.includes('timeout')) {
      return 'The request took too long to complete.'
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return 'You do not have permission to access this resource.'
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource was not found.'
    }

    return typeof error === 'string' ? error : 'An error occurred while loading data.'
  }

  // Inline alert variant
  if (variant === 'inline') {
    return (
      <Alert variant="destructive" className="my-4">
        <Warning size={16} />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {getErrorMessage()}
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
              <ArrowClockwise size={14} className="mr-2" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Minimal variant (just icon and text)
  if (variant === 'minimal') {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
        <Warning size={16} className="text-destructive" />
        <span>{getErrorMessage()}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="ml-auto">
            <ArrowClockwise size={14} className="mr-2" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  // Card variant (default)
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const iconContainerSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  }

  const buttonSizes: Record<'sm' | 'md' | 'lg', 'sm' | 'default' | 'lg'> = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className={`text-center ${sizeClasses[size]}`}>
          <div
            className={`bg-destructive/10 mx-auto mb-4 flex items-center justify-center rounded-full ${iconContainerSizes[size]}`}
          >
            <WifiSlash size={iconSizes[size]} className="text-destructive" weight="fill" />
          </div>

          <h3 className="text-foreground mb-2 text-lg font-semibold">{title}</h3>

          <p className="text-muted-foreground mb-4 text-sm">{getErrorMessage()}</p>

          {onRetry && (
            <Button onClick={onRetry} variant="outline" size={buttonSizes[size]}>
              <ArrowClockwise size={16} className="mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * NetworkErrorState - Specialized for network errors
 */
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="No Internet Connection"
      description="Please check your internet connection and try again."
      onRetry={onRetry}
      variant="card"
    />
  )
}

/**
 * NotFoundErrorState - Specialized for 404 errors
 */
export function NotFoundErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Not Found"
      description="The resource you're looking for doesn't exist or has been moved."
      onRetry={onRetry}
      variant="card"
    />
  )
}
