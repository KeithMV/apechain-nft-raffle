import React, { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { metaMask, injected, walletConnect } from 'wagmi/connectors';

interface CustomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomWalletModal: React.FC<CustomWalletModalProps> = ({ isOpen, onClose }) => {
  const { connect, connectors, isPending } = useConnect();
  const { isConnected } = useAccount();
  const [isVisible, setIsVisible] = useState(false);

  // Close modal when connected
  useEffect(() => {
    if (isConnected) {
      onClose();
    }
  }, [isConnected, onClose]);

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const wallets = [
    {
      id: 'metaMask',
      name: 'MetaMask',
      icon: '🦊',
      connector: metaMask(),
      description: 'Connect using browser wallet'
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      icon: '🌈',
      connector: injected({ target: 'rainbow' }),
      description: 'Connect using Rainbow wallet'
    },
    {
      id: 'trustWallet',
      name: 'Trust Wallet',
      icon: '🛡️',
      connector: injected({ target: 'trust' }),
      description: 'Connect using Trust Wallet'
    }
  ];

  const handleConnect = (connector: any) => {
    connect({ connector });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center transition-all duration-300 ${
        isOpen ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`w-full max-w-md mx-4 mb-4 sm:mb-0 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl transform transition-all duration-300 ${
          isOpen 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-full sm:translate-y-0 opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Wallet Options */}
        <div className="p-6 space-y-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnect(wallet.connector)}
              disabled={isPending}
              className="w-full flex items-center space-x-4 p-4 rounded-xl border border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="text-2xl">{wallet.icon}</div>
              <div className="flex-1 text-left">
                <div className="text-white font-medium group-hover:text-blue-400 transition-colors">
                  {wallet.name}
                </div>
                <div className="text-gray-400 text-sm">
                  {wallet.description}
                </div>
              </div>
              <div className="text-gray-400 group-hover:text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            By connecting a wallet, you agree to ApeChain Raffles Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomWalletModal;