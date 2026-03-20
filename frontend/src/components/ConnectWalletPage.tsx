/**
 * Connect Wallet Page Component
 * Landing page displayed when wallet is not connected
 */

import React from 'react';
import { AppHeader } from './AppHeader';
import { AppHero } from './AppHero';

export const ConnectWalletPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AppHero />
        </div>
      </div>
    </div>
  );
};