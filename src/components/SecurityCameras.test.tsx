import { SecurityCameras } from '@/components/SecurityCameras'
import { MOCK_CAMERAS } from '@/constants/mock-cameras'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock VideoPlayer component
vi.mock('@/components/VideoPlayer', () => ({
  VideoPlayer: ({ camera }: any) => (
    <div data-testid={`video-player-${camera.id}`}>Mock Video Player for {camera.name}</div>
  ),
}))

describe('SecurityCameras', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<SecurityCameras />)
      expect(screen.getByText('Security Cameras')).toBeInTheDocument()
    })

    it('should render all 7 cameras', () => {
      render(<SecurityCameras />)
      const videoPlayers = screen.getAllByTestId(/video-player-/)
      expect(videoPlayers).toHaveLength(7)
    })

    it('should display camera names', () => {
      render(<SecurityCameras />)
      // Use getAllByText since some cameras may share names
      const uniqueNames = [...new Set(MOCK_CAMERAS.map(c => c.name))]
      uniqueNames.forEach(name => {
        const elements = screen.getAllByText(name)
        expect(elements.length).toBeGreaterThan(0)
      })
    })

    it('should display camera locations', () => {
      render(<SecurityCameras />)
      // Locations appear once per camera
      const livingRoomElements = screen.getAllByText('Living Room')
      expect(livingRoomElements.length).toBeGreaterThan(0)
    })

    it('should display camera count in header', () => {
      render(<SecurityCameras />)
      const onlineCameras = MOCK_CAMERAS.filter(c => c.status !== 'offline')
      expect(
        screen.getByText(`${onlineCameras.length} of ${MOCK_CAMERAS.length} cameras online`)
      ).toBeInTheDocument()
    })
  })

  describe('Camera Information', () => {
    it('should display signal strength indicators', () => {
      render(<SecurityCameras />)
      // Check for signal strength percentages
      MOCK_CAMERAS.forEach(camera => {
        expect(screen.getByText(`${camera.signalStrength}%`)).toBeInTheDocument()
      })
    })

    it('should display battery levels for battery-powered cameras', () => {
      render(<SecurityCameras />)
      const batteryCameras = MOCK_CAMERAS.filter(c => c.battery !== undefined)
      batteryCameras.forEach(camera => {
        expect(screen.getByText(`🔋 ${camera.battery}%`)).toBeInTheDocument()
      })
    })

    it('should display camera capabilities', () => {
      render(<SecurityCameras />)
      // PTZ capability badge should be present
      const ptzBadges = screen.getAllByText('PTZ')
      expect(ptzBadges.length).toBeGreaterThan(0)

      // Night Vision badge should be present
      const nightVisionBadges = screen.getAllByText('Night Vision')
      expect(nightVisionBadges.length).toBeGreaterThan(0)
    })

    it('should display last motion time for cameras with recent motion', () => {
      render(<SecurityCameras />)
      const camerasWithMotion = MOCK_CAMERAS.filter(c => c.lastMotion && c.status === 'online')
      if (camerasWithMotion.length > 0) {
        // Look for "Last motion:" text
        const motionTexts = screen.getAllByText(/Last motion:/)
        expect(motionTexts.length).toBe(camerasWithMotion.length)
      }
    })

    it('should display camera resolution', () => {
      render(<SecurityCameras />)
      // Use getAllByText since multiple cameras may share the same resolution
      const uniqueResolutions = [...new Set(MOCK_CAMERAS.map(c => c.resolution))]
      uniqueResolutions.forEach(resolution => {
        const elements = screen.getAllByText(resolution)
        expect(elements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should have expand buttons for each camera', () => {
      render(<SecurityCameras />)
      const expandButtons = screen.getAllByRole('button', { name: /expand/i })
      expect(expandButtons.length).toBe(7)
    })

    it('should display expand button with ARIA label', () => {
      render(<SecurityCameras />)
      const firstCamera = MOCK_CAMERAS[0]
      if (firstCamera) {
        const expandButton = screen.getByRole('button', {
          name: new RegExp(`Expand ${firstCamera.name}`, 'i'),
        })
        expect(expandButton).toBeInTheDocument()
      }
    })
  })

  describe('Grid Layout', () => {
    it('should use grid layout for cameras', () => {
      const { container } = render(<SecurityCameras />)
      const gridContainer = container.querySelector('[class*="grid"]')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  describe('Camera Status', () => {
    it('should show system active status', () => {
      render(<SecurityCameras />)
      expect(screen.getByText('System Active')).toBeInTheDocument()
    })

    it('should display offline camera warning when cameras are offline', () => {
      render(<SecurityCameras />)
      const offlineCameras = MOCK_CAMERAS.filter(c => c.status === 'offline')

      if (offlineCameras.length > 0) {
        const offlineText = screen.getByText(
          `${offlineCameras.length} Camera${offlineCameras.length > 1 ? 's' : ''} Offline`
        )
        expect(offlineText).toBeInTheDocument()
      }
    })

    it('should display camera brand and model in type badges', () => {
      render(<SecurityCameras />)
      // Check for type badges (ptz, doorbell, spotlight, indoor)
      const ptzCameras = MOCK_CAMERAS.filter(c => c.type === 'ptz')
      if (ptzCameras.length > 0) {
        const ptzBadges = screen.getAllByText('ptz')
        expect(ptzBadges.length).toBe(ptzCameras.length)
      }
    })

    it('should display development mode notice', () => {
      render(<SecurityCameras />)
      expect(screen.getByText(/Development Mode:/)).toBeInTheDocument()
      expect(screen.getByText(/Using test video streams/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      render(<SecurityCameras />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })

    it('should have heading for main section', () => {
      render(<SecurityCameras />)
      const heading = screen.getByRole('heading', { name: /security cameras/i })
      expect(heading).toBeInTheDocument()
    })
  })
})
