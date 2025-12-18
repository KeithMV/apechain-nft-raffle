import React, { useState } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';

interface WalletOption {
  name: string;
  connector: any;
  icon: string;
  available: boolean;
  description: string;
}

export function DesktopWalletSelector() {
  const { connectWith, availableConnectors, isConnecting } = useWalletConnection();
  const [showOptions, setShowOptions] = useState(false);

  const walletOptions: WalletOption[] = [
    {
      name: 'MetaMask',
      connector: availableConnectors.metaMaskConnector,
      icon: '🦊',
      available: !!(window as any).ethereum?.isMetaMask,
      description: 'Browser extension'
    },
    {
      name: 'Coinbase Wallet',
      connector: availableConnectors.coinbaseConnector,
      icon: '🔵',
      available: !!(window as any).ethereum?.isCoinbaseWallet,
      description: 'Browser extension'
    },
    {
      name: 'Other Wallet',
      connector: availableConnectors.injectedConnector,
      icon: '💼',
      available: !!(window as any).ethereum && !(window as any).ethereum?.isMetaMask && !(window as any).ethereum?.isCoinbaseWallet,
      description: 'Brave, Opera, etc.'
    },
    {
      name: 'Mobile Wallets',
      connector: null, // WalletConnect disabled
      icon: '📱',
      available: true,
      description: 'QR code connection'
    }
  ];

  const handleWalletSelect = async (option: WalletOption) => {
    setShowOptions(false);
    await connectWith(option.connector);
  };

  if (!showOptions) {
    return (
      <button
        onClick={() => setShowOptions(true)}
        disabled={isConnecting}
        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-lg font-bold hover:scale-105 transition-all"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-50 min-w-[280px]">
        <div className="text-sm font-medium text-slate-300 mb-3">Choose Wallet:</div>
        
        {walletOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleWalletSelect(option)}
            disabled={!option.available || isConnecting}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg mb-2 transition-colors ${
              option.available 
                ? 'hover:bg-slate-700 text-slate-200' 
                : 'text-slate-500 cursor-not-allowed'
            }`}
          >
            <span className="text-xl">{option.icon}</span>
            <div className="flex-1 text-left">
              <div className="font-medium">{option.name}</div>
              <div className="text-xs text-slate-400">{option.description}</div>
            </div>
            {!option.available && (
              <span className="text-xs text-red-400">Not detected</span>
            )}
          </button>
        ))}
        
        <button
          onClick={() => setShowOptions(false)}
          className="w-full px-3 py-1 text-slate-400 text-xs mt-2 hover:text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}