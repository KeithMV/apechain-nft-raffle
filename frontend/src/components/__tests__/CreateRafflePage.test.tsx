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
import { useRaffleContractV4 } from '../../hooks/useRaffleContractV4'
import { useNFTMetadata } from '../../hooks/useNFTMetadata'

describe('CreateRafflePage', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890'
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    })
    
    vi.mocked(useSwitchChain).mockReturnValue({ switchChain: vi.fn() })
    
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
    expect(screen.getByLabelText(/NFT Contract Address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Token ID/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Ticket Price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Max Tickets/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument()
  })

  it('validates required form fields', async () => {
    render(<CreateRafflePage />)
    
    const createButton = screen.getByText('Create Raffle')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/NFT contract address is required/i)).toBeInTheDocument()
    })
  })

  it('validates NFT contract address format', async () => {
    render(<CreateRafflePage />)
    
    const contractInput = screen.getByLabelText(/NFT Contract Address/i)
    fireEvent.change(contractInput, { target: { value: 'invalid-address' } })
    
    const createButton = screen.getByText('Create Raffle')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid contract address/i)).toBeInTheDocument()
    })
  })

  it('validates ticket price is positive', async () => {
    render(<CreateRafflePage />)
    
    const priceInput = screen.getByLabelText(/Ticket Price/i)
    fireEvent.change(priceInput, { target: { value: '0' } })
    
    const createButton = screen.getByText('Create Raffle')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Ticket price must be greater than 0/i)).toBeInTheDocument()
    })
  })

  it('validates max tickets range', async () => {
    render(<CreateRafflePage />)
    
    const maxTicketsInput = screen.getByLabelText(/Max Tickets/i)
    fireEvent.change(maxTicketsInput, { target: { value: '0' } })
    
    const createButton = screen.getByText('Create Raffle')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Max tickets must be between 1 and 10000/i)).toBeInTheDocument()
    })
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
    
    const contractInput = screen.getByLabelText(/NFT Contract Address/i)
    const tokenInput = screen.getByLabelText(/Token ID/i)
    
    fireEvent.change(contractInput, { target: { value: '0x1234567890123456789012345678901234567890' } })
    fireEvent.change(tokenInput, { target: { value: '123' } })
    
    await waitFor(() => {
      expect(screen.getByTestId('nft-preview')).toBeInTheDocument()
    })
  })

  it('shows approval button when NFT needs approval', () => {
    vi.mocked(useRaffleContractV4).mockReturnValue({
      createRaffle: vi.fn(),
      approveNFT: vi.fn(),
      isProcessing: false,
      needsApproval: true,
      checkApproval: vi.fn(),
    })

    render(<CreateRafflePage />)
    
    expect(screen.getByText('Approve NFT')).toBeInTheDocument()
  })

  it('shows processing state during raffle creation', () => {
    vi.mocked(useRaffleContractV4).mockReturnValue({
      createRaffle: vi.fn(),
      approveNFT: vi.fn(),
      isProcessing: true,
      needsApproval: false,
      checkApproval: vi.fn(),
    })

    render(<CreateRafflePage />)
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
  })

  it('fills form with valid data and submits', async () => {
    const mockCreateRaffle = vi.fn()
    vi.mocked(useRaffleContractV4).mockReturnValue({
      createRaffle: mockCreateRaffle,
      approveNFT: vi.fn(),
      isProcessing: false,
      needsApproval: false,
      checkApproval: vi.fn(),
    })

    render(<CreateRafflePage />)
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/NFT Contract Address/i), {
      target: { value: '0x1234567890123456789012345678901234567890' }
    })
    fireEvent.change(screen.getByLabelText(/Token ID/i), {
      target: { value: '123' }
    })
    fireEvent.change(screen.getByLabelText(/Ticket Price/i), {
      target: { value: '0.1' }
    })
    fireEvent.change(screen.getByLabelText(/Max Tickets/i), {
      target: { value: '100' }
    })
    
    // Submit form
    fireEvent.click(screen.getByText('Create Raffle'))
    
    await waitFor(() => {
      expect(mockCreateRaffle).toHaveBeenCalled()
    })
  })
})