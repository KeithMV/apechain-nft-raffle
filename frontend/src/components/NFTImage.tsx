import React, { useState, useCallback } from 'react';
import { useNFTMetadata } from '../hooks/useNFTMetadata';

interface NFTImageProps {
  contractAddress: string;
  tokenId: string;
  className?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function NFTImage({ 
  contractAddress, 
  tokenId, 
  className = '', 
  showName = false,
  size = 'md'
}: NFTImageProps) {
  const { metadata, loading } = useNFTMetadata(contractAddress, tokenId);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getImageUrls = (url: string): string[] => {
    if (!url) return ['/placeholder-nft.svg'];
    
    const urls: string[] = [];
    
    // IPFS URLs - try multiple gateways
    if (url.startsWith('ipfs://')) {
      const path = url.slice(7);
      const gateways = [
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://gateway.pinata.cloud/ipfs/'
      ];
      gateways.forEach(gateway => urls.push(`${gateway}${path}`));
    } else {
      urls.push(url);
    }
    
    urls.push('/placeholder-nft.svg');
    return urls;
  };

  const handleImageError = useCallback(() => {
    const imageUrls = getImageUrls(metadata?.image || '');
    if (currentImageIndex < imageUrls.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  }, [metadata?.image, currentImageIndex]);

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

  const imageUrls = getImageUrls(metadata?.image || '');
  const currentImageUrl = imageUrls[currentImageIndex];

  return (
    <div className={`${className} relative overflow-hidden rounded-xl bg-slate-900/50`}>
      <img
        src={currentImageUrl}
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