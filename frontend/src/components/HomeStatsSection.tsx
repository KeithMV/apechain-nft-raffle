/**
 * Home Stats Section Component
 * Displays platform statistics in a grid layout
 */

import React from 'react';

export interface PlatformStats {
  activeRaffles: number;
  totalParticipants: number;
  nftsRaffled: number;
  apeVolume: number;
}

interface HomeStatsSectionProps {
  stats?: PlatformStats;
}

const HomeStatsSection: React.FC<HomeStatsSectionProps> = ({ 
  stats = {
    activeRaffles: 127,
    totalParticipants: 2450,
    nftsRaffled: 890,
    apeVolume: 15670
  }
}) => {
  return (
    <section className="container mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-primary mb-2">{stats.activeRaffles}</h3>
          <p className="text-sm text-muted">Active Raffles</p>
        </div>
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-accent mb-2">{stats.totalParticipants.toLocaleString()}</h3>
          <p className="text-sm text-muted">Total Participants</p>
        </div>
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-primary mb-2">{stats.nftsRaffled}</h3>
          <p className="text-sm text-muted">NFTs Raffled</p>
        </div>
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-accent mb-2">{stats.apeVolume.toLocaleString()}</h3>
          <p className="text-sm text-muted">APE Volume</p>
        </div>
      </div>
    </section>
  );
};

export default HomeStatsSection;