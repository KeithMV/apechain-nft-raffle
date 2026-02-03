import React, { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { apeChain } from '../config/wagmi';
import { MobileWalletConnect } from './MobileWalletConnect';
import { config as envConfig } from '../config/environment';

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);

  const isWrongNetwork = isConnected && chainId !== apeChain.id;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const hasWallet = !!window.ethereum;

  // Mobile connection detection
  useEffect(() => {
    const detectConnection = () => {
      if (!isConnected && window.ethereum?.selectedAddress) {
        window.dispatchEvent(new Event('focus'));
      }
    };
    
    window.addEventListener('focus', detectConnection);
    return () => window.removeEventListener('focus', detectConnection);
  }, [isConnected]);

  const handleConnect = async () => {
    console.log('🔍 [DESKTOP DEBUG] Connect button clicked');
    console.log('🔍 [DESKTOP DEBUG] Environment:', envConfig.environment);
    console.log('🔍 [DESKTOP DEBUG] Chain ID:', envConfig.chainId);
    console.log('🔍 [DESKTOP DEBUG] User Agent:', navigator.userAgent);
    console.log('🔍 [DESKTOP DEBUG] Window.ethereum:', !!window.ethereum);
    
    try {
      console.log('🔍 [DESKTOP DEBUG] Opening Web3Modal...');
      await open();
      console.log('🔍 [DESKTOP DEBUG] Web3Modal opened successfully');
    } catch (err) {
      console.error('🔍 [DESKTOP DEBUG] Failed to connect:', err);
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
          onClick={() => {
            console.log('🔍 [MOBILE DEBUG] Disconnect button clicked');
            disconnect();
          }}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-600/50 active:bg-slate-600/70 transition-colors min-h-[44px] whitespace-nowrap touch-manipulation"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleConnect}
        className="relative px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-xs sm:text-sm font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[44px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105 active:scale-95 active:shadow-inner overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500"></div>
        <span className="relative">
          Connect Wallet
        </span>
      </button>
      <div className="text-xs text-slate-400 text-center">
        Mobile: {isMobile ? 'YES' : 'NO'} | Wallet: {hasWallet ? 'YES' : 'NO'}
      </div>
    </div>
  );
}