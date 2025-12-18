import React, { useState } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { isMobileDevice, getMobileWalletDeepLink } from '../utils/walletUtils';
import toast from 'react-hot-toast';

interface MobileWalletOption {
  name: string;
  icon: string;
  connector: any;
  deepLink?: string;
}

export default function MobileWalletSelector() {
  const { connectWith, availableConnectors, isConnecting } = useWalletConnection();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  if (!isMobileDevice()) return null;

  const mobileWallets: MobileWalletOption[] = [
    {
      name: 'MetaMask',
      icon: '🦊',
      connector: availableConnectors.metaMaskConnector,
      deepLink: getMobileWalletDeepLink('metamask')
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      connector: availableConnectors.walletConnectConnector
    }
  ];

  const handleWalletSelect = async (wallet: MobileWalletOption) => {
    setSelectedWallet(wallet.name);
    
    try {
      // For mobile wallets, try deep link first if available
      if (wallet.deepLink && wallet.name !== 'WalletConnect') {
        // Check if wallet app is installed by trying to open it
        const startTime = Date.now();
        window.location.href = wallet.deepLink;
        
        // If user returns quickly, wallet probably isn't installed
        setTimeout(() => {
          if (Date.now() - startTime < 2000) {
            toast.error(`${wallet.name} app not found. Install it or use WalletConnect.`);
            setSelectedWallet(null);
          }
        }, 1500);
        
        return;
      }
      
      // Fallback to connector
      await connectWith(wallet.connector);
      toast.success(`Connected with ${wallet.name}!`);
    } catch (error) {
      toast.error(`Failed to connect with ${wallet.name}`);
      setSelectedWallet(null);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
      <h3 className="text-white font-semibold mb-3 text-sm">Choose Mobile Wallet</h3>
      <div className="grid grid-cols-2 gap-2">
        {mobileWallets.map((wallet) => (
          <button
            key={wallet.name}
            onClick={() => handleWalletSelect(wallet)}
            disabled={isConnecting || selectedWallet === wallet.name}
            className="flex flex-col items-center p-3 bg-slate-700/30 hover:bg-slate-600/40 border border-slate-600/50 hover:border-slate-500/70 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <span className="text-2xl mb-1">{wallet.icon}</span>
            <span className="text-xs text-slate-300 text-center font-medium">
              {selectedWallet === wallet.name ? 'Opening...' : wallet.name}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3 text-center">
        Tap a wallet to connect. Install the app first if needed.
      </p>
    </div>
  );
}