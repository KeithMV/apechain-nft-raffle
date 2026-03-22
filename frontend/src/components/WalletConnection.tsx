import React, { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { config as envConfig } from '../config/environment';
import { useMobileConnectionManager, getMobileConnectionDiagnostics } from '../hooks/useMobileConnectionManager';
import toast from 'react-hot-toast';

// Pure functions moved outside component
const formatAddress = (addr: string): string => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const hasEthereumWallet = (): boolean => {
  return !!window.ethereum;
};

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { open } = useWeb3Modal();
  
  // Mobile connection management (for error monitoring only)
  const {
    isMobileDevice,
    isConnecting: mobileConnecting,
    connectionAttempts,
    hasWebSocketError,
    canRetry
  } = useMobileConnectionManager();
  
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  // Mobile connection detection and recovery
  useEffect(() => {
    const detectConnection = () => {
      if (!isConnected && window.ethereum && (window.ethereum as any).selectedAddress) {
        window.dispatchEvent(new Event('focus'));
      }
    };
    
    window.addEventListener('focus', detectConnection);
    return () => window.removeEventListener('focus', detectConnection);
  }, [isConnected]);
  
  // Show diagnostics on mobile connection issues
  useEffect(() => {
    if (isMobileDevice && (hasWebSocketError || connectionAttempts > 1)) {
      setDiagnostics(getMobileConnectionDiagnostics());
      setShowDiagnostics(true);
    }
  }, [isMobileDevice, hasWebSocketError, connectionAttempts]);

  const handleConnect = async () => {
    console.log('🔍 [DEBUG] Connect button clicked');
    console.log('🔍 [DEBUG] Environment:', envConfig.environment);
    console.log('🔍 [DEBUG] Env Chain ID:', envConfig.chainId);
    console.log('🔍 [DEBUG] Actual Chain ID (wagmi):', chainId);
    console.log('🔍 [DEBUG] User Agent:', navigator.userAgent);
    console.log('🔍 [DEBUG] Window.ethereum:', hasEthereumWallet());
    console.log('🔍 [DEBUG] Is Mobile:', isMobileDevice);
    
    try {
      // Always use Web3Modal for connection - it handles mobile properly
      console.log('🔍 [DEBUG] Opening Web3Modal...');
      await open();
      console.log('🔍 [DEBUG] Web3Modal opened successfully');
    } catch (err: any) {
      console.error('❌ [DEBUG] Failed to connect:', err);
      
      if (isMobileDevice) {
        if (err.message?.includes('WebSocket')) {
          toast.error('Network connection issue. Please check your internet and try again.');
        } else if (err.message?.includes('User rejected')) {
          toast.error('Connection cancelled.');
        } else {
          toast.error('Connection failed. Please try refreshing the page.');
        }
      }
    }
  };

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
      {/* Mobile diagnostics panel */}
      {showDiagnostics && isMobileDevice && diagnostics && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 text-xs text-yellow-200">
          <div className="font-semibold mb-2">📱 Mobile Connection Info:</div>
          <div>Device: {diagnostics.isIOS ? 'iOS' : diagnostics.isAndroid ? 'Android' : 'Unknown'}</div>
          <div>Network: {diagnostics.onLine ? 'Online' : 'Offline'} ({diagnostics.connectionType})</div>
          <div>Attempts: {connectionAttempts}/3</div>
          {hasWebSocketError && <div className="text-red-300">⚠️ WebSocket connection issues detected</div>}
          <button 
            onClick={() => setShowDiagnostics(false)}
            className="mt-2 text-yellow-400 hover:text-yellow-300 underline"
          >
            Hide
          </button>
        </div>
      )}
      
      <button
        onClick={handleConnect}
        disabled={false}
        aria-label="Connect wallet"
        className={`relative px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-base sm:text-lg font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[60px] sm:min-h-[70px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105 active:scale-95 active:shadow-inner overflow-hidden group`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500"></div>
        <span className="relative flex items-center justify-center space-x-2">
          <span>Connect Wallet</span>
        </span>
      </button>
      
      {/* Mobile retry button */}
      {isMobileDevice && hasWebSocketError && canRetry && (
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-yellow-600/20 border border-yellow-500/30 text-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-600/30 transition-colors"
        >
          🔄 Retry Connection ({3 - connectionAttempts} attempts left)
        </button>
      )}
      
      {/* Mobile help text */}
      {isMobileDevice && connectionAttempts > 0 && (
        <div className="text-xs text-slate-400 text-center">
          Having trouble? Try refreshing the page or switching to a different network.
        </div>
      )}
    </div>
  );
}