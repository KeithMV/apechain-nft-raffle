import React, { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { config as envConfig } from '../config/environment';
import { toastManager } from '../utils/toastManager';

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

// Mobile diagnostics helper
const getMobileConnectionDiagnostics = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  return {
    userAgent,
    isIOS,
    isAndroid,
    isMobile: isIOS || isAndroid,
    hasEthereum: typeof window !== 'undefined' && !!window.ethereum,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    onLine: navigator.onLine,
  };
};

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { open } = useWeb3Modal();
  
  // Simplified mobile connection state
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [hasWebSocketError, setHasWebSocketError] = useState(false);
  
  const isMobile = isMobileDevice();

  // CRITICAL DEBUG: Log component render
  console.log('🔍 [DEBUG] WalletConnection component rendered, isConnected:', isConnected);
  console.log('🔍 [DEBUG] Web3Modal open function available:', typeof open, !!open);

  // Mobile WebSocket error monitoring
  useEffect(() => {
    if (!isMobile) return;
    
    const handleWebSocketError = (event: any) => {
      console.warn('🔌 [MOBILE] WebSocket error detected:', event);
      setHasWebSocketError(true);
      
      if (isConnected) {
        setTimeout(() => {
          disconnect();
          setTimeout(() => {
            toastManager.wallet.connectionLost();
          }, 2000);
        }, 1000);
      }
    };
    
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('WebSocket') || message.includes('relay.walletconnect.org')) {
        handleWebSocketError({ message });
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, [isConnected, isMobile, disconnect]);
  
  // Show diagnostics on mobile connection issues
  useEffect(() => {
    if (isMobile && hasWebSocketError) {
      setDiagnostics(getMobileConnectionDiagnostics());
      setShowDiagnostics(true);
    }
  }, [isMobile, hasWebSocketError]);

  const handleConnect = async () => {
    console.log('🔍 [DEBUG] Connect button clicked - ENTRY POINT');
    console.log('🔍 [DEBUG] Environment:', envConfig.environment);
    console.log('🔍 [DEBUG] Env Chain ID:', envConfig.chainId);
    console.log('🔍 [DEBUG] Actual Chain ID (wagmi):', chainId);
    console.log('🔍 [DEBUG] User Agent:', navigator.userAgent);
    console.log('🔍 [DEBUG] Window.ethereum:', hasEthereumWallet());
    console.log('🔍 [DEBUG] Is Mobile:', isMobile);
    console.log('🔍 [DEBUG] Web3Modal open function:', typeof open, open);
    
    if (!open) {
      console.error('❌ [CRITICAL] Web3Modal open function is undefined - Web3Modal not initialized!');
      return;
    }
    
    try {
      // Always use Web3Modal for connection - it handles mobile properly
      console.log('🔍 [DEBUG] Opening Web3Modal...');
      await open();
      console.log('🔍 [DEBUG] Web3Modal opened successfully');
    } catch (err: any) {
      console.error('❌ [DEBUG] Failed to connect:', err);
      
      if (isMobile) {
        if (err.message?.includes('WebSocket')) {
          toastManager.wallet.networkIssue();
        } else if (err.message?.includes('User rejected')) {
          toastManager.wallet.connectionCancelled();
        } else {
          toastManager.wallet.connectionFailed();
        }
      }
    }
  };

  // Debug: Add click event listener to verify button is clickable
  useEffect(() => {
    console.log('🔍 [DEBUG] DOM listener effect running...');
    
    // Try multiple selectors
    const selectors = [
      '[aria-label="Connect wallet"]',
      'button:contains("Connect Wallet")',
      'button[aria-label="Connect wallet"]',
      '.connect-wallet-button'
    ];
    
    let button: Element | null = null;
    for (const selector of selectors) {
      button = document.querySelector(selector);
      console.log(`🔍 [DEBUG] Selector "${selector}" found:`, !!button);
      if (button) break;
    }
    
    // Also try finding by text content
    const allButtons = document.querySelectorAll('button');
    console.log('🔍 [DEBUG] Total buttons found:', allButtons.length);
    
    allButtons.forEach((btn, index) => {
      console.log(`🔍 [DEBUG] Button ${index}:`, btn.textContent?.trim(), btn.getAttribute('aria-label'));
      if (btn.textContent?.includes('Connect Wallet')) {
        button = btn;
        console.log('🔍 [DEBUG] Found button by text content!');
      }
    });
    
    if (button) {
      console.log('🔍 [DEBUG] Attaching DOM click listener to button');
      const clickHandler = (e: Event) => {
        console.log('🔍 [DEBUG] Button click detected via DOM listener', e);
        console.log('🔍 [DEBUG] Event target:', e.target);
        console.log('🔍 [DEBUG] Event type:', e.type);
      };
      
      // Add multiple event types for mobile compatibility
      button.addEventListener('click', clickHandler);
      button.addEventListener('touchstart', clickHandler);
      button.addEventListener('touchend', clickHandler);
      
      return () => {
        button?.removeEventListener('click', clickHandler);
        button?.removeEventListener('touchstart', clickHandler);
        button?.removeEventListener('touchend', clickHandler);
      };
    } else {
      console.error('❌ [DEBUG] No connect button found in DOM!');
    }
  }, [isConnected]); // Re-run when connection state changes

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
      {showDiagnostics && isMobile && diagnostics && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 text-xs text-yellow-200">
          <div className="font-semibold mb-2">📱 Mobile Connection Info:</div>
          <div>Device: {diagnostics.isIOS ? 'iOS' : diagnostics.isAndroid ? 'Android' : 'Unknown'}</div>
          <div>Network: {diagnostics.onLine ? 'Online' : 'Offline'} ({diagnostics.connectionType})</div>
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
        onTouchStart={() => console.log('🔍 [DEBUG] Touch start detected')}
        onTouchEnd={() => console.log('🔍 [DEBUG] Touch end detected')}
        onMouseDown={() => console.log('🔍 [DEBUG] Mouse down detected')}
        onMouseUp={() => console.log('🔍 [DEBUG] Mouse up detected')}
        disabled={false}
        aria-label="Connect wallet"
        className="connect-wallet-button px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-base sm:text-lg font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[60px] sm:min-h-[70px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105 active:scale-95"
        style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
      >
        Connect Wallet
      </button>
      
      {/* Mobile retry button */}
      {isMobile && hasWebSocketError && (
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-yellow-600/20 border border-yellow-500/30 text-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-600/30 transition-colors"
        >
          🔄 Retry Connection
        </button>
      )}
      
      {/* Mobile help text */}
      {isMobile && hasWebSocketError && (
        <div className="text-xs text-slate-400 text-center">
          Having trouble? Try refreshing the page or switching to a different network.
        </div>
      )}
    </div>
  );
}