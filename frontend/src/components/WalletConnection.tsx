import React, { useCallback, useEffect, useState } from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react';

// Pure functions moved outside component
const formatAddress = (addr: string): string => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export function WalletConnection() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { open } = useWeb3Modal();
  const { open: modalOpen } = useWeb3ModalState();
  
  const isMobile = isMobileDevice();
  
  // Track our own connecting state that we can control
  const [isAttemptingConnection, setIsAttemptingConnection] = useState(false);
  
  // Use ONLY our controlled state for UI, ignore Wagmi's stuck isConnecting
  const isLoading = isReconnecting || isAttemptingConnection;

  // SPEED OPTIMIZED: Debug logging
  console.log('🔍 [DEBUG] WalletConnection rendered, isConnected:', isConnected);
  console.log('🔍 [DEBUG] Chain ID:', chainId);
  console.log('🔍 [DEBUG] Loading states:', { 
    wagmiIsConnecting: isConnecting, 
    isReconnecting, 
    isAttemptingConnection, 
    isLoading,
    note: 'We ignore wagmiIsConnecting to prevent stuck state'
  });
  console.log('🔍 [DEBUG] Web3Modal open function:', typeof open);
  console.log('🔍 [DEBUG] Modal state - open:', modalOpen);
  
  // FIX: Reset connecting state when modal closes without connection
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If modal was open and is now closed, and we're still not connected
    if (!modalOpen && !isConnected && isAttemptingConnection) {
      console.log('🔄 [DEBUG] Modal closed without connection - resetting state immediately');
      setIsAttemptingConnection(false);
    }
    
    // If connection succeeded, reset the attempt flag
    if (isConnected && isAttemptingConnection) {
      console.log('✅ [DEBUG] Connection successful - resetting state');
      setIsAttemptingConnection(false);
    }
    
    // Cleanup: Clear timeout if component unmounts or dependencies change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [modalOpen, isConnected, isAttemptingConnection]);
  
  // SPEED OPTIMIZED: Instant connection handler
  const handleConnect = useCallback(() => {
    // Prevent double-clicks during loading states
    if (isLoading) {
      console.log('🔄 [DEBUG] Connection in progress, ignoring click');
      return;
    }
    
    console.log('🔍 [DEBUG] Connect button clicked - starting immediate connection');
    console.log('🔍 [DEBUG] User agent:', navigator.userAgent);
    
    // Mark that we initiated a connection attempt
    setIsAttemptingConnection(true);
    
    if (typeof open === 'function') {
      try {
        // SPEED: No delays - immediate Web3Modal opening
        open();
      } catch (error) {
        console.error('🚨 [DEBUG] Web3Modal open failed:', error);
        setIsAttemptingConnection(false);
      }
    } else {
      console.error('🚨 [DEBUG] Web3Modal not initialized properly');
      setIsAttemptingConnection(false);
    }
  }, [open, isLoading]);

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
      {/* SPEED OPTIMIZED: Instant response button */}
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={`px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-base sm:text-lg font-bold transition-all duration-200 min-h-[60px] sm:min-h-[70px] whitespace-nowrap shadow-lg shadow-pink-500/30 ${
          isLoading
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:from-pink-400 hover:to-fuchsia-400 hover:shadow-pink-500/40 hover:scale-105 active:scale-95'
        }`}
        style={{ 
          // SPEED: iOS Safari optimizations - no 300ms tap delay
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitAppearance: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isAttemptingConnection ? 'Connecting...' : isReconnecting ? 'Reconnecting...' : 'Connect Wallet'}
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