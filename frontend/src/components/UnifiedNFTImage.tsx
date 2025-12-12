/**
 * Unified NFT Image Component
 * Consolidates NFTImage, OptimizedImage, and OptimizedNFTImage into a single, efficient component
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useNFTMetadata } from '../hooks/useNFTMetadata';
import { COMPONENT_SIZES, COMPONENT_NAMES } from '../constants/architecture';
import { ImagePreloader } from '../utils/performance';
import { ImageProxyService } from '../services/imageProxyService';
import type { ComponentSize } from '../constants/architecture';

interface UnifiedNFTImageProps {
  contractAddress: string;
  tokenId: string;
  className?: string;
  showName?: boolean;
  priority?: boolean;
  size?: ComponentSize;
  fallbackSrc?: string;
}

// Global image preloader instance
const imagePreloader = new ImagePreloader();

function UnifiedNFTImage({ 
  contractAddress, 
  tokenId, 
  className = '', 
  showName = false,
  priority = false,
  size = 'md',
  fallbackSrc = '/placeholder-nft.svg'
}: UnifiedNFTImageProps) {
  const { metadata, loading, error } = useNFTMetadata(contractAddress, tokenId);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);
  const [preloadStarted, setPreloadStarted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const sizeClasses = COMPONENT_SIZES;

  // Optimized Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.05 } // Increased margin, reduced threshold
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Preload images when they come into view
  useEffect(() => {
    if (isInView && metadata?.image && !preloadStarted && !imageError) {
      setPreloadStarted(true);
      imagePreloader.preload(metadata.image, priority ? 10 : 1);
      
      // Preload alternatives too
      if (metadata.imageAlternatives) {
        metadata.imageAlternatives.forEach((alt, index) => {
          imagePreloader.preload(alt, priority ? 5 : 0.5 - index * 0.1);
        });
      }
    }
  }, [isInView, metadata?.image, metadata?.imageAlternatives, priority, preloadStarted, imageError]);

  const displayName = metadata?.name ? String(metadata.name).replace(/<[^>]*>/g, '').substring(0, 50) : `NFT #${tokenId}`;
  
  // Get optimized image URLs with fallbacks
  const imageUrls = metadata?.image && !imageError 
    ? ImageProxyService.getImageWithFallbacks(metadata.image, {
        width: size === 'lg' ? 800 : size === 'md' ? 400 : 200,
        quality: 85,
        format: 'webp'
      })
    : [fallbackSrc];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageSrc = imageUrls[currentImageIndex] || fallbackSrc;

  const handleImageLoad = useCallback(() => {
    console.log(`✅ Image loaded successfully for NFT ${contractAddress}#${tokenId}`);
    setImageLoaded(true);
    setImageError(false);
  }, [contractAddress, tokenId]);

  const handleImageError = useCallback(() => {
    console.error(`❌ Image load failed for NFT ${contractAddress}#${tokenId}:`, {
      currentUrl: imageSrc,
      fallbackIndex: currentImageIndex,
      totalFallbacks: imageUrls.length,
      retryCount
    });
    
    // Try next fallback URL
    if (currentImageIndex < imageUrls.length - 1) {
      console.log(`🔄 Trying fallback ${currentImageIndex + 1}/${imageUrls.length - 1}`);
      setCurrentImageIndex(prev => prev + 1);
      setImageLoaded(false);
      setRetryCount(0); // Reset retry count for new URL
    } else if (retryCount < 2) {
      // Retry current URL up to 2 times
      console.log(`🔄 Retrying current URL (attempt ${retryCount + 1}/2)`);
      setRetryCount(prev => prev + 1);
      setImageLoaded(false);
      // Force reload by adding timestamp
      setTimeout(() => {
        const img = document.querySelector(`img[alt="${displayName}"]`) as HTMLImageElement;
        if (img) {
          img.src = `${imageSrc}?retry=${retryCount + 1}`;
        }
      }, 1000);
    } else {
      // All URLs and retries failed
      console.error(`❌ All image loading attempts failed for NFT ${contractAddress}#${tokenId}`);
      setImageError(true);
      setImageLoaded(false);
    }
  }, [contractAddress, tokenId, currentImageIndex, imageUrls.length, retryCount, imageSrc, displayName]);

  if (loading) {
    return (
      <div 
        ref={containerRef}
        className={`relative bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/20 rounded-lg flex items-center justify-center ${sizeClasses[size]} ${className} backdrop-blur-sm overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-lg animate-pulse"></div>
        <div className="relative flex flex-col items-center space-y-2">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-emerald-300 text-xs font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg border border-emerald-500/30 ${sizeClasses[size]} ${className} bg-gradient-to-br from-slate-800 to-slate-900`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-lg"></div>
      
      {isInView && (
        <img
          src={imageSrc}
          alt={displayName}
          className={`relative w-full h-full object-cover transition-all duration-300 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
        />
      )}

      {isInView && !imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {(error || imageError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/40 p-2">
          <span className="text-emerald-300 text-sm font-medium text-center">NFT #{tokenId}</span>
          <div className="mt-1 px-2 py-1 bg-emerald-500/10 border border-emerald-400/30 rounded text-emerald-400 text-xs">
            {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
          </div>
        </div>
      )}

      {showName && metadata?.name && imageLoaded && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent p-2">
          <p className="text-emerald-200 text-sm font-medium truncate">{displayName}</p>
        </div>
      )}
    </div>
  );
}

UnifiedNFTImage.displayName = COMPONENT_NAMES.NFT_IMAGE;

export default memo(UnifiedNFTImage, (prevProps, nextProps) => {
  // Optimized comparison - only check essential props
  return (
    prevProps.contractAddress === nextProps.contractAddress &&
    prevProps.tokenId === nextProps.tokenId &&
    prevProps.size === nextProps.size &&
    prevProps.priority === nextProps.priority
  );
});