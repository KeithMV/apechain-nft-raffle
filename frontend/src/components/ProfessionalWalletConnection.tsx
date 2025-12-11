import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useDisconnect, useAccount } from 'wagmi';
import { useMetaMaskSession } from '../hooks/useMetaMaskSession';
import { ConnectionState } from '../services/walletConnectionService';
import { WalletErrorBoundary } from './WalletErrorBoundary';
import { formatAddress, clearWalletStorage, getConnectionErrorMessage } from '../utils/walletUtils';
import { SecurityUtils } from '../utils/security';
import toast from 'react-hot-toast';

function WalletConnectionContent() {
  const {
    connectionState,
    connectionError,
    connect,
    switchNetwork,
    isWrongNetwork
  } = useWalletConnection();
  
  const { disconnect, isPending: isDisconnectPending } = useDisconnect();
  const { address, isConnected } = useAccount();
  
  const [hasShownSuccess, setHasShownSuccess] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep MetaMask session active
  useMetaMaskSession();

  // Show success toast only when connection is stable
  useEffect(() => {
    if (isInitialLoad && connectionState === ConnectionState.CONNECTED) {
      setIsInitialLoad(false);
      setHasShownSuccess(true);
      return;
    }
    
    if (connectionState === ConnectionState.CONNECTED && address && !hasShownSuccess && !isInitialLoad) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      
      successTimeoutRef.current = setTimeout(() => {
        if (connectionState === ConnectionState.CONNECTED && address) {
          toast.success('Wallet connected successfully!');
          setHasShownSuccess(true);
        }
      }, 500);
    } else if (connectionState !== ConnectionState.CONNECTED) {
      setHasShownSuccess(false);
      setIsInitialLoad(false);
    }
    
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, [connectionState, address, hasShownSuccess, isInitialLoad]);

  const handleConnect = useCallback(async () => {
    if (connectionState === ConnectionState.CONNECTING) return;
    
    // Rate limiting for connection attempts
    if (!SecurityUtils.checkRateLimit('wallet_connect', 5, 60000)) {
      toast.error('Too many connection attempts. Please wait.');
      return;
    }
    
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    try {
      await connect();
    } catch (error: any) {
      const errorMessage = getConnectionErrorMessage(error);
      toast.error(errorMessage);
    }
  }, [connect, connectionState]);

  const handleDisconnect = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Disconnect clicked:', { isDisconnectPending, isConnected });
    
    if (isDisconnectPending) {
      console.log('Already disconnecting, ignoring click');
      return;
    }
    
    console.log('Calling disconnect()');
    disconnect();
    clearWalletStorage();
    toast.success('Wallet disconnected');
  }, [disconnect, isDisconnectPending, isConnected]);

  const handleNetworkSwitch = useCallback(async () => {
    try {
      await switchNetwork();
      toast.success('Switched to ApeChain');
    } catch (error: any) {
      toast.error('Failed to switch network: ' + getConnectionErrorMessage(error));
    }
  }, [switchNetwork]);

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

  const getButtonClassName = () => {
    const baseClasses = 'px-3 sm:px-4 py-2 border text-white rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 min-h-[44px] whitespace-nowrap shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 active:scale-95 touch-manipulation';
    
    if (connectionState === ConnectionState.ERROR) {
      return `${baseClasses} bg-gradient-to-r from-orange-500 to-red-500 border-orange-400 shadow-orange-500/30 hover:shadow-orange-500/40`;
    }
    
    return `${baseClasses} bg-gradient-to-r from-pink-500 to-fuchsia-500 border-pink-400 shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105`;
  };

  if (isConnected) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        {isWrongNetwork && (
          <button
            onClick={handleNetworkSwitch}
            className="px-3 py-2 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500/30 transition-colors min-h-[44px] whitespace-nowrap"
          >
            Switch to ApeChain
          </button>
        )}
        
        <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 sm:px-3 py-2 min-h-[44px]">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0"></div>
          <span className="text-slate-300 text-xs sm:text-sm font-mono wallet-text">
            {address && SecurityUtils.validateAddress(address) ? formatAddress(address) : 'Invalid Address'}
          </span>
        </div>
        
        <button
          onClick={handleDisconnect}
          disabled={isDisconnectPending}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-600/50 transition-colors min-h-[44px] whitespace-nowrap disabled:opacity-50"
        >
          {isDisconnectPending ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      <button
        onClick={handleConnect}
        disabled={connectionState === ConnectionState.CONNECTING}
        className={getButtonClassName()}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="flex items-center justify-center space-x-2">
          {connectionState === ConnectionState.CONNECTING && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          <span>{getButtonText()}</span>
        </span>
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