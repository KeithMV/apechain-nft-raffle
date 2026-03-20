import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { WalletConnection } from './WalletConnection';
import HomeNavigation from './HomeNavigation';
import HomeHeroSection from './HomeHeroSection';
import HomeStatsSection from './HomeStatsSection';
import HomeRaffleCard, { HomeRaffleCardProps } from './HomeRaffleCard';
import HomeFooter from './HomeFooter';
import '../styles/professional-theme.css';
// Phase 11: Performance monitoring for component extraction
import { measureSync } from '../utils/performance';

const ProfessionalRaffleHome: React.FC = () => {
  const { isConnected } = useAccount();
  const [activeRaffles, setActiveRaffles] = useState<HomeRaffleCardProps[]>([]);

  // Mock data for demonstration - Phase 11: Performance monitored
  useEffect(() => {
    const mockRaffles = measureSync('home-mock-data-generation', () => {
      return [
        {
          id: 1,
          nftName: "Bored Ape #1234",
          nftContract: "0x6f2A21A8B9CF699d7D3A713a9d7cFbB9E9760f97",
          tokenId: "1234",
          ticketPrice: "0.1",
          ticketsSold: 45,
          maxTickets: 100,
          timeRemaining: "2d 14h",
          creator: "0x1234567890abcdef1234567890abcdef12345678"
        },
        {
          id: 2,
          nftName: "CryptoPunk #5678",
          nftContract: "0xDe970C730cD7056B654b12366ADEE48d21ea2c23",
          tokenId: "5678",
          ticketPrice: "0.05",
          ticketsSold: 78,
          maxTickets: 150,
          timeRemaining: "1d 8h",
          creator: "0xabcdef1234567890abcdef1234567890abcdef12"
        },
        {
          id: 3,
          nftName: "Azuki #9999",
          nftContract: "0x75f511bd8D4Ba4Ad48060E59F189B12810509228",
          tokenId: "9999",
          ticketPrice: "0.25",
          ticketsSold: 12,
          maxTickets: 50,
          timeRemaining: "5d 2h",
          creator: "0x9876543210fedcba9876543210fedcba98765432"
        }
      ];
    });
    setActiveRaffles(mockRaffles);
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--neutral-900)', minHeight: '100vh' }}>
      {/* Navigation - Phase 11: Extracted component */}
      <HomeNavigation />

      {/* Hero Section - Phase 11: Extracted component */}
      <HomeHeroSection />

      {/* Stats Section - Phase 11: Extracted component */}
      <HomeStatsSection />

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
            <WalletConnection />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRaffles.map((raffle) => (
              <HomeRaffleCard key={raffle.id} {...raffle} />
            ))}
          </div>
        )}
      </section>

      {/* Footer - Phase 11: Extracted component */}
      <HomeFooter />
    </div>
  );
};

export default ProfessionalRaffleHome;