import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WalletConnection } from '../WalletConnection'

// Mock @web3modal/wagmi/react
vi.mock('@web3modal/wagmi/react', () => ({
  useWeb3Modal: vi.fn(),
  createWeb3Modal: vi.fn(),
}))

// Mock config
vi.mock('../../config/environment', () => ({
  config: {
    environment: 'development',
    chainId: 33139,
    enableLogging: true,
  },
}))

import { useAccount, useDisconnect, useChainId } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'

describe('WalletConnection', () => {
  const mockOpen = vi.fn()
  const mockDisconnect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Use global mocks from setup.ts
    vi.mocked(useWeb3Modal).mockReturnValue({ open: mockOpen, close: vi.fn() } as any)
    vi.mocked(useDisconnect).mockReturnValue({ disconnect: mockDisconnect } as any)
    vi.mocked(useChainId).mockReturnValue(33139)
  })

  it('shows connect button when wallet is not connected and not connecting', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false,
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
    
    // Component shows "Connecting..." when isConnecting is true
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

  it('opens Web3Modal when connect button is clicked', async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false, // Explicitly not connecting
    } as any)

    render(<WalletConnection />)
    
    const connectButton = screen.getByText('Connect Wallet')
    fireEvent.click(connectButton)
    
    // Wait for setTimeout delay in mobile Safari fix
    await new Promise(resolve => setTimeout(resolve, 150))
    
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