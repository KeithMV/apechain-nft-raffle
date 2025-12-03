import React from 'react';
import { useConnect } from 'wagmi';
import { metaMaskConnector, walletConnectConnector } from '../config/wagmi';

interface CustomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APECHAIN_WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Desktop & Mobile Browser',
    icon: '🦊',
    connector: metaMaskConnector,
    recommended: true
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    description: 'Mobile App',
    icon: '🛡️',
    connector: walletConnectConnector,
    recommended: true
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Mobile App',
    icon: '🌈',
    connector: walletConnectConnector,
    recommended: true
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Mobile App',
    icon: '💙',
    connector: walletConnectConnector,
    recommended: true
  }
];

export default function CustomWalletModal({ isOpen, onClose }: CustomWalletModalProps) {
  const { connect, isPending } = useConnect();

  const handleConnect = async (wallet: typeof APECHAIN_WALLETS[0]) => {
    try {
      await connect({ connector: wallet.connector });
      onClose();
    } catch (err) {
      console.error(`${wallet.name} connection failed:`, err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {APECHAIN_WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnect(wallet)}
              disabled={isPending}
              className="w-full flex items-center space-x-4 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-colors disabled:opacity-50 group"
            >
              <span className="text-3xl">{wallet.icon}</span>
              <div className="text-left flex-1">
                <div className="text-white font-semibold flex items-center">
                  {wallet.name}
                  {wallet.recommended && (
                    <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full">
                      ✓ Recommended
                    </span>
                  )}
                </div>
                <div className="text-slate-400 text-sm">{wallet.description}</div>
              </div>
              <div className="text-slate-500 group-hover:text-slate-300">
                →
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <div className="text-emerald-300 text-sm font-semibold mb-1">
            ✅ ApeChain Compatible
          </div>
          <div className="text-emerald-200 text-xs">
            These wallets have been tested and verified to work with ApeChain. 
            Other wallets may not support custom networks.
          </div>
        </div>
      </div>
    </div>
  );
}