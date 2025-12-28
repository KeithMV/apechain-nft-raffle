import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRaffleContractV4 } from '../useRaffleContractV4'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useReadContract: vi.fn(),
}))

// Mock viem
vi.mock('viem', () => ({
  parseEther: vi.fn((value) => BigInt(value.replace('.', '') + '0'.repeat(18 - value.split('.')[1]?.length || 0))),
  isAddress: vi.fn((address) => address?.startsWith('0x') && address.length === 42),
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'

describe('useRaffleContractV4', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890'
  const mockWriteContract = vi.fn()
  const mockWaitForTransaction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    })
    
    vi.mocked(useWriteContract).mockReturnValue({
      writeContract: mockWriteContract,
      data: null,
      isPending: false,
      error: null,
    })
    
    vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    })
    
    vi.mocked(useReadContract).mockReturnValue({
      data: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useRaffleContractV4())
    
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.needsApproval).toBe(false)
    expect(typeof result.current.createRaffle).toBe('function')
    expect(typeof result.current.approveNFT).toBe('function')
    expect(typeof result.current.checkApproval).toBe('function')
  })

  it('handles createRaffle function call', async () => {
    const { result } = renderHook(() => useRaffleContractV4())
    
    const raffleParams = {
      nftContract: '0x1234567890123456789012345678901234567890',
      tokenId: '123',
      ticketPrice: '0.1',
      maxTickets: '100',
      duration: '24',
    }
    
    await act(async () => {
      await result.current.createRaffle(raffleParams)
    })
    
    expect(mockWriteContract).toHaveBeenCalled()
  })

  it('handles approveNFT function call', async () => {
    const { result } = renderHook(() => useRaffleContractV4())
    
    const approvalParams = {
      nftContract: '0x1234567890123456789012345678901234567890',
      tokenId: '123',
    }
    
    await act(async () => {
      await result.current.approveNFT(approvalParams)
    })
    
    expect(mockWriteContract).toHaveBeenCalled()
  })

  it('shows processing state during transaction', () => {
    vi.mocked(useWriteContract).mockReturnValue({
      writeContract: mockWriteContract,
      data: 'tx-hash',
      isPending: true,
      error: null,
    })
    
    vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    const { result } = renderHook(() => useRaffleContractV4())
    
    expect(result.current.isProcessing).toBe(true)
  })

  it('handles transaction timeout', async () => {
    vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    const { result } = renderHook(() => useRaffleContractV4())
    
    // Simulate timeout after 60 seconds
    vi.useFakeTimers()
    
    await act(async () => {
      await result.current.createRaffle({
        nftContract: '0x1234567890123456789012345678901234567890',
        tokenId: '123',
        ticketPrice: '0.1',
        maxTickets: '100',
        duration: '24',
      })
    })
    
    act(() => {
      vi.advanceTimersByTime(61000) // 61 seconds
    })
    
    expect(result.current.isProcessing).toBe(false)
    
    vi.useRealTimers()
  })

  it('checks NFT approval status', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({ data: true })
    vi.mocked(useReadContract).mockReturnValue({
      data: true,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useRaffleContractV4())
    
    await act(async () => {
      await result.current.checkApproval('0x1234567890123456789012345678901234567890', '123')
    })
    
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('handles contract write errors gracefully', async () => {
    const mockError = new Error('Transaction failed')
    vi.mocked(useWriteContract).mockReturnValue({
      writeContract: vi.fn().mockRejectedValue(mockError),
      data: null,
      isPending: false,
      error: mockError,
    })

    const { result } = renderHook(() => useRaffleContractV4())
    
    await act(async () => {
      try {
        await result.current.createRaffle({
          nftContract: '0x1234567890123456789012345678901234567890',
          tokenId: '123',
          ticketPrice: '0.1',
          maxTickets: '100',
          duration: '24',
        })
      } catch (error) {
        expect(error).toBe(mockError)
      }
    })
  })
})