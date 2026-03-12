import React, { useState, useCallback, useEffect } from 'react';
import { useNFTMetadata } from '../hooks/useNFTMetadata';
import { SimpleImageProxy } from '../services/SimpleImageProxy';

interface BasicNFTImageProps {
  contractAddress: string;
  tokenId: string;
  className?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function BasicNFTImage({ 
  contractAddress, 
  tokenId, 
  className = '', 
  showName = false,
  size = 'md'
}: BasicNFTImageProps) {
  const { metadata, loading } = useNFTMetadata(contractAddress, tokenId);
  const [imageError, setImageError] = useState(false);

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  const imageUrls = SimpleImageProxy.getFallbackUrls(metadata?.image || '');

  // Reset URL index when metadata loads
  useEffect(() => {
    if (metadata?.image && metadata.image !== '/placeholder-nft.svg') {
      setCurrentUrlIndex(0);
      setImageError(false);
    }
  }, [metadata?.image]);

  const handleImageError = useCallback(() => {
    if (currentUrlIndex < imageUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
    } else {
      // All URLs failed, show generated placeholder
      setImageError(true);
    }
  }, [currentUrlIndex, imageUrls.length]);

  const getImageUrl = () => {
    if (imageError) return '/placeholder-nft.svg';
    
    // If we have metadata image, try multiple sources
    if (metadata?.image) {
      const currentUrl = imageUrls[currentUrlIndex] || '/placeholder-nft.svg';
      return currentUrl;
    }
    
    // Fallback: Generate a simple placeholder with contract info
    const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#1e293b"/>
      <circle cx="100" cy="80" r="20" fill="#64748b"/>
      <rect x="85" y="70" width="30" height="20" rx="2" fill="#1e293b"/>
      <text x="100" y="120" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="monospace">NFT #${tokenId}</text>
      <text x="100" y="140" text-anchor="middle" fill="#64748b" font-size="8" font-family="monospace">${contractAddress.slice(0,6)}...${contractAddress.slice(-4)}</text>
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32', 
    lg: 'w-full h-full'
  };

  if (loading) {
    return (
      <div className={`${className} ${sizeClasses[size]} bg-slate-800/50 rounded-xl flex items-center justify-center`}>
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden rounded-xl bg-slate-900/50`}>
      <img
        src={getImageUrl()}
        alt={metadata?.name || `NFT #${tokenId}`}
        className={`${sizeClasses[size]} object-cover`}
        onError={handleImageError}
      />
      
      {showName && metadata?.name && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
          <p className="text-white text-sm truncate">
            {metadata.name}
          </p>
        </div>
      )}
    </div>
  );
}