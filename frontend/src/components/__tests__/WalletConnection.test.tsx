import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WalletConnection } from '../WalletConnection'

// Mock wagmi hooks at module level with simple return values
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useDisconnect: vi.fn(),
  useChainId: vi.fn(),
  useSwitchChain: vi.fn(),
}))

vi.mock('@web3modal/wagmi/react', () => ({
  useWeb3Modal: vi.fn(),
  createWeb3Modal: vi.fn(),
}))

vi.mock('../config/wagmi', () => ({
  apeChain: { id: 33139 },
}))

import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'

describe('WalletConnection', () => {
  const mockOpen = vi.fn()
  const mockDisconnect = vi.fn()
  const mockSwitchChain = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Simple module-level mocks focused on behavior
    vi.mocked(useWeb3Modal).mockReturnValue({ open: mockOpen, close: vi.fn() } as any)
    vi.mocked(useDisconnect).mockReturnValue({ disconnect: mockDisconnect } as any)
    vi.mocked(useSwitchChain).mockReturnValue({ switchChain: mockSwitchChain } as any)
    vi.mocked(useChainId).mockReturnValue(33139)
  })

  it('shows connect button when wallet is not connected', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any)

    render(<WalletConnection />)
    
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })

  it('shows connecting state when wallet is connecting', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: true,
    } as any)

    render(<WalletConnection />)
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument()
  })

  it('shows wallet address when connected', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    } as any)

    render(<WalletConnection />)
    
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
    expect(screen.getByText('Disconnect')).toBeInTheDocument()
  })

  it('opens Web3Modal when connect button is clicked', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any)

    render(<WalletConnection />)
    
    const connectButton = screen.getByText('Connect Wallet')
    fireEvent.click(connectButton)
    
    expect(mockOpen).toHaveBeenCalled()
  })

  it('calls disconnect when disconnect button is clicked', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    } as any)

    render(<WalletConnection />)
    
    const disconnectButton = screen.getByText('Disconnect')
    fireEvent.click(disconnectButton)
    
    expect(mockDisconnect).toHaveBeenCalled()
  })
})