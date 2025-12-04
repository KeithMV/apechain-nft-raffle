import React from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useMetaMaskSession } from '../hooks/useMetaMaskSession';
import { ConnectionState } from '../services/walletConnectionService';
import { WalletErrorBoundary } from './WalletErrorBoundary';

function WalletConnectionContent() {
  const {
    address,
    connectionState,
    connectionError,
    connect,
    disconnect,
    switchNetwork,
    isWrongNetwork
  } = useWalletConnection();
  
  // Keep MetaMask session active
  useMetaMaskSession();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getButtonText = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTING:
        return 'Connecting...';
      case ConnectionState.ERROR:
        return 'Retry Connection';
      default:
        return 'Connect Wallet';
    }
  };

  if (connectionState === ConnectionState.CONNECTED) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        {isWrongNetwork && (
          <button
            onClick={switchNetwork}
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
          onClick={disconnect}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-600/50 transition-colors min-h-[44px] whitespace-nowrap"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      <button
        onClick={connect}
        disabled={connectionState === ConnectionState.CONNECTING}
        className={`px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-xs sm:text-sm font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[44px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105 disabled:opacity-50 active:scale-95 touch-manipulation ${
          connectionState === ConnectionState.ERROR ? 'from-red-500 to-red-600 border-red-400' : ''
        }`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {getButtonText()}
      </button>
      
      {connectionError && (
        <div className="text-xs text-red-400 max-w-[200px] text-right">
          {connectionError.userMessage}
        </div>
      )}
    </div>
  );
}

export default function ProfessionalWalletConnection() {
  return (
    <WalletErrorBoundary>
      <WalletConnectionContent />
    </WalletErrorBoundary>
  );
}