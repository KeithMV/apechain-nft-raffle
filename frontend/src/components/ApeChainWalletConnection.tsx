import React, { useState, useCallback, useEffect } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain, useConnect } from 'wagmi';
import { apeChain, metaMaskConnector, walletConnectConnector } from '../config/wagmi';
import { formatAddress, clearWalletStorage, getConnectionErrorMessage, isMetaMaskAvailable, isConnectionError } from '../utils/walletUtils';
import toast from 'react-hot-toast';

export default function ApeChainWalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { connect, isPending, error } = useConnect();
  const [showWallets, setShowWallets] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasShownSuccess, setHasShownSuccess] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Skip success toast on initial page load if wallet is already connected
    if (isInitialLoad && isConnected) {
      setIsInitialLoad(false);
      setHasShownSuccess(true);
      return;
    }
    
    if (isConnected && address && !hasShownSuccess && !isPending && !isInitialLoad) {
      const timer = setTimeout(() => {
        if (isConnected && address) {
          toast.success('Wallet connected successfully!');
          setHasShownSuccess(true);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (!isConnected) {
      setHasShownSuccess(false);
      setIsInitialLoad(false);
    }
  }, [isConnected, address, hasShownSuccess, isPending, isInitialLoad]);

  const isWrongNetwork = isConnected && chainId !== apeChain.id;

  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: apeChain.id });
      toast.success('Switched to ApeChain');
    } catch (err) {
      const errorMessage = getConnectionErrorMessage(err);
      toast.error(`Network switch failed: ${errorMessage}`);
    }
  }, [switchChain]);

  const handleConnectMetaMask = useCallback(async () => {
    if (!isMetaMaskAvailable()) {
      toast.error('MetaMask not detected. Please install MetaMask.');
      return;
    }
    
    try {
      await connect({ connector: metaMaskConnector });
      setShowWallets(false);
    } catch (err: any) {
      const errorMessage = getConnectionErrorMessage(err);
      if (err?.code === 4001) {
        toast.error('Connection cancelled by user');
      } else {
        toast.error(`MetaMask connection failed: ${errorMessage}`);
      }
    }
  }, [connect]);

  const handleSoftDisconnect = useCallback(() => {
    clearWalletStorage();
    disconnect();
    toast.success('Wallet disconnected');
  }, [disconnect]);

  const handleConnectWalletConnect = useCallback(async () => {
    const maxRetries = 3;
    
    const attemptConnection = async (attempt: number): Promise<void> => {
      try {
        setIsRetrying(attempt > 1);
        await connect({ connector: walletConnectConnector });
        setShowWallets(false);
        setRetryCount(0);
        setIsRetrying(false);
      } catch (err: any) {
        const errorMessage = getConnectionErrorMessage(err);
        
        // Check if it's a network/relay error that we can retry
        const isRetryableError = errorMessage.includes('network') || 
                                errorMessage.includes('relay') || 
                                errorMessage.includes('WebSocket') ||
                                err?.code === 4001; // User rejection is not retryable
        
        if (isRetryableError && attempt < maxRetries && err?.code !== 4001) {
          setRetryCount(attempt);
          toast.loading(`Connection failed, retrying... (${attempt}/${maxRetries})`, { duration: 2000 });
          setTimeout(() => attemptConnection(attempt + 1), 2000);
        } else {
          setIsRetrying(false);
          setRetryCount(0);
          if (err?.code === 4001) {
            toast.error('Connection cancelled by user');
          } else {
            toast.error(`Connection failed: ${errorMessage}`);
          }
        }
      }
    };
    
    await attemptConnection(1);
  }, [connect]);

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
          onClick={handleSoftDisconnect}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-600/50 transition-colors min-h-[44px] whitespace-nowrap"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (showWallets) {
    return (
      <div className="relative">
        <div className="absolute top-0 right-0 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl z-50 min-w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Connect Wallet</h3>
            <button
              onClick={() => setShowWallets(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleConnectMetaMask}
              disabled={isPending}
              className="w-full flex items-center space-x-3 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">🦊</span>
              <div className="text-left flex-1">
                <div className="text-white font-medium flex items-center space-x-2">
                  <span>MetaMask</span>
                  {!isMetaMaskAvailable() && (
                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">Not Installed</span>
                  )}
                </div>
                <div className="text-slate-400 text-sm">Desktop & Mobile Browser</div>
              </div>
              {isPending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>

            <button
              onClick={handleConnectWalletConnect}
              disabled={isPending || isRetrying}
              className="w-full flex items-center space-x-3 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">📱</span>
              <div className="text-left flex-1">
                <div className="text-white font-medium flex items-center space-x-2">
                  <span>Mobile Wallets</span>
                  {isRetrying && retryCount > 0 && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                      Retry {retryCount}/3
                    </span>
                  )}
                </div>
                <div className="text-slate-400 text-sm">
                  {isRetrying ? 'Retrying connection...' : 'Trust, Rainbow, Coinbase & more'}
                </div>
              </div>
              {(isPending || isRetrying) && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-blue-300 text-sm font-medium mb-1">📱 Mobile Wallet Instructions</div>
            <div className="text-blue-200 text-xs mb-2">
              When you click "Mobile Wallets", look for these ApeChain-compatible apps:
            </div>
            <div className="text-blue-100 text-xs space-y-1">
              <div>• 🛡️ Trust Wallet</div>
              <div>• 🌈 Rainbow</div>
              <div>• 💙 Coinbase Wallet</div>
              <div>• 🦊 MetaMask Mobile</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowWallets(true)}
      disabled={isPending}
      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-xs sm:text-sm font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[44px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105 disabled:opacity-50"
    >
      <span className="flex items-center justify-center space-x-2">
        {isPending && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
      </span>
    </button>
  );
}