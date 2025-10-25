import { MOCK_CAMERAS, TEST_STREAMS } from '@/constants/mock-cameras'
import { describe, expect, it } from 'vitest'

describe('mock-cameras', () => {
  describe('MOCK_CAMERAS data structure', () => {
    it('should have 7 cameras', () => {
      expect(MOCK_CAMERAS).toHaveLength(7)
    })

    it('should have unique IDs', () => {
      const ids = MOCK_CAMERAS.map(camera => camera.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(MOCK_CAMERAS.length)
    })

    it('should have valid camera names', () => {
      MOCK_CAMERAS.forEach(camera => {
        expect(camera.name).toBeTruthy()
        expect(typeof camera.name).toBe('string')
        expect(camera.name.length).toBeGreaterThan(0)
      })
    })

    it('should have valid locations', () => {
      MOCK_CAMERAS.forEach(camera => {
        expect(camera.location).toBeTruthy()
        expect(typeof camera.location).toBe('string')
      })
    })

    it('should have valid statuses', () => {
      const validStatuses = ['online', 'offline', 'recording']
      MOCK_CAMERAS.forEach(camera => {
        expect(validStatuses).toContain(camera.status)
      })
    })

    it('should have capabilities object', () => {
      MOCK_CAMERAS.forEach(camera => {
        expect(camera.capabilities).toBeDefined()
        expect(typeof camera.capabilities.ptz).toBe('boolean')
        expect(typeof camera.capabilities.nightVision).toBe('boolean')
        expect(typeof camera.capabilities.spotlight).toBe('boolean')
        expect(typeof camera.capabilities.twoWayAudio).toBe('boolean')
        expect(typeof camera.capabilities.localStorage).toBe('boolean')
      })
    })

    it('should have valid stream URLs', () => {
      MOCK_CAMERAS.forEach(camera => {
        if (camera.streamUrl) {
          expect(typeof camera.streamUrl).toBe('string')
          // Should be either a full URL or a test stream constant
          const streamValues = Object.values(TEST_STREAMS).filter(
            v => typeof v === 'string'
          ) as string[]
          expect(
            camera.streamUrl.startsWith('http') || streamValues.includes(camera.streamUrl)
          ).toBe(true)
        }
      })
    })

    it('should have valid snapshot URLs', () => {
      MOCK_CAMERAS.forEach(camera => {
        if (camera.snapshotUrl) {
          expect(typeof camera.snapshotUrl).toBe('string')
          expect(camera.snapshotUrl.startsWith('http')).toBe(true)
        }
      })
    })

    it('should have lastMotion as Date or undefined', () => {
      MOCK_CAMERAS.forEach(camera => {
        if (camera.lastMotion !== undefined) {
          expect(camera.lastMotion).toBeInstanceOf(Date)
        }
      })
    })
  })

  describe('TEST_STREAMS', () => {
    it('should have valid test stream URLs', () => {
      expect(TEST_STREAMS.muxTest).toBeTruthy()
      expect(TEST_STREAMS.muxTest.startsWith('http')).toBe(true)
    })

    it('should include HLS manifest', () => {
      expect(TEST_STREAMS.muxTest).toContain('.m3u8')
    })
  })

  describe('Camera locations', () => {
    it('should include front door camera', () => {
      const frontDoor = MOCK_CAMERAS.find(c => c.location.toLowerCase().includes('front'))
      expect(frontDoor).toBeDefined()
    })

    it('should include living room camera', () => {
      const livingRoom = MOCK_CAMERAS.find(c => c.location.toLowerCase().includes('living'))
      expect(livingRoom).toBeDefined()
    })

    it('should include backyard camera', () => {
      const backyard = MOCK_CAMERAS.find(c => c.location.toLowerCase().includes('back'))
      expect(backyard).toBeDefined()
    })
  })

  describe('Camera capabilities', () => {
    it('should have at least one camera with PTZ', () => {
      const ptzCamera = MOCK_CAMERAS.find(c => c.capabilities.ptz)
      expect(ptzCamera).toBeDefined()
    })

    it('should have at least one camera with night vision', () => {
      const nightVisionCamera = MOCK_CAMERAS.find(c => c.capabilities.nightVision)
      expect(nightVisionCamera).toBeDefined()
    })

    it('should have at least one camera with spotlight', () => {
      const spotlightCamera = MOCK_CAMERAS.find(c => c.capabilities.spotlight)
      expect(spotlightCamera).toBeDefined()
    })

    it('should have majority of cameras online', () => {
      const onlineCameras = MOCK_CAMERAS.filter(c => c.status === 'online')
      expect(onlineCameras.length).toBeGreaterThan(MOCK_CAMERAS.length / 2)
    })
  })
})
