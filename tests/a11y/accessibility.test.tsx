/**
 * Accessibility Tests
 *
 * Tests HomeHub components for WCAG 2.1 AA compliance using axe-core.
 *
 * Critical components tested:
 * - Dashboard (main view)
 * - Device controls
 * - Navigation
 * - Modals/dialogs
 * - Forms
 *
 * Success criteria:
 * - Zero accessibility violations
 * - Keyboard navigation works
 * - Screen reader compatible
 * - Proper ARIA labels
 */

import { Automations } from '@/components/Automations'
import { Dashboard } from '@/components/Dashboard'
import { Rooms } from '@/components/Rooms'
import { Scenes } from '@/components/Scenes'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it } from 'vitest'

// Extend Vitest matchers
expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  describe('Dashboard Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Dashboard />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading hierarchy', () => {
      const { container } = render(<Dashboard />)
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')

      // Should have at least one h1 or h2 for the page title
      const mainHeadings = Array.from(headings).filter(
        h => h.tagName === 'H1' || h.tagName === 'H2'
      )
      expect(mainHeadings.length).toBeGreaterThan(0)
    })

    it('should have accessible device cards', () => {
      const { container } = render(<Dashboard />)
      const buttons = container.querySelectorAll('button')

      // All buttons should have accessible names
      buttons.forEach(button => {
        const hasLabel =
          button.getAttribute('aria-label') ||
          button.getAttribute('aria-labelledby') ||
          button.textContent?.trim()

        expect(hasLabel).toBeTruthy()
      })
    })
  })

  describe('Rooms Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Rooms />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Scenes Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Scenes />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Automations Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Automations />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation', () => {
      const { container } = render(<Dashboard />)

      // Find all focusable elements
      const focusableElements = container.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )

      // Should have interactive elements
      expect(focusableElements.length).toBeGreaterThan(0)

      // None should have negative tabindex (unless intentional)
      const negativeTabIndex = Array.from(focusableElements).filter(
        el => el.getAttribute('tabindex') === '-1'
      )

      // It's okay to have some -1 tabindex for custom focus management
      // Just ensure we have positive tabindex elements too
      expect(focusableElements.length).toBeGreaterThan(negativeTabIndex.length)
    })
  })

  describe('Color Contrast', () => {
    it('should use accessible color combinations', async () => {
      const { container } = render(<Dashboard />)

      // Run axe with color-contrast rule enabled
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      })

      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Controls', () => {
    it('should have proper labels for inputs', () => {
      const { container } = render(<Dashboard />)
      const inputs = container.querySelectorAll('input, select, textarea')

      inputs.forEach(input => {
        const hasLabel =
          input.getAttribute('aria-label') ||
          input.getAttribute('aria-labelledby') ||
          (input.id && container.querySelector(`label[for="${input.id}"]`))

        // Inputs should have labels (unless they're hidden)
        if (input.getAttribute('type') !== 'hidden') {
          expect(hasLabel).toBeTruthy()
        }
      })
    })
  })

  describe('ARIA Roles', () => {
    it('should use appropriate ARIA roles', async () => {
      const { container } = render(<Dashboard />)

      // Check for proper dialog/modal ARIA
      const dialogs = container.querySelectorAll('[role="dialog"]')
      dialogs.forEach(dialog => {
        // Dialogs should have aria-modal or aria-labelledby
        const hasProperAria =
          dialog.getAttribute('aria-modal') || dialog.getAttribute('aria-labelledby')
        expect(hasProperAria).toBeTruthy()
      })
    })

    it('should use semantic HTML where possible', () => {
      const { container } = render(<Dashboard />)

      // Check for semantic elements
      const nav = container.querySelector('nav')
      const main = container.querySelector('main')

      // Should use semantic HTML (nav, main, header, etc.)
      // Note: Adjust based on your actual component structure
      expect(nav || main || container.querySelector('[role="main"]')).toBeTruthy()
    })
  })
})
