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
            Install a Web3 wallet to use ApeChain Raffles on mobile:
          </p>
          
          <div className="mt-3 space-y-2">
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 px-3 py-2 rounded-lg border border-blue-500/30 transition-colors"
            >
              Get MetaMask
            </a>
            <a 
              href="https://rainbow.me/download" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 px-3 py-2 rounded-lg border border-purple-500/30 transition-colors"
            >
              Get Rainbow
            </a>
            <a 
              href="https://trustwallet.com/download" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center text-xs bg-green-600/20 hover:bg-green-600/30 text-green-200 px-3 py-2 rounded-lg border border-green-500/30 transition-colors"
            >
              Get Trust Wallet
            </a>
            <button 
              onClick={() => setShowBanner(false)}
              className="block w-full text-center text-xs bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 px-3 py-2 rounded-lg border border-gray-500/30 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}