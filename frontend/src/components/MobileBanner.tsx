/**
 * Mobile wallet guidance banner for Safari users
 */
import React, { useState, useEffect } from 'react';

export default function MobileBanner() {
  // const [isMobile, setIsMobile] = useState(false);
  // const [hasEthereum, setHasEthereum] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Detect mobile Safari
    const isMobileSafari = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroidMobile = /Android/i.test(navigator.userAgent);
    const isMobileDevice = isMobileSafari || isAndroidMobile || window.innerWidth <= 768;
    
    // Check if Ethereum provider is available
    const hasProvider = typeof window !== 'undefined' && !!window.ethereum;
    
    // setIsMobile(isMobileDevice);
    // setHasEthereum(hasProvider);
    
    // Show banner if mobile without Ethereum provider
    setShowBanner(isMobileDevice && !hasProvider);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 border border-blue-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-xl blur-sm animate-pulse"></div>
      
      <div className="relative flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <span className="text-blue-400 text-lg">📱</span>
          </div>
        </div>
        
        <div className="flex-1">
          <h4 className="text-blue-200 font-semibold text-sm mb-2">
            Mobile Wallet Setup Required
          </h4>
          <p className="text-blue-300/80 text-xs mb-3 leading-relaxed">
            To create raffles on mobile, you'll need a Web3 wallet. Choose one of these options:
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-blue-400">•</span>
              <span className="text-blue-200">Install MetaMask Mobile app and open this site in the app browser</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-blue-400">•</span>
              <span className="text-blue-200">Use WalletConnect to connect your existing wallet</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-blue-400">•</span>
              <span className="text-blue-200">Install Trust Wallet or Coinbase Wallet mobile apps</span>
            </div>
          </div>
          
          <div className="mt-3 flex space-x-2">
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 px-3 py-1 rounded-lg border border-blue-500/30 transition-colors"
            >
              Get MetaMask
            </a>
            <button 
              onClick={() => setShowBanner(false)}
              className="text-xs bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 px-3 py-1 rounded-lg border border-gray-500/30 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}