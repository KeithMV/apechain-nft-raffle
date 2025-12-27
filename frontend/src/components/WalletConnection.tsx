import React, { useEffect } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { apeChain } from '../config/wagmi';

export function WalletConnection() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();

  const isWrongNetwork = isConnected && chainId !== apeChain.id;

  // Ultra-aggressive connection optimization
  useEffect(() => {
    if (isConnecting || isReconnecting) {
      // Immediate burst of checks
      const immediateCheck = () => {
        if (window.ethereum?.selectedAddress) {
          window.dispatchEvent(new Event('focus'));
          window.dispatchEvent(new Event('ethereum#accountsChanged'));
          // Force wagmi to check immediately
          if (window.ethereum.emit) {
            window.ethereum.emit('accountsChanged', [window.ethereum.selectedAddress]);
          }
        }
      };
      
      // Rapid-fire checks: 0ms, 50ms, 100ms, 200ms, 400ms
      immediateCheck();
      const intervals = [0, 50, 100, 200, 400].map(delay => 
        setTimeout(immediateCheck, delay)
      );
      
      return () => intervals.forEach(clearTimeout);
    }
  }, [isConnecting, isReconnecting]);

  // Preemptive connection detection
  useEffect(() => {
    const detectConnection = () => {
      if (!isConnected && window.ethereum?.selectedAddress && !isConnecting) {
        window.dispatchEvent(new Event('focus'));
      }
    };
    
    window.addEventListener('focus', detectConnection);
    window.addEventListener('ethereum#accountsChanged', detectConnection);
    
    return () => {
      window.removeEventListener('focus', detectConnection);
      window.removeEventListener('ethereum#accountsChanged', detectConnection);
    };
  }, [isConnected, isConnecting]);

  const handleConnect = async () => {
    console.log('Opening Web3Modal...');
    
    // Try direct MetaMask connection with aggressive optimization
    if (window.ethereum && !isConnecting) {
      try {
        // Pre-warm the connection - check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          // Already connected, force immediate recognition
          window.dispatchEvent(new Event('ethereum#accountsChanged'));
          window.dispatchEvent(new Event('focus'));
          return;
        }
        
        // Request new connection
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Aggressive immediate recognition burst
        setTimeout(() => window.dispatchEvent(new Event('ethereum#accountsChanged')), 0);
        setTimeout(() => window.dispatchEvent(new Event('focus')), 50);
        setTimeout(() => window.dispatchEvent(new Event('ethereum#accountsChanged')), 100);
        
        return;
      } catch (err) {
        console.log('Direct connection failed, opening modal:', err);
      }
    }
    
    // Fallback to Web3Modal with minimal delay
    const openModal = () => {
      requestAnimationFrame(() => open());
    };
    
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      setTimeout(openModal, 25); // Reduced from 50ms
    } else {
      openModal();
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: apeChain.id });
    } catch (err) {
      console.error('Network switch failed:', err);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnecting || isReconnecting) {
    return (
      <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 min-h-[44px]">
        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
        <span className="text-slate-300 text-xs sm:text-sm font-mono">
          {isReconnecting ? 'Reconnecting...' : 'Connecting...'}
        </span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        {isWrongNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className="px-3 py-2 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500/30 transition-colors min-h-[44px] whitespace-nowrap"
          >
            Switch to ApeChain
          </button>
        )}
        
        <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 sm:px-3 py-2 min-h-[44px]">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0"></div>
          <span className="text-slate-300 text-xs sm:text-sm font-mono wallet-text">
            {address ? formatAddress(address) : ''}
          </span>
        </div>
        
        <button
          onClick={() => disconnect()}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-600/50 transition-colors min-h-[44px] whitespace-nowrap"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-xs sm:text-sm font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[44px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105"
    >
      Connect Wallet
    </button>
  );
}