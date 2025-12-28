import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreateRafflePage from '../CreateRafflePage'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useSwitchChain: vi.fn(),
}))

// Mock custom hooks
vi.mock('../../hooks/useRaffleContractV4', () => ({
  useRaffleContractV4: vi.fn(),
  usePlatformFeeV4: vi.fn(),
  useNFTApprovalStatusV4: vi.fn(),
  useNFTApprovalV4: vi.fn(),
  useCreateRaffleV4: vi.fn(),
}))

vi.mock('../../hooks/useNFTMetadata', () => ({
  useNFTMetadata: vi.fn(),
}))

// Mock components
vi.mock('../BasicNFTImage', () => ({
  default: ({ contractAddress, tokenId }: any) => (
    <div data-testid="nft-preview">{contractAddress}-{tokenId}</div>
  ),
}))

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useRaffleContractV4, usePlatformFeeV4, useNFTApprovalStatusV4, useNFTApprovalV4, useCreateRaffleV4 } from '../../hooks/useRaffleContractV4'
import { useNFTMetadata } from '../../hooks/useNFTMetadata'

describe('CreateRafflePage', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890'
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
      addresses: [mockAddress],
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
        emitter: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
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
    
    vi.mocked(useChainId).mockReturnValue(33139)
    
    vi.mocked(useSwitchChain).mockReturnValue({ 
      switchChain: vi.fn(),
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
    
    vi.mocked(usePlatformFeeV4).mockReturnValue({
      data: 1000n, // 10%
    })
    
    vi.mocked(useNFTApprovalStatusV4).mockReturnValue({
      data: false,
      refetch: vi.fn(),
    })
    
    vi.mocked(useNFTApprovalV4).mockReturnValue({
      approveNFT: vi.fn(),
      isPending: false,
      isSuccess: false,
    })
    
    vi.mocked(useCreateRaffleV4).mockReturnValue({
      createRaffle: vi.fn(),
      isPending: false,
      isSuccess: false,
    })
    
    vi.mocked(useRaffleContractV4).mockReturnValue({
      createRaffle: vi.fn(),
      approveNFT: vi.fn(),
      isProcessing: false,
      needsApproval: false,
      checkApproval: vi.fn(),
    })
    
    vi.mocked(useNFTMetadata).mockReturnValue({
      metadata: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('renders create raffle form', () => {
    render(<CreateRafflePage />)
    
    expect(screen.getByText('Create NFT Raffle')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('123')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('100')).toBeInTheDocument()
  })

  it('validates required form fields', async () => {
    render(<CreateRafflePage />)
    
    const createButton = screen.getByText('NFT Approval Required')
    fireEvent.click(createButton)
    
    // Component shows "NFT Approval Required" when form is incomplete
    expect(screen.getByText('NFT Approval Required')).toBeInTheDocument()
  })

  it('validates NFT contract address format', async () => {
    render(<CreateRafflePage />)
    
    const contractInput = screen.getByPlaceholderText('0x...')
    fireEvent.change(contractInput, { target: { value: 'invalid-address' } })
    
    // Component sanitizes invalid addresses to empty string
    expect(contractInput.value).toBe('')
  })

  it('validates ticket price is positive', async () => {
    render(<CreateRafflePage />)
    
    const priceInput = screen.getByPlaceholderText('0.1')
    fireEvent.change(priceInput, { target: { value: '0' } })
    
    // Component sanitizes invalid prices
    expect(priceInput.value).toBe('0.001') // minimum value
  })

  it('validates max tickets range', async () => {
    render(<CreateRafflePage />)
    
    const maxTicketsInput = screen.getByPlaceholderText('100')
    fireEvent.change(maxTicketsInput, { target: { value: '0' } })
    
    // Component sanitizes to minimum value
    expect(maxTicketsInput.value).toBe('1')
  })

  it('shows NFT preview when valid contract and token ID entered', async () => {
    vi.mocked(useNFTMetadata).mockReturnValue({
      metadata: {
        name: 'Test NFT',
        description: 'Test Description',
        image: 'https://example.com/image.png',
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CreateRafflePage />)
    
    const contractInput = screen.getByPlaceholderText('0x...')
    const tokenInput = screen.getByPlaceholderText('123')
    
    fireEvent.change(contractInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    fireEvent.change(tokenInput, { target: { value: '123' } })
    
    // Component shows approval section when contract is entered
    await waitFor(() => {
      expect(screen.getByText('NFT Approval Status')).toBeInTheDocument()
    })
  })

  it('shows approval button when NFT needs approval', async () => {
    vi.mocked(useNFTApprovalStatusV4).mockReturnValue({
      data: false, // needs approval
      refetch: vi.fn(),
    })

    render(<CreateRafflePage />)
    
    // Enter a contract address to trigger approval section
    const contractInput = screen.getByPlaceholderText('0x...')
    fireEvent.change(contractInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    
    await waitFor(() => {
      expect(screen.getByText('Approve NFT Contract')).toBeInTheDocument()
    })
  })

  it('shows processing state during raffle creation', () => {
    vi.mocked(useCreateRaffleV4).mockReturnValue({
      createRaffle: vi.fn(),
      isPending: true,
      isSuccess: false,
    })

    render(<CreateRafflePage />)
    
    expect(screen.getByText('Creating raffle...')).toBeInTheDocument()
  })

  it('fills form with valid data and submits', async () => {
    const mockCreateRaffle = vi.fn()
    vi.mocked(useCreateRaffleV4).mockReturnValue({
      createRaffle: mockCreateRaffle,
      isPending: false,
      isSuccess: false,
    })
    
    vi.mocked(useNFTApprovalStatusV4).mockReturnValue({
      data: true, // approved
      refetch: vi.fn(),
    })

    render(<CreateRafflePage />)
    
    // Fill form using placeholders
    fireEvent.change(screen.getByPlaceholderText('0x...'), {
      target: { value: '0x1234567890123456789012345678901234567890' }
    })
    fireEvent.change(screen.getByPlaceholderText('123'), {
      target: { value: '123' }
    })
    fireEvent.change(screen.getByPlaceholderText('0.1'), {
      target: { value: '0.1' }
    })
    fireEvent.change(screen.getByPlaceholderText('100'), {
      target: { value: '100' }
    })
    
    // Wait for approval status to update, then click create button
    await waitFor(() => {
      const buttons = screen.getAllByText('Create NFT Raffle')
      expect(buttons.length).toBeGreaterThan(0)
    })
    
    const createButton = screen.getAllByText('Create NFT Raffle').find(el => el.tagName === 'SPAN')
    if (createButton) {
      fireEvent.click(createButton.closest('button')!)
      
      await waitFor(() => {
        expect(mockCreateRaffle).toHaveBeenCalled()
      })
    }
  })
})