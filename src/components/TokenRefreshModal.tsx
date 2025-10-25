/**
 * Arlo Token Refresh Modal
 *
 * Displays when Arlo authentication token expires (401 error)
 * Provides step-by-step instructions for capturing new token from Chrome DevTools
 *
 * Created: October 13, 2025 - Phase 4: Auto Token Refresh
 */

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircleIcon, CheckCircleIcon, ClockIcon, InfoIcon } from '@/lib/icons'
import { arloTokenManager } from '@/services/auth/ArloTokenManager'
import { useState } from 'react'
import { toast } from 'sonner'

interface TokenRefreshModalProps {
  /** Whether modal is open */
  isOpen: boolean

  /** Callback when modal is closed */
  onClose: () => void

  /** Callback when token is successfully refreshed */
  onTokenRefreshed?: () => void
}

export function TokenRefreshModal({ isOpen, onClose, onTokenRefreshed }: TokenRefreshModalProps) {
  const [authorizationInput, setAuthorizationInput] = useState('')
  const [xcloudidInput, setXcloudidInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  /**
   * Parse cURL command to extract headers
   * Supports multiple formats: bash cURL, PowerShell Invoke-WebRequest, raw headers
   */
  const parseCurlCommand = (
    input: string
  ): { authorization?: string; xcloudid?: string } | null => {
    try {
      // Try to extract authorization header (multiple patterns)
      const authPatterns = [
        /-H ['"]authorization: (.+?)['"]/i,
        /-H "authorization: (.+?)"/i,
        /-H 'authorization: (.+?)'/i,
        /authorization: (.+)/i,
        /"authorization":\s*"(.+?)"/i,
      ]

      let authorization: string | undefined
      for (const pattern of authPatterns) {
        const match = input.match(pattern)
        if (match && match[1]) {
          authorization = match[1].trim()
          break
        }
      }

      // Try to extract xcloudid header
      const cloudIdPatterns = [
        /-H ['"]xcloudid: (.+?)['"]/i,
        /-H "xcloudid: (.+?)"/i,
        /-H 'xcloudid: (.+?)'/i,
        /xcloudid: (.+)/i,
        /"xcloudid":\s*"(.+?)"/i,
      ]

      let xcloudid: string | undefined
      for (const pattern of cloudIdPatterns) {
        const match = input.match(pattern)
        if (match && match[1]) {
          xcloudid = match[1].trim()
          break
        }
      }

      if (authorization || xcloudid) {
        return { authorization, xcloudid }
      }

      return null
    } catch (error) {
      console.error('[TokenRefreshModal] Failed to parse input:', error)
      return null
    }
  }

  /**
   * Handle token submission
   */
  const handleSubmit = async () => {
    setIsValidating(true)
    setValidationError(null)

    try {
      // Try to parse input as cURL command first
      const parsed = parseCurlCommand(authorizationInput)
      const finalAuthorization = parsed?.authorization || authorizationInput.trim()
      let finalXcloudid = parsed?.xcloudid || xcloudidInput.trim()

      // If no xcloudid provided and not found in cURL, use existing one
      if (!finalXcloudid) {
        const existingToken = arloTokenManager.getToken()
        if (existingToken) {
          finalXcloudid = existingToken.xcloudid
          console.log('[TokenRefreshModal] Using existing xcloudid')
        }
      }

      // Validate format
      if (!arloTokenManager.validateTokenFormat(finalAuthorization, finalXcloudid)) {
        setValidationError(
          'Invalid token format. Authorization should start with "2_" and be at least 100 characters.'
        )
        setIsValidating(false)
        return
      }

      // Save token
      arloTokenManager.saveToken(finalAuthorization, finalXcloudid, '2')

      toast.success('Token saved successfully!', {
        description: `Valid for ${arloTokenManager.getFormattedTimeUntilExpiration()}`,
        duration: 5000,
      })

      // Reset form
      setAuthorizationInput('')
      setXcloudidInput('')
      setValidationError(null)

      // Notify parent
      onTokenRefreshed?.()

      // Close modal
      onClose()
    } catch (error) {
      console.error('[TokenRefreshModal] Failed to save token:', error)
      setValidationError(error instanceof Error ? error.message : 'Failed to save token')
    } finally {
      setIsValidating(false)
    }
  }

  /**
   * Try to auto-fill from clipboard
   */
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setAuthorizationInput(text)

      // Try to parse immediately
      const parsed = parseCurlCommand(text)
      if (parsed?.xcloudid) {
        setXcloudidInput(parsed.xcloudid)
      }

      toast.info('Pasted from clipboard', {
        description: 'Review the token before saving',
      })
    } catch (error) {
      console.error('[TokenRefreshModal] Failed to read clipboard:', error)
      toast.error('Failed to read clipboard', {
        description: 'Please paste manually',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircleIcon className="text-warning h-5 w-5" />
            Arlo Token Expired
          </DialogTitle>
          <DialogDescription>
            Your Arlo authentication token has expired. Follow the steps below to capture a new
            token from Chrome DevTools.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Token Info */}
          <div className="bg-muted/50 space-y-2 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <ClockIcon className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div className="text-sm">
                <p className="font-medium">Token Lifespan</p>
                <p className="text-muted-foreground">
                  Arlo tokens typically expire after 24-48 hours. You'll need to refresh manually
                  when this happens.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-semibold">
              <InfoIcon className="h-4 w-4" />
              How to Capture New Token
            </h4>

            <ol className="list-inside list-decimal space-y-2 text-sm">
              <li>
                Open <strong>my.arlo.com</strong> in Chrome and log in
              </li>
              <li>
                Open <strong>Chrome DevTools</strong> (F12 or Ctrl+Shift+I)
              </li>
              <li>
                Go to the <strong>Network</strong> tab
              </li>
              <li>
                Filter by <strong>"Fetch/XHR"</strong>
              </li>
              <li>In Arlo, start streaming any camera (this triggers an API request)</li>
              <li>
                Find a request to <code className="bg-muted rounded px-1">sipInfo</code> or{' '}
                <code className="bg-muted rounded px-1">devices</code>
              </li>
              <li>
                Right-click → <strong>Copy</strong> → <strong>Copy as cURL (bash)</strong>
              </li>
              <li>Paste the entire cURL command below (or just the authorization header)</li>
            </ol>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authorization">
                Authorization Token
                <span className="text-muted-foreground ml-2 text-xs">
                  (paste entire cURL command or just the token)
                </span>
              </Label>
              <Textarea
                id="authorization"
                placeholder="Paste cURL command or authorization header here..."
                value={authorizationInput}
                onChange={e => setAuthorizationInput(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={handlePasteFromClipboard}>
                Paste from Clipboard
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="xcloudid">
                X-Cloud-ID (Optional)
                <span className="text-muted-foreground ml-2 text-xs">
                  (auto-filled if found in cURL)
                </span>
              </Label>
              <Textarea
                id="xcloudid"
                placeholder="K5HYEUA3-2400-336-127845809"
                value={xcloudidInput}
                onChange={e => setXcloudidInput(e.target.value)}
                rows={1}
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
              <AlertCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Validation Failed</p>
                <p>{validationError}</p>
              </div>
            </div>
          )}

          {/* Success Preview */}
          {authorizationInput &&
            arloTokenManager.validateTokenFormat(
              parseCurlCommand(authorizationInput)?.authorization || authorizationInput.trim(),
              parseCurlCommand(authorizationInput)?.xcloudid || xcloudidInput.trim() || 'dummy'
            ) && (
              <div className="bg-success/10 text-success flex items-start gap-2 rounded-lg p-3 text-sm">
                <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">Valid Token Format</p>
                  <p>Token looks good! Click "Save Token" to update.</p>
                </div>
              </div>
            )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!authorizationInput || isValidating}>
            {isValidating ? 'Validating...' : 'Save Token'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
