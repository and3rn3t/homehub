import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

// Mock Framer Motion for faster tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    section: 'section',
    article: 'article',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  useMotionValue: (initialValue: number) => ({
    get: () => initialValue,
    set: vi.fn(),
    onChange: vi.fn(),
  }),
  useTransform: (_value: unknown, _inputRange: unknown, outputRange: unknown) => ({
    get: () => (Array.isArray(outputRange) ? outputRange[0] : 0),
    set: vi.fn(),
    onChange: vi.fn(),
  }),
  useSpring: (value: unknown) => ({
    get: () => (typeof value === 'number' ? value : 0),
    set: vi.fn(),
    onChange: vi.fn(),
  }),
  // PanInfo is used as a type in components, but we don't need a runtime value
  // TypeScript will use the actual PanInfo type from framer-motion
}))
