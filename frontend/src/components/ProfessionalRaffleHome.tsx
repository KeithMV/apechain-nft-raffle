import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MinimalWalletConnection } from './MinimalWalletConnection';
import '../styles/professional-theme.css';

interface RaffleCardProps {
  id: number;
  nftName: string;
  nftImage: string;
  ticketPrice: string;
  ticketsSold: number;
  maxTickets: number;
  timeRemaining: string;
  creator: string;
}

const RaffleCard: React.FC<RaffleCardProps> = ({
  nftName,
  nftImage,
  ticketPrice,
  ticketsSold,
  maxTickets,
  timeRemaining,
  creator
}) => {
  const progress = (ticketsSold / maxTickets) * 100;
  
  return (
    <div className="card">
      <div className="mb-4">
        <img 
          src={nftImage} 
          alt={nftName}
          className="w-full h-48 object-cover rounded-lg bg-neutral-800"
          onError={(e) => {
            // Set fallback image on error
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMjcyNzJhIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzE3MTdhIiBmb250LXNpemU9IjE0Ij5ORlQ8L3RleHQ+Cjwvc3ZnPg==';
          }}
        />
      </div>
      
      <div className="card-header">
        <h3 className="card-title">{nftName}</h3>
        <p className="card-subtitle">by {creator.slice(0, 6)}...{creator.slice(-4)}</p>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-muted">Ticket Price</p>
          <p className="text-lg font-semibold text-primary">{ticketPrice} APE</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">Time Left</p>
          <p className="text-lg font-semibold text-accent">{timeRemaining}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted">Progress</span>
          <span className="font-medium">{ticketsSold}/{maxTickets} tickets</span>
        </div>
        <div className="w-full bg-neutral-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex gap-4">
        <button className="btn-primary flex-1">
          Buy Tickets
        </button>
        <button className="btn-secondary">
          View Details
        </button>
      </div>
    </div>
  );
};

const ProfessionalRaffleHome: React.FC = () => {
  const { isConnected } = useAccount();
  const [activeRaffles, setActiveRaffles] = useState<RaffleCardProps[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockRaffles: RaffleCardProps[] = [
      {
        id: 1,
        nftName: "Bored Ape #1234",
        nftImage: "https://via.placeholder.com/300x300/27272a/71717a?text=NFT",
        ticketPrice: "0.1",
        ticketsSold: 45,
        maxTickets: 100,
        timeRemaining: "2d 14h",
        creator: "0x1234567890abcdef1234567890abcdef12345678"
      },
      {
        id: 2,
        nftName: "CryptoPunk #5678",
        nftImage: "https://via.placeholder.com/300x300/27272a/71717a?text=NFT",
        ticketPrice: "0.05",
        ticketsSold: 78,
        maxTickets: 150,
        timeRemaining: "1d 8h",
        creator: "0xabcdef1234567890abcdef1234567890abcdef12"
      },
      {
        id: 3,
        nftName: "Azuki #9999",
        nftImage: "https://via.placeholder.com/300x300/27272a/71717a?text=NFT",
        ticketPrice: "0.25",
        ticketsSold: 12,
        maxTickets: 50,
        timeRemaining: "5d 2h",
        creator: "0x9876543210fedcba9876543210fedcba98765432"
      }
    ];
    setActiveRaffles(mockRaffles);
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--neutral-900)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav style={{ 
        background: 'var(--neutral-800)', 
        borderBottom: '1px solid var(--neutral-700)',
        height: 'var(--nav-height)'
      }}>
        <div className="container flex items-center justify-between" style={{ height: '100%' }}>
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-primary">ApeChain Raffles</h1>
            <div className="flex gap-4">
              <a href="#" className="text-sm font-medium text-neutral-300 hover:text-primary transition-colors">
                Active Raffles
              </a>
              <a href="#" className="text-sm font-medium text-neutral-300 hover:text-primary transition-colors">
                Create Raffle
              </a>
              <a href="#" className="text-sm font-medium text-neutral-300 hover:text-primary transition-colors">
                My Raffles
              </a>
            </div>
          </div>
          <MinimalWalletConnection />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-4" style={{ fontSize: '48px', lineHeight: '1.1' }}>
            Decentralized NFT Raffles
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Create and participate in provably fair NFT raffles on ApeChain. 
            Powered by smart contracts with transparent randomness.
          </p>
        </div>
        
        <div className="flex justify-center gap-4">
          <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }}>
            Browse Raffles
          </button>
          <button className="btn-secondary" style={{ padding: '16px 32px', fontSize: '16px' }}>
            Create Raffle
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card text-center">
            <h3 className="text-2xl font-bold text-primary mb-2">127</h3>
            <p className="text-sm text-muted">Active Raffles</p>
          </div>
          <div className="card text-center">
            <h3 className="text-2xl font-bold text-accent mb-2">2,450</h3>
            <p className="text-sm text-muted">Total Participants</p>
          </div>
          <div className="card text-center">
            <h3 className="text-2xl font-bold text-primary mb-2">890</h3>
            <p className="text-sm text-muted">NFTs Raffled</p>
          </div>
          <div className="card text-center">
            <h3 className="text-2xl font-bold text-accent mb-2">15,670</h3>
            <p className="text-sm text-muted">APE Volume</p>
          </div>
        </div>
      </section>

      {/* Active Raffles */}
      <section className="container" style={{ paddingBottom: '80px' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Active Raffles</h2>
          <div className="flex gap-2">
            <span className="badge badge-success">Live</span>
            <span className="text-sm text-muted">{activeRaffles.length} raffles</span>
          </div>
        </div>
        
        {!isConnected ? (
          <div className="card text-center" style={{ padding: '60px 24px' }}>
            <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
            <p className="text-muted mb-6">
              Connect your wallet to view and participate in NFT raffles
            </p>
            <MinimalWalletConnection />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRaffles.map((raffle) => (
              <RaffleCard key={raffle.id} {...raffle} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ 
        background: 'var(--neutral-800)', 
        borderTop: '1px solid var(--neutral-700)',
        padding: '40px 0'
      }}>
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-primary mb-2">ApeChain Raffles</h3>
              <p className="text-sm text-muted">Decentralized NFT raffles on ApeChain</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
                Documentation
              </a>
              <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
                Support
              </a>
              <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfessionalRaffleHome;