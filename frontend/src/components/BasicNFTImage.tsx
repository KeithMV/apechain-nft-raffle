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
  const [imageUrl, setImageUrl] = useState<string>('/placeholder-nft.svg');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Intelligent image loading with preloading
  useEffect(() => {
    if (metadata?.image && metadata.image !== '/placeholder-nft.svg') {
      setImageLoading(true);
      setImageError(false);
      
      console.log('🖼️ [PERF] Starting intelligent image preloading for:', metadata.image.substring(0, 50) + '...');
      
      // Use intelligent preloading to get the best available URL
      SimpleImageProxy.getBestImageUrl(metadata.image)
        .then((bestUrl) => {
          setImageUrl(bestUrl);
          setImageLoading(false);
        })
        .catch((error) => {
          console.error('🖼️ [PERF] Image preloading failed:', error);
          setImageUrl('/placeholder-nft.svg');
          setImageError(true);
          setImageLoading(false);
        });
    } else {
      // Generate placeholder immediately for better UX
      const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#1e293b"/>
        <circle cx="100" cy="80" r="20" fill="#64748b"/>
        <rect x="85" y="70" width="30" height="20" rx="2" fill="#1e293b"/>
        <text x="100" y="120" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="monospace">NFT #${tokenId}</text>
        <text x="100" y="140" text-anchor="middle" fill="#64748b" font-size="8" font-family="monospace">${contractAddress.slice(0,6)}...${contractAddress.slice(-4)}</text>
      </svg>`;
      
      setImageUrl(`data:image/svg+xml;base64,${btoa(svgContent)}`);
      setImageLoading(false);
    }
  }, [metadata?.image, tokenId, contractAddress]);

  // Fallback error handler for final image load
  const handleImageError = useCallback(() => {
    if (!imageError) {
      console.log('🖼️ [PERF] Final image load failed, using generated placeholder');
      const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#1e293b"/>
        <circle cx="100" cy="80" r="20" fill="#64748b"/>
        <rect x="85" y="70" width="30" height="20" rx="2" fill="#1e293b"/>
        <text x="100" y="120" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="monospace">NFT #${tokenId}</text>
        <text x="100" y="140" text-anchor="middle" fill="#64748b" font-size="8" font-family="monospace">${contractAddress.slice(0,6)}...${contractAddress.slice(-4)}</text>
      </svg>`;
      
      setImageUrl(`data:image/svg+xml;base64,${btoa(svgContent)}`);
      setImageError(true);
    }
  }, [imageError, tokenId, contractAddress]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32', 
    lg: 'w-full h-full'
  };

  if (loading || imageLoading) {
    return (
      <div className={`${className} ${sizeClasses[size]} bg-slate-800/50 rounded-xl flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-xs">{loading ? 'Loading metadata...' : 'Optimizing image...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden rounded-xl bg-slate-900/50`}>
      <img
        src={imageUrl}
        alt={metadata?.name || `NFT #${tokenId}`}
        className={`${sizeClasses[size]} object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleImageError}
        loading="lazy" // Native lazy loading as backup
      />
      
      {showName && metadata?.name && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
          <p className="text-white text-sm truncate">
            {metadata.name}
          </p>
        </div>
      )}
      
      {/* Performance indicator for debugging */}
      {process.env.REACT_APP_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/80 text-xs text-green-400 px-2 py-1 rounded">
          {imageError ? '⚠️' : '✅'}
        </div>
      )}
    </div>
  );
}