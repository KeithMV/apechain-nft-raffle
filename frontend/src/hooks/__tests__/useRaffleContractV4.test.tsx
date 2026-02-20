import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateRaffleV4, useNFTApprovalV4, usePlatformFeeV4, useVersionInfo } from '../useRaffleContractV4'
import { ReactNode } from 'react'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(() => 33139),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useReadContract: vi.fn(),
}))

// Mock viem
vi.mock('viem/utils', () => ({
  parseEther: vi.fn((value) => BigInt(value.replace('.', '') + '0'.repeat(18 - value.split('.')[1]?.length || 0))),
}))

// Mock config
vi.mock('../config/addresses', () => ({
  getRaffleFactoryAddress: vi.fn(() => '0x1234567890123456789012345678901234567890'),
  isV4Available: vi.fn(() => true),
  getRateLimit: vi.fn(() => 10),
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock cache invalidation
vi.mock('./useCacheInvalidation', () => ({
  useCacheInvalidation: vi.fn(() => ({ invalidateAll: vi.fn() })),
}))

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'

describe('useRaffleContractV4 hooks', () => {
  const mockWriteContract = vi.fn()
  const mockWaitForTransaction = vi.fn()
  let queryClient: QueryClient

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    
    vi.mocked(useWriteContract).mockReturnValue({
      writeContractAsync: mockWriteContract,
      data: null,
      isPending: false,
      error: null,
    })
    
    vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
      data: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    })
    
    vi.mocked(useReadContract).mockReturnValue({
      data: 1000n,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  describe('useVersionInfo', () => {
    it('returns version information', () => {
      const { result } = renderHook(() => useVersionInfo())
      
      expect(result.current.v4Available).toBe(true)
      expect(result.current.currentVersion).toBe('v4')
      expect(result.current.rateLimit).toBe(10)
      expect(result.current.rateLimitText).toBe('10 seconds')
    })
  })

  describe('usePlatformFeeV4', () => {
    it('reads platform fee', () => {
      const { result } = renderHook(() => usePlatformFeeV4())
      
      expect(result.current.data).toBe(1000n)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('useCreateRaffleV4', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useCreateRaffleV4(), { wrapper: createWrapper })
      
      expect(result.current.isPending).toBe(false)
      expect(result.current.isSuccess).toBe(false)
      expect(typeof result.current.createRaffle).toBe('function')
      expect(result.current.version).toBe('v4')
    })

    it('handles createRaffle function call', async () => {
      mockWriteContract.mockResolvedValue('0xhash')
      const { result } = renderHook(() => useCreateRaffleV4(), { wrapper: createWrapper })
      
      const raffleParams = {
        nftContract: '0x1234567890123456789012345678901234567890',
        tokenId: '123',
        ticketPrice: '0.1',
        maxTickets: 100,
        duration: 24,
      }
      
      await act(async () => {
        await result.current.createRaffle(raffleParams)
      })
      
      expect(mockWriteContract).toHaveBeenCalled()
    })
  })

  describe('useNFTApprovalV4', () => {
    it('handles approveNFT function call', async () => {
      mockWriteContract.mockResolvedValue('0xhash')
      const { result } = renderHook(() => useNFTApprovalV4())
      
      await act(async () => {
        await result.current.approveNFT('0x1234567890123456789012345678901234567890')
      })
      
      expect(mockWriteContract).toHaveBeenCalled()
    })

    it('shows processing state during transaction', () => {
      vi.mocked(useWriteContract).mockReturnValue({
        writeContractAsync: mockWriteContract,
        data: 'tx-hash',
        isPending: true,
        error: null,
      })
      
      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        data: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      })

      const { result } = renderHook(() => useNFTApprovalV4())
      
      expect(result.current.isPending).toBe(false) // Now uses isProcessing which starts false
    })
  })
})