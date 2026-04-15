import React from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';

// Pure functions moved outside component
const formatAddress = (addr: string): string => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { open } = useWeb3Modal();
  
  const isMobile = isMobileDevice();

  // Simple debug logging for simplified system
  console.log('🔍 [SIMPLIFIED] WalletConnection rendered, isConnected:', isConnected);
  console.log('🔍 [SIMPLIFIED] Chain ID:', chainId);

  if (isConnected) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 sm:px-3 py-2 min-h-[44px]">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0"></div>
          <span className="text-slate-300 text-xs sm:text-sm font-mono wallet-text">
            {address ? formatAddress(address) : ''}
          </span>
        </div>
        
        <button
          onClick={() => disconnect()}
          aria-label="Disconnect wallet"
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-600/50 transition-colors min-h-[44px] whitespace-nowrap"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      {/* Simplified Connect Button - Mobile Safari Optimized */}
      <button
        onClick={() => open()}
        className="px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-base sm:text-lg font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[60px] sm:min-h-[70px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105 active:scale-95"
        style={{ 
          pointerEvents: 'auto', 
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
        onTouchStart={(e) => {
          console.log('🔍 [SIMPLIFIED] Touch start detected');
          // Prevent default to avoid iOS Safari issues
          e.preventDefault();
        }}
        onTouchEnd={(e) => {
          console.log('🔍 [SIMPLIFIED] Touch end detected - opening Web3Modal');
          e.preventDefault();
          open();
        }}
      >
        Connect Wallet
      </button>
      
      {/* Mobile help text */}
      {isMobile && (
        <div className="text-xs text-slate-400 text-center mt-2">
          Tap above to connect your mobile wallet
        </div>
      )}
    </div>
  );
}