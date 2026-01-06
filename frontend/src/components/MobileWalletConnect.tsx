import React from 'react';

export const MobileWalletConnect: React.FC = () => {
  const handleMetaMaskInstall = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  const handleTrustWalletInstall = () => {
    window.open('https://trustwallet.com/download', '_blank');
  };

  const handleWalletConnect = () => {
    // Try WalletConnect QR code
    window.open('https://walletconnect.com/', '_blank');
  };

  return (
    <div className="flex flex-col space-y-3 p-4 bg-slate-800/50 rounded-xl border border-slate-600/50">
      <h3 className="text-lg font-semibold text-white text-center">Connect Mobile Wallet</h3>
      
      <button
        onClick={handleMetaMaskInstall}
        className="flex items-center justify-center space-x-3 px-4 py-3 bg-orange-500/20 border border-orange-400/50 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors"
      >
        <span className="text-2xl">🦊</span>
        <span className="font-medium">Install MetaMask</span>
      </button>

      <button
        onClick={handleTrustWalletInstall}
        className="flex items-center justify-center space-x-3 px-4 py-3 bg-blue-500/20 border border-blue-400/50 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
      >
        <span className="text-2xl">🛡️</span>
        <span className="font-medium">Install Trust Wallet</span>
      </button>

      <button
        onClick={handleWalletConnect}
        className="flex items-center justify-center space-x-3 px-4 py-3 bg-purple-500/20 border border-purple-400/50 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
      >
        <span className="text-2xl">🔗</span>
        <span className="font-medium">WalletConnect</span>
      </button>

      <div className="text-xs text-slate-400 text-center mt-2">
        Install a wallet app, then return to this page
      </div>
    </div>
  );
};