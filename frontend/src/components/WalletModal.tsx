import React from 'react';
import { useConnect } from 'wagmi';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const wallets = [
  {
    id: 'metaMask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Most popular wallet',
  },
  {
    id: 'walletConnect',
    name: 'Trust Wallet',
    icon: '🛡️',
    description: 'Mobile-first wallet',
  },
  {
    id: 'rainbow',
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'User-friendly wallet',
  },
];

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connectors, connect, isPending } = useConnect();

  if (!isOpen) return null;

  const handleWalletConnect = async (walletId: string) => {
    let connector;
    
    if (walletId === 'metaMask') {
      connector = connectors.find(c => c.id === 'metaMask' || c.name.toLowerCase().includes('metamask'));
    } else if (walletId === 'walletConnect') {
      connector = connectors.find(c => c.id === 'walletConnect' || c.name.toLowerCase().includes('walletconnect'));
    } else if (walletId === 'rainbow') {
      connector = connectors.find(c => c.id === 'coinbaseWalletSDK' || c.name.toLowerCase().includes('coinbase'));
    }
    
    if (connector) {
      try {
        await connect({ connector });
        // Only close modal after successful connection
        onClose();
      } catch (error) {
        console.error('Connection failed:', error);
        // Keep modal open on error so user can try again
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 mx-4 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Wallet Cards */}
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletConnect(wallet.id)}
              disabled={isPending}
              className="w-full flex items-center space-x-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 hover:border-slate-600/50 transition-all duration-200 disabled:opacity-50 group active:scale-95"
            >
              <div className="text-3xl">{wallet.icon}</div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-white group-hover:text-pink-300 transition-colors">
                  {wallet.name}
                </div>
                <div className="text-sm text-slate-400">
                  {wallet.description}
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-pink-300 transition-colors">
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-pink-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            By connecting, you agree to ApeChain's terms
          </p>
        </div>
      </div>
    </div>
  );
}