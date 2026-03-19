import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CreateRafflePage from '../CreateRafflePage'

// Mock wagmi hooks with simple return values
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useSwitchChain: vi.fn(),
  usePublicClient: vi.fn(),
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  }
})

// Mock Network Context
vi.mock('../../contexts/NetworkContext', () => ({
  useNetwork: vi.fn(() => ({
    theme: 'apechain',
    nativeCurrency: 'APE',
    networkName: 'ApeChain',
    isApeChain: true,
    isPolygon: false,
  })),
}))

// Mock ApeChain switching
vi.mock('../../hooks/useApeChainSwitching', () => ({
  useApeChainSwitching: vi.fn(() => ({
    switchToApeChain: vi.fn(),
    isSwitching: false,
  })),
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

// Mock new hooks
vi.mock('../../hooks/useUserNFTs', () => ({
  useUserNFTs: vi.fn(() => ({
    nfts: [],
    loading: false,
    error: false,
  })),
}))

vi.mock('../../hooks/useNFTApprovalManager', () => ({
  useNFTApprovalManager: vi.fn(() => ({
    approvalStatus: null,
    isCheckingApproval: false,
    currentContract: '',
    approvalPending: false,
    approvalConfirming: false,
    approvalSuccess: false,
    approvalError: null,
    checkApprovalForContract: vi.fn(),
    approveContract: vi.fn(),
    clearApprovalState: vi.fn(),
    allApprovalStates: {}
  })),
}))

// Mock components
vi.mock('../BasicNFTImage', () => ({
  default: ({ contractAddress, tokenId }: any) => (
    <div data-testid="nft-preview">{contractAddress}-{tokenId}</div>
  ),
}))

vi.mock('../NFTGrid', () => ({
  default: ({ nfts, onSelect }: any) => (
    <div data-testid="nft-grid">NFT Grid with {nfts.length} NFTs</div>
  ),
}))

import { useAccount, useChainId, useSwitchChain, usePublicClient } from 'wagmi'
import { useRaffleContractV4, usePlatformFeeV4, useNFTApprovalStatusV4, useNFTApprovalV4, useCreateRaffleV4 } from '../../hooks/useRaffleContractV4'
import { useNFTMetadata } from '../../hooks/useNFTMetadata'
import { useUserNFTs } from '../../hooks/useUserNFTs'

describe('CreateRafflePage', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890'
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Simple mocks focused on behavior, not implementation
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    } as any)
    
    vi.mocked(useChainId).mockReturnValue(33139)
    vi.mocked(useSwitchChain).mockReturnValue({ switchChain: vi.fn() } as any)
    vi.mocked(usePublicClient).mockReturnValue({} as any)
    
    vi.mocked(usePlatformFeeV4).mockReturnValue({ data: 1000n } as any)
    vi.mocked(useNFTApprovalStatusV4).mockReturnValue({ data: false, refetch: vi.fn() } as any)
    vi.mocked(useNFTApprovalV4).mockReturnValue({ approveNFT: vi.fn(), isPending: false, isSuccess: false } as any)
    vi.mocked(useCreateRaffleV4).mockReturnValue({ createRaffle: vi.fn(), isPending: false, isSuccess: false } as any)
    vi.mocked(useRaffleContractV4).mockReturnValue({ createRaffle: vi.fn(), approveNFT: vi.fn(), isProcessing: false, needsApproval: false, checkApproval: vi.fn() } as any)
    vi.mocked(useNFTMetadata).mockReturnValue({ metadata: null, loading: false, error: null, refetch: vi.fn() } as any)
    vi.mocked(useUserNFTs).mockReturnValue({ nfts: [], loading: false, error: false } as any)
  })

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  it('renders create raffle form', () => {
    renderWithRouter(<CreateRafflePage />)
    
    expect(screen.getByText('Create NFT Raffle')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('123')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('100')).toBeInTheDocument()
  })

  it('validates NFT contract address format', async () => {
    renderWithRouter(<CreateRafflePage />)
    
    const contractInput = screen.getByPlaceholderText('0x...')
    
    // Test that normal invalid text is preserved (allows partial typing)
    fireEvent.change(contractInput, { target: { value: 'invalid-address' } })
    expect(contractInput.value).toBe('invalid-address')
    
    // Test that valid addresses work
    fireEvent.change(contractInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    expect(contractInput.value).toBe('0x1234567890123456789012345678901234567890')
    
    // Test that dangerous characters are filtered
    fireEvent.change(contractInput, { target: { value: 'test<>"&address' } })
    expect(contractInput.value).toBe('testaddress')
  })

  it('validates ticket price is positive', async () => {
    renderWithRouter(<CreateRafflePage />)
    
    const priceInput = screen.getByPlaceholderText('0.1')
    fireEvent.change(priceInput, { target: { value: '0' } })
    
    expect(priceInput.value).toBe('0.001')
  })

  it('validates max tickets range', async () => {
    renderWithRouter(<CreateRafflePage />)
    
    const maxTicketsInput = screen.getByPlaceholderText('100')
    fireEvent.change(maxTicketsInput, { target: { value: '0' } })
    
    expect(maxTicketsInput.value).toBe('1')
  })

  it('shows approval button when NFT needs approval', async () => {
    vi.mocked(useNFTApprovalStatusV4).mockReturnValue({ data: false, refetch: vi.fn() } as any)

    renderWithRouter(<CreateRafflePage />)
    
    const contractInput = screen.getByPlaceholderText('0x...')
    fireEvent.change(contractInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    
    await waitFor(() => {
      expect(screen.getByText('Approve NFT Contract')).toBeInTheDocument()
    })
  })

  it('shows processing state during raffle creation', () => {
    vi.mocked(useCreateRaffleV4).mockReturnValue({ createRaffle: vi.fn(), isPending: true, isSuccess: false } as any)

    renderWithRouter(<CreateRafflePage />)
    
    expect(screen.getByText('Creating raffle...')).toBeInTheDocument()
  })

  it('calls createRaffle when form is submitted with valid data', async () => {
    const mockCreateRaffle = vi.fn()
    vi.mocked(useCreateRaffleV4).mockReturnValue({ createRaffle: mockCreateRaffle, isPending: false, isSuccess: false } as any)
    vi.mocked(useNFTApprovalStatusV4).mockReturnValue({ data: true, refetch: vi.fn() } as any)

    renderWithRouter(<CreateRafflePage />)
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: '0x1234567890123456789012345678901234567890' } })
    fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '123' } })
    fireEvent.change(screen.getByPlaceholderText('0.1'), { target: { value: '0.1' } })
    fireEvent.change(screen.getByPlaceholderText('100'), { target: { value: '100' } })
    
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