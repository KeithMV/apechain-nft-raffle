import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RaffleDashboard from '../RaffleDashboard'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

// Mock custom hooks
vi.mock('../../hooks/useRafflePositions', () => ({
  useUserRafflePositions: vi.fn(),
  useCreatedRaffles: vi.fn(),
}))

vi.mock('../../hooks/useCancelRaffle', () => ({
  useCancelRaffle: vi.fn(),
}))

vi.mock('../../hooks/useWinnerSelection', () => ({
  useWinnerSelection: vi.fn(),
}))

// Mock components
vi.mock('../BasicNFTImage', () => ({
  default: ({ contractAddress, tokenId }: any) => (
    <div data-testid="nft-image">{contractAddress}-{tokenId}</div>
  ),
}))

vi.mock('../CopyAddress', () => ({
  default: ({ address }: any) => (
    <div data-testid="copy-address">{address}</div>
  ),
}))

import { useAccount } from 'wagmi'
import { useUserRafflePositions, useCreatedRaffles } from '../../hooks/useRafflePositions'
import { useCancelRaffle } from '../../hooks/useCancelRaffle'
import { useWinnerSelection } from '../../hooks/useWinnerSelection'

describe('RaffleDashboard', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890'
  
  const mockPosition = {
    raffleContract: '0xraffle1',
    raffleId: '1',
    nftContract: '0xnft1',
    tokenId: 123,
    userTickets: 5,
    ticketsSold: 50,
    maxTickets: 100,
    endTime: Date.now() / 1000 + 3600, // 1 hour from now
    isActive: true,
    completed: false,
    isWinner: false,
    winProbability: 5.0,
  }

  const mockRaffle = {
    raffleContract: '0xraffle2',
    raffleId: '2',
    nftContract: '0xnft2',
    tokenId: 456,
    ticketPrice: '0.1',
    ticketsSold: 25,
    maxTickets: 100,
    endTime: Date.now() / 1000 + 7200, // 2 hours from now
    isActive: true,
    completed: false,
    winner: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
    })
    
    vi.mocked(useUserRafflePositions).mockReturnValue({
      positions: [mockPosition],
      loading: false,
      refetch: vi.fn(),
    })
    
    vi.mocked(useCreatedRaffles).mockReturnValue({
      raffles: [mockRaffle],
      loading: false,
      refetch: vi.fn(),
    })
    
    vi.mocked(useCancelRaffle).mockReturnValue({
      cancelRaffle: vi.fn(),
      isPending: false,
      isSuccess: false,
    })
    
    vi.mocked(useWinnerSelection).mockReturnValue({
      emergencyReveal: vi.fn(),
      isPending: false,
      revealSuccess: false,
    })
  })

  it('renders dashboard with correct title', () => {
    render(<RaffleDashboard />)
    
    expect(screen.getByText('My Raffle Dashboard')).toBeInTheDocument()
  })

  it('shows participated tab by default', () => {
    render(<RaffleDashboard />)
    
    const participatedTab = screen.getByText(/Participated \(1\)/)
    expect(participatedTab).toBeInTheDocument()
    expect(participatedTab.closest('button')).toHaveClass('bg-emerald-500/20')
  })

  it('switches to created tab when clicked', () => {
    render(<RaffleDashboard />)
    
    const createdTab = screen.getByText(/Created \(1\)/)
    fireEvent.click(createdTab)
    
    expect(createdTab.closest('button')).toHaveClass('bg-emerald-500/20')
  })

  it('displays user raffle positions correctly', () => {
    render(<RaffleDashboard />)
    
    expect(screen.getByText('NFT #123')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // user tickets
    expect(screen.getByText('50/100')).toBeInTheDocument() // tickets sold
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('displays created raffles when tab is selected', () => {
    render(<RaffleDashboard />)
    
    const createdTab = screen.getByText(/Created \(1\)/)
    fireEvent.click(createdTab)
    
    expect(screen.getByText('NFT #456')).toBeInTheDocument()
    expect(screen.getByText('0.1 APE')).toBeInTheDocument() // ticket price
    expect(screen.getByText('25/100')).toBeInTheDocument() // tickets sold
  })

  it('shows loading state when data is loading', () => {
    vi.mocked(useUserRafflePositions).mockReturnValue({
      positions: [],
      loading: true,
      refetch: vi.fn(),
    })
    
    vi.mocked(useCreatedRaffles).mockReturnValue({
      raffles: [],
      loading: true,
      refetch: vi.fn(),
    })

    render(<RaffleDashboard />)
    
    expect(screen.getByText('Loading raffle data...')).toBeInTheDocument()
  })

  it('shows empty state when no raffles exist', () => {
    vi.mocked(useUserRafflePositions).mockReturnValue({
      positions: [],
      loading: false,
      refetch: vi.fn(),
    })

    render(<RaffleDashboard />)
    
    expect(screen.getByText('No Raffle Participation')).toBeInTheDocument()
    expect(screen.getByText("You haven't participated in any raffles yet")).toBeInTheDocument()
  })

  it('toggles show expired filter', () => {
    render(<RaffleDashboard />)
    
    const checkbox = screen.getByLabelText('Show Expired')
    expect(checkbox).toBeChecked()
    
    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})