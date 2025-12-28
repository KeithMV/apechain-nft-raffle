import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WalletConnection } from '../WalletConnection'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useDisconnect: vi.fn(),
  useChainId: vi.fn(),
  useSwitchChain: vi.fn(),
}))

// Mock Web3Modal
vi.mock('@web3modal/wagmi/react', () => ({
  useWeb3Modal: vi.fn(),
  createWeb3Modal: vi.fn(),
}))

// Mock wagmi config
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
    
    // Default mock implementations
    vi.mocked(useWeb3Modal).mockReturnValue({ open: mockOpen, close: vi.fn() })
    vi.mocked(useDisconnect).mockReturnValue({ 
      disconnect: mockDisconnect,
      disconnectAsync: vi.fn(),
      data: undefined,
      error: null,
      variables: undefined,
      isError: false,
      isIdle: true,
      isPending: false,
      isSuccess: false,
      isPaused: false,
      status: 'idle',
      reset: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      submittedAt: 0,
      connectors: []
    })
    vi.mocked(useSwitchChain).mockReturnValue({ 
      switchChain: mockSwitchChain,
      switchChainAsync: vi.fn(),
      data: undefined,
      error: null,
      variables: undefined,
      isError: false,
      isIdle: true,
      isPending: false,
      isSuccess: false,
      isPaused: false,
      status: 'idle',
      reset: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      submittedAt: 0,
      chains: [{ 
        id: 33139, 
        name: 'ApeChain',
        nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 },
        rpcUrls: { default: { http: ['https://apechain.calderachain.xyz/http'] } }
      }]
    })
    vi.mocked(useChainId).mockReturnValue(33139)
  })

  it('shows connect button when wallet is not connected', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      addresses: undefined,
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
      status: 'disconnected'
    })

    render(<WalletConnection />)
    
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })

  it('shows connecting state when wallet is connecting', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      addresses: undefined,
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnected: false,
      isConnecting: true,
      isReconnecting: false,
      isDisconnected: false,
      status: 'connecting'
    })

    render(<WalletConnection />)
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument()
  })

  it('shows wallet address when connected', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      addresses: ['0x1234567890123456789012345678901234567890'],
      chain: { 
        id: 33139, 
        name: 'ApeChain',
        nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 },
        rpcUrls: { default: { http: ['https://apechain.calderachain.xyz/http'] } }
      },
      chainId: 33139,
      connector: { 
        id: 'mock', 
        name: 'Mock',
        type: 'mock',
        uid: 'mock-uid',
        emitter: { 
          uid: 'emitter-uid',
          _emitter: {
            eventNames: vi.fn(),
            listeners: vi.fn(),
            listenerCount: vi.fn(),
            emit: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
            once: vi.fn(),
            removeListener: vi.fn(),
            removeAllListeners: vi.fn(),
            setMaxListeners: vi.fn()
          },
          on: vi.fn(),
          off: vi.fn(),
          once: vi.fn(),
          emit: vi.fn(),
          listenerCount: vi.fn()
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        getAccounts: vi.fn(),
        getChainId: vi.fn(),
        getProvider: vi.fn(),
        isAuthorized: vi.fn(),
        switchChain: vi.fn(),
        onAccountsChanged: vi.fn(),
        onChainChanged: vi.fn(),
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onMessage: vi.fn()
      },
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: false,
      status: 'connected'
    })

    render(<WalletConnection />)
    
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
    expect(screen.getByText('Disconnect')).toBeInTheDocument()
  })

  it('opens Web3Modal when connect button is clicked', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      addresses: undefined,
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
      status: 'disconnected'
    })

    render(<WalletConnection />)
    
    const connectButton = screen.getByText('Connect Wallet')
    fireEvent.click(connectButton)
    
    expect(mockOpen).toHaveBeenCalled()
  })

  it('shows network switch button when on wrong network', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      addresses: ['0x1234567890123456789012345678901234567890'],
      chain: { 
        id: 1, 
        name: 'Ethereum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://mainnet.infura.io'] } }
      },
      chainId: 1,
      connector: { 
        id: 'mock', 
        name: 'Mock',
        type: 'mock',
        uid: 'mock-uid',
        emitter: { 
          uid: 'emitter-uid',
          _emitter: {
            eventNames: vi.fn(),
            listeners: vi.fn(),
            listenerCount: vi.fn(),
            emit: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
            once: vi.fn(),
            removeListener: vi.fn(),
            removeAllListeners: vi.fn(),
            setMaxListeners: vi.fn()
          },
          on: vi.fn(),
          off: vi.fn(),
          once: vi.fn(),
          emit: vi.fn(),
          listenerCount: vi.fn()
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        getAccounts: vi.fn(),
        getChainId: vi.fn(),
        getProvider: vi.fn(),
        isAuthorized: vi.fn(),
        switchChain: vi.fn(),
        onAccountsChanged: vi.fn(),
        onChainChanged: vi.fn(),
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onMessage: vi.fn()
      },
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: false,
      status: 'connected'
    })
    
    // Mock wrong chain ID
    vi.mocked(useChainId).mockReturnValue(1) // Ethereum mainnet instead of ApeChain

    render(<WalletConnection />)
    
    expect(screen.getByText('Switch to ApeChain')).toBeInTheDocument()
  })
})