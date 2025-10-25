/**
 * Security Tab
 *
 * Main security section container that wraps the SecurityCameras component
 */

import { SecurityCameras } from '@/components/SecurityCameras'
import { ThemeToggle } from './ThemeToggle'

export function Security() {
  return (
    <div className="bg-background flex h-full flex-col">
      {/* Header */}
      <div className="border-border bg-card/90 flex items-center justify-between border-b px-6 py-4 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold">Security</h1>
          <p className="text-muted-foreground text-sm">Monitor your 7 cameras</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6">
          <SecurityCameras />
        </div>
      </div>
    </div>
  )
}
