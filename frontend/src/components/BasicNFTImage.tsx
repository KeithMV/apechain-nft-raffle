import React, { useState, useCallback } from 'react';
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

  const handleImageError = useCallback(() => {
    if (currentUrlIndex < imageUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  }, [currentUrlIndex, imageUrls.length]);

  const getImageUrl = () => {
    if (imageError) return '/placeholder-nft.svg';
    
    const currentUrl = imageUrls[currentUrlIndex] || '/placeholder-nft.svg';
    console.log('🖼️ BasicNFTImage rendering:', {
      tokenId,
      contractAddress,
      metadataImage: metadata?.image,
      currentUrlIndex,
      currentUrl,
      totalUrls: imageUrls.length
    });
    
    return currentUrl;
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