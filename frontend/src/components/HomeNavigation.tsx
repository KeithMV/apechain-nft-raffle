/**
 * Home Navigation Component
 * Navigation bar for the professional raffle home page
 */

import React from 'react';
import { WalletConnection } from './WalletConnection';

const HomeNavigation: React.FC = () => {
  return (
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
        <WalletConnection />
      </div>
    </nav>
  );
};

export default HomeNavigation;