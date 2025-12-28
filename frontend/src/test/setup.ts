import '@testing-library/jest-dom'
import { beforeAll, vi } from 'vitest'

// Mock window.ethereum for wallet testing
beforeAll(() => {
  Object.defineProperty(window, 'ethereum', {
    value: {
      request: vi.fn(),
      selectedAddress: null,
      isMetaMask: true,
      emit: vi.fn(),
    },
    writable: true,
  })

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})