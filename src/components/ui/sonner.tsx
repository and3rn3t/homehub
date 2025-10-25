import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon } from '@/lib/icons'
import { CSSProperties } from 'react'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right" // iOS standard position
      duration={3000} // 3s default (was 4s)
      gap={8} // Space between toasts
      toastOptions={{
        // Enhanced animations
        style: {
          borderRadius: '12px', // iOS-style rounded corners
          padding: '12px 16px',
          fontSize: '14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
        // Animation timing
        duration: 3000,
        className: 'group toast',
        // Success styling with icon
        classNames: {
          success: 'bg-green-50 border-green-200 text-green-800',
          error: 'bg-red-50 border-red-200 text-red-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          info: 'bg-blue-50 border-blue-200 text-blue-800',
        },
      }}
      icons={{
        success: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
        error: <AlertCircleIcon className="h-5 w-5 text-red-600" />,
        warning: <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />,
        info: <InfoIcon className="h-5 w-5 text-blue-600" />,
      }}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
