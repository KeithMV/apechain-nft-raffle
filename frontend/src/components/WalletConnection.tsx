import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';

const APECHAIN_ID = 33139;

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showMobileOptions, setShowMobileOptions] = useState(false);

  const isWrongNetwork = isConnected && chainId !== APECHAIN_ID;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleConnect = async () => {
    if (isMobile) {
      setShowMobileOptions(true);
      return;
    }

    // Desktop: Try MetaMask first, then Coinbase, then injected
    const metaMask = connectors.find(c => c.name === 'MetaMask');
    const coinbase = connectors.find(c => c.name === 'Coinbase Wallet');
    const injected = connectors.find(c => c.name === 'Injected');

    try {
      if (metaMask && window.ethereum?.isMetaMask) {
        await connect({ connector: metaMask });
      } else if (coinbase && window.ethereum?.isCoinbaseWallet) {
        await connect({ connector: coinbase });
      } else if (injected && window.ethereum) {
        await connect({ connector: injected });
      } else {
        // No desktop wallet found, show mobile options
        setShowMobileOptions(true);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleMobileWallet = async (walletName: string) => {
    const walletConnect = connectors.find(c => c.name === 'WalletConnect');
    if (walletConnect) {
      try {
        // Start WalletConnect connection to get URI
        const connectPromise = connect({ connector: walletConnect });
        
        // Get WalletConnect URI for deep linking
        const wcUri = await new Promise<string>((resolve) => {
          const checkUri = () => {
            const uri = (walletConnect as any).uri;
            if (uri) {
              resolve(uri);
            } else {
              setTimeout(checkUri, 100);
            }
          };
          checkUri();
        });
        
        // Direct deep links to wallet apps
        const walletLinks: Record<string, string> = {
          'Trust Wallet': `trust://wc?uri=${encodeURIComponent(wcUri)}`,
          'Rainbow': `rainbow://wc?uri=${encodeURIComponent(wcUri)}`,
          'Coinbase Wallet': `cbwallet://wc?uri=${encodeURIComponent(wcUri)}`,
          'MetaMask': `metamask://wc?uri=${encodeURIComponent(wcUri)}`
        };
        
        // Redirect to wallet app
        const deepLink = walletLinks[walletName];
        if (deepLink) {
          window.location.href = deepLink;
        }
        
        setShowMobileOptions(false);
        await connectPromise;
      } catch (error) {
        console.error('Mobile wallet connection failed:', error);
      }
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: APECHAIN_ID });
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        {isWrongNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className="px-3 py-2 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            Switch to ApeChain
          </button>
        )}
        
        <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-slate-300 text-sm font-mono">
            {formatAddress(address!)}
          </span>
        </div>
        
        <button
          onClick={() => disconnect()}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600/50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (showMobileOptions) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl z-50 min-w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Choose Wallet</h3>
            <button
              onClick={() => setShowMobileOptions(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => handleMobileWallet('Trust Wallet')}
              disabled={isPending}
              className="w-full flex items-center space-x-3 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">🛡️</span>
              <div className="text-left">
                <div className="text-white font-medium">Trust Wallet</div>
                <div className="text-slate-400 text-sm">Mobile App</div>
              </div>
            </button>

            <button
              onClick={() => handleMobileWallet('Rainbow')}
              disabled={isPending}
              className="w-full flex items-center space-x-3 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">🌈</span>
              <div className="text-left">
                <div className="text-white font-medium">Rainbow</div>
                <div className="text-slate-400 text-sm">Mobile App</div>
              </div>
            </button>

            <button
              onClick={() => handleMobileWallet('Coinbase Wallet')}
              disabled={isPending}
              className="w-full flex items-center space-x-3 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">💙</span>
              <div className="text-left">
                <div className="text-white font-medium">Coinbase Wallet</div>
                <div className="text-slate-400 text-sm">Mobile App</div>
              </div>
            </button>

            <button
              onClick={() => handleMobileWallet('MetaMask')}
              disabled={isPending}
              className="w-full flex items-center space-x-3 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">🦊</span>
              <div className="text-left">
                <div className="text-white font-medium">MetaMask</div>
                <div className="text-slate-400 text-sm">Mobile App</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isPending}
      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-lg font-bold hover:scale-105 transition-all disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}