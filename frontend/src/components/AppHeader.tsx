/**
 * App Header Component
 * Main navigation header with wallet connection and network-aware styling
 */

import React, { Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useNetwork } from '../contexts/NetworkContext';
import { WalletConnection } from './WalletConnection';
import { NetworkSwitcher } from './NetworkSwitcher';
import { Web3Title } from './Web3Title';

// Lazy load WalletInfo for better performance
const WalletInfo = React.lazy(() => import('./WalletInfo'));

// Optimized loading fallback
const LoadingFallback = React.memo(() => (
  <div className="flex items-center justify-center py-2">
    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
));

interface NavigationLinkProps {
  to: string;
  children: React.ReactNode;
  currentPage: string;
  isApeChain: boolean;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({ to, children, currentPage, isApeChain }) => {
  const page = to.slice(1); // Remove leading slash
  const isActive = currentPage === page;
  
  const navActiveStyle = isApeChain 
    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
    : 'bg-blue-500/20 text-blue-300 border border-blue-400/50';
  const navHoverStyle = isApeChain
    ? 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-400/30'
    : 'text-slate-300 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent hover:border-blue-400/30';

  return (
    <Link
      to={to}
      className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
        isActive ? navActiveStyle : navHoverStyle
      }`}
    >
      {children}
    </Link>
  );
};

export const AppHeader: React.FC = () => {
  const { isConnected } = useAccount();
  const { isApeChain } = useNetwork();
  const location = useLocation();
  const currentPage = location.pathname.slice(1) || 'browse';
  
  // Network-aware header styling
  const headerBorderColor = isApeChain ? 'border-emerald-400/30' : 'border-blue-400/30';
  
  return (
    <header className={`relative bg-slate-900/95 backdrop-blur-xl border-b ${headerBorderColor} shadow-2xl z-10`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col justify-center items-center py-4 space-y-3">
          <div className="flex flex-col items-center space-y-2">
            <div>
              <Web3Title />
            </div>
            {isConnected && (
              <nav className="flex space-x-2">
                <NavigationLink to="/create" currentPage={currentPage} isApeChain={isApeChain}>
                  CREATE
                </NavigationLink>
                <NavigationLink to="/dashboard" currentPage={currentPage} isApeChain={isApeChain}>
                  DASHBOARD
                </NavigationLink>
                <NavigationLink to="/browse" currentPage={currentPage} isApeChain={isApeChain}>
                  BROWSE
                </NavigationLink>
              </nav>
            )}
          </div>
          <div className="flex flex-col items-center space-y-2">
            {isConnected && (
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <NetworkSwitcher />
                <Suspense fallback={<LoadingFallback />}>
                  <WalletInfo />
                </Suspense>
              </div>
            )}
            <WalletConnection />
          </div>
        </div>
      </div>
    </header>
  );
};