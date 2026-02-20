import '@testing-library/jest-dom'
import { beforeAll, vi } from 'vitest'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: '0x123', isConnected: true })),
  useChainId: vi.fn(() => 33139),
  useConnect: vi.fn(() => ({ connect: vi.fn(), connectors: [] })),
  useDisconnect: vi.fn(() => ({ disconnect: vi.fn() })),
  useReadContract: vi.fn(() => ({ data: null, isLoading: false })),
  useWriteContract: vi.fn(() => ({ writeContract: vi.fn(), isPending: false })),
  useWaitForTransactionReceipt: vi.fn(() => ({ isLoading: false, isSuccess: false })),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

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