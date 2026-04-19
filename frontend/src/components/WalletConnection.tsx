import React, { useState, useCallback } from 'react';
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
  
  // STEP 1: Connection state management
  const [isConnecting, setIsConnecting] = useState(false);
  
  const isMobile = isMobileDevice();

  // CRITICAL: Debug the Web3Modal hook
  console.log('🔍 [DEBUG] WalletConnection rendered, isConnected:', isConnected);
  console.log('🔍 [DEBUG] Chain ID:', chainId);
  console.log('🔍 [DEBUG] Web3Modal open function:', typeof open, open);
  console.log('🔍 [DEBUG] Connection state:', { isConnecting, isMobile });
  
  // STEP 1: Enhanced mobile-optimized connection handler
  const handleConnect = useCallback(() => {
    // Prevent double-tap/rapid clicks
    if (isConnecting) {
      console.log('🔄 [DEBUG] Connection already in progress, ignoring tap');
      return;
    }
    
    console.log('🔍 [DEBUG] Connect button clicked');
    console.log('🔍 [DEBUG] open function type:', typeof open);
    console.log('🔍 [DEBUG] User agent:', navigator.userAgent);
    
    if (typeof open === 'function') {
      console.log('🔍 [DEBUG] Starting connection process...');
      
      // Set connecting state immediately
      setIsConnecting(true);
      
      try {
        // Mobile-specific delay: iOS Safari needs breathing room
        const delay = isMobile ? 150 : 0;
        
        setTimeout(() => {
          open();
          console.log('✅ [DEBUG] Web3Modal open() called successfully');
          
          // Reset connecting state after modal should be open
          setTimeout(() => {
            setIsConnecting(false);
            console.log('🔄 [DEBUG] Connection state reset');
          }, 1000);
        }, delay);
      } catch (error) {
        console.error('🚨 [DEBUG] open() failed:', error);
        setIsConnecting(false);
      }
    } else {
      console.error('🚨 [DEBUG] open is not a function! Web3Modal not initialized properly.');
      setIsConnecting(false);
    }
  }, [open, isConnecting, isMobile]);

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
      {/* STEP 2: Single event handler - no duplicate touch events */}
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-base sm:text-lg font-bold transition-all duration-300 min-h-[60px] sm:min-h-[70px] whitespace-nowrap shadow-lg shadow-pink-500/30 ${
          isConnecting 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:from-pink-400 hover:to-fuchsia-400 hover:shadow-pink-500/40 hover:scale-105 active:scale-95'
        }`}
        style={{ 
          pointerEvents: isConnecting ? 'none' : 'auto', 
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          // CRITICAL: Mobile Safari specific fixes
          WebkitTouchCallout: 'none',
          WebkitAppearance: 'none',
          cursor: isConnecting ? 'not-allowed' : 'pointer'
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
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