/**
 * Home Hero Section Component
 * Main hero section with title, description, and action buttons
 */

import React from 'react';

const HomeHeroSection: React.FC = () => {
  return (
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
  );
};

export default HomeHeroSection;