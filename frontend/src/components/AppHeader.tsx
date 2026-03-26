/**
 * App Header Component
 * Main navigation header with wallet connection and network-aware styling
 */

import React, { Suspense, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useNetwork } from '../contexts/NetworkContext';
import { WalletConnection } from './WalletConnection';
import { NetworkSwitcher } from './NetworkSwitcher';
import { Web3Title } from './Web3Title';
import PerformanceDashboard from './PerformanceDashboard';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

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
    : 'bg-purple-500/20 text-purple-300 border border-purple-400/50';
  const navHoverStyle = isApeChain
    ? 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-400/30'
    : 'text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-400/30';

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
  
  // Performance dashboard state
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const { getPerformanceSummary } = usePerformanceMonitor();
  const performanceSummary = getPerformanceSummary();
  
  // Network-aware header styling
  const headerBorderColor = isApeChain ? 'border-emerald-400/30' : 'border-purple-400/30';
  
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
                {/* Performance Dashboard Button */}
                <button
                  onClick={() => setShowPerformanceDashboard(true)}
                  className={`relative p-2 rounded-lg transition-all duration-200 ${
                    isApeChain 
                      ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                      : 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
                  }`}
                  title="Performance Dashboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  
                  {/* Performance Health Indicator */}
                  {performanceSummary.totalOperations > 0 && (
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                      performanceSummary.health === 'excellent' ? (isApeChain ? 'bg-emerald-400' : 'bg-purple-400') :
                      performanceSummary.health === 'good' ? 'bg-green-400' :
                      performanceSummary.health === 'fair' ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}></div>
                  )}
                </button>
                
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
      
      {/* Performance Dashboard Modal */}
      <PerformanceDashboard 
        isOpen={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
      />
    </header>
  );
};