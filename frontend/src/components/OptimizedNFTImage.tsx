/**
 * Optimized NFT Image Component
 * Phase C: Advanced image optimization with lazy loading and caching
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useNFTMetadata } from '../hooks/useNFTMetadata';

interface OptimizedNFTImageProps {
  contractAddress: string;
  tokenId: string;
  className?: string;
  showName?: boolean;
  priority?: boolean;
}

function OptimizedNFTImage({ 
  contractAddress, 
  tokenId, 
  className = '', 
  showName = false,
  priority = false
}: OptimizedNFTImageProps) {
  const { metadata, loading, error } = useNFTMetadata(contractAddress, tokenId);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px', threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  if (loading) {
    return (
      <div 
        ref={containerRef}
        className={`relative bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/20 rounded-lg flex items-center justify-center ${className} backdrop-blur-sm overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-lg animate-pulse"></div>
        <div className="relative flex flex-col items-center space-y-2">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-emerald-300 text-xs font-medium">Loading NFT...</span>
        </div>
      </div>
    );
  }

  if (error || imageError || !metadata?.image || metadata?.image === '/placeholder-nft.svg') {
    return (
      <div 
        ref={containerRef}
        className={`relative overflow-hidden rounded-lg border border-emerald-500/30 ${className} bg-gradient-to-br from-slate-800 to-slate-900`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-lg"></div>
        <img
          src="/placeholder-nft.svg"
          alt={metadata?.name ? String(metadata.name).replace(/<[^>]*>/g, '') : `NFT #${tokenId}`}
          className="relative w-full h-full object-cover opacity-60"
          loading={priority ? 'eager' : 'lazy'}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/40 p-4">
          <div className="text-center">
            <span className="text-emerald-300 text-sm font-medium block mb-1">NFT #{tokenId}</span>
            {showName && metadata?.name && (
              <span className="text-emerald-200 text-xs block mb-2 truncate max-w-full">
                {String(metadata.name).replace(/<[^>]*>/g, '').substring(0, 30)}
              </span>
            )}
            <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-400/30 rounded text-emerald-400 text-xs font-mono">
              {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg border border-emerald-500/30 ${className} bg-gradient-to-br from-slate-800 to-slate-900`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-lg"></div>
      
      {isInView && (
        <img
          src={metadata.image}
          alt={metadata.name || `NFT #${tokenId}`}
          className={`relative w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {isInView && !imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-emerald-300 text-xs font-medium">Loading image...</span>
          </div>
        </div>
      )}

      {showName && metadata.name && imageLoaded && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent p-3">
          <p className="text-emerald-200 text-sm font-medium truncate">
            {String(metadata.name).replace(/<[^>]*>/g, '').substring(0, 50)}
          </p>
          <p className="text-emerald-400/70 text-xs font-mono mt-1">
            {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(OptimizedNFTImage, (prevProps, nextProps) => {
  return (
    prevProps.contractAddress === nextProps.contractAddress &&
    prevProps.tokenId === nextProps.tokenId &&
    prevProps.className === nextProps.className &&
    prevProps.showName === nextProps.showName &&
    prevProps.priority === nextProps.priority
  );
});

export { OptimizedNFTImage };