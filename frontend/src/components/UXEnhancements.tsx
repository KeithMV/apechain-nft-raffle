import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChainId } from 'wagmi';
import { useChainConfig } from '../hooks/useChainConfig';

interface SmartLoadingProps {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeleton?: React.ReactNode;
  operation?: string;
  context?: Record<string, any>;
}

interface ProgressiveDisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  priority?: 'high' | 'medium' | 'low';
  preloadContent?: boolean;
}

interface AdaptiveUIProps {
  children: React.ReactNode;
  performanceMode?: 'auto' | 'high' | 'balanced' | 'low';
}

// Smart Loading Component with predictive states
export const SmartLoading: React.FC<SmartLoadingProps> = ({
  isLoading,
  error,
  children,
  fallback,
  skeleton,
  operation = 'unknown',
  context = {}
}) => {
  const chainId = useChainId();
  const chainConfig = useChainConfig();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const loadingStartRef = useRef<number | null>(null);

  const recordMetric = (metric: string, value: number, context?: any) => {
    console.log('Metric recorded:', { metric, value, context });
  };

  // Calculate estimated loading time based on operation and chain
  useEffect(() => {
    if (isLoading && !loadingStartRef.current) {
      loadingStartRef.current = Date.now();
      
      // Estimate based on operation type and chain
      let estimate = 3000; // Default estimate
      
      if (operation.includes('transaction')) {
        estimate = chainId === 137 ? 15000 : 8000; // Polygon vs ApeChain
      } else if (operation.includes('nft')) {
        estimate = chainId === 137 ? 8000 : 4000;
      } else if (operation.includes('raffle')) {
        estimate = chainId === 137 ? 6000 : 3000;
      }
      
      setEstimatedTime(estimate);
      
      // Show skeleton after 500ms for better perceived performance
      const skeletonTimer = setTimeout(() => {
        if (isLoading) setShowSkeleton(true);
      }, 500);
      
      return () => clearTimeout(skeletonTimer);
    }
    
    if (!isLoading && loadingStartRef.current) {
      const duration = Date.now() - loadingStartRef.current;
      recordMetric(`${operation}_load_time`, duration, context);
      loadingStartRef.current = null;
      setShowSkeleton(false);
      setEstimatedTime(null);
    }
  }, [isLoading, operation, chainId, chainConfig, context]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 text-red-500">⚠️</div>
          <div>
            <h3 className="font-medium text-red-800">Something went wrong</h3>
            <p className="text-sm text-red-600 mt-1">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
        </div>
        {fallback && (
          <div className="mt-3 pt-3 border-t border-red-200">
            {fallback}
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {showSkeleton && skeleton ? (
          skeleton
        ) : (
          <div className="flex items-center space-x-3 p-4">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-700">
                Loading {operation}...
              </div>
              {estimatedTime && (
                <div className="text-xs text-gray-500">
                  Estimated time: {Math.ceil(estimatedTime / 1000)}s
                </div>
              )}
            </div>
          </div>
        )}
        
        {estimatedTime && (
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, ((Date.now() - (loadingStartRef.current || 0)) / estimatedTime) * 100)}%`
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

// Progressive Disclosure Component
export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  title,
  children,
  defaultExpanded = false,
  priority = 'medium',
  preloadContent = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasPreloaded, setHasPreloaded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const trackUserAction = (action: string, data?: any) => {
    console.log('User action tracked:', { action, data });
  };

  // Preload content on hover for high priority items
  const handleMouseEnter = useCallback(() => {
    if (priority === 'high' && preloadContent && !hasPreloaded) {
      setHasPreloaded(true);
      trackUserAction('progressive_disclosure_hover', { title, priority });
    }
  }, [priority, preloadContent, hasPreloaded, title]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      trackUserAction('progressive_disclosure_toggle', { 
        title, 
        expanded: newState,
        priority 
      });
      return newState;
    });
  }, [title, priority]);

  // Smooth height animation
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      if (isExpanded) {
        element.style.maxHeight = `${element.scrollHeight}px`;
      } else {
        element.style.maxHeight = '0px';
      }
    }
  }, [isExpanded]);

  return (
    <div 
      className="border border-gray-200 rounded-lg overflow-hidden"
      onMouseEnter={handleMouseEnter}
    >
      <button
        onClick={toggleExpanded}
        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>
      
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isExpanded ? 'none' : '0px' }}
      >
        <div className="p-4 bg-white">
          {(isExpanded || hasPreloaded) && children}
        </div>
      </div>
    </div>
  );
};

// Adaptive UI Component that adjusts based on performance
export const AdaptiveUI: React.FC<AdaptiveUIProps> = ({
  children,
  performanceMode = 'auto'
}) => {
  const [currentMode, setCurrentMode] = useState(performanceMode);
  const [adaptiveStyles, setAdaptiveStyles] = useState<React.CSSProperties>({});

  const calculateUXMetrics = () => {
    return { userSatisfactionScore: 85 }; // Mock score
  };

  // Auto-adjust performance mode based on metrics
  useEffect(() => {
    if (performanceMode === 'auto') {
      const metrics = calculateUXMetrics();
      
      if (metrics.userSatisfactionScore < 60) {
        setCurrentMode('low');
      } else if (metrics.userSatisfactionScore < 80) {
        setCurrentMode('balanced');
      } else {
        setCurrentMode('high');
      }
    } else {
      setCurrentMode(performanceMode);
    }
  }, [performanceMode]);

  // Apply adaptive styles based on performance mode
  useEffect(() => {
    const styles: React.CSSProperties = {};
    
    switch (currentMode) {
      case 'low':
        styles.willChange = 'auto';
        styles.transform = 'translateZ(0)'; // Force GPU acceleration off
        break;
      case 'balanced':
        styles.willChange = 'transform';
        break;
      case 'high':
        styles.willChange = 'transform, opacity';
        styles.transform = 'translateZ(0)'; // Force GPU acceleration
        break;
    }
    
    setAdaptiveStyles(styles);
  }, [currentMode]);

  return (
    <div 
      style={adaptiveStyles}
      className={`adaptive-ui adaptive-ui--${currentMode}`}
    >
      {children}
    </div>
  );
};

// Smart Image Component with progressive loading
interface SmartImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  priority?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className = '',
  priority = false
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(priority ? src : '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const recordMetric = (metric: string, value: number, context?: any) => {
    console.log('Image metric recorded:', { metric, value, context });
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!priority && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !currentSrc) {
              setCurrentSrc(src);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }
  }, [priority, src, currentSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    recordMetric('image_load_success', 1, { src });
  }, [src]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    recordMetric('image_load_error', 1, { src });
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
  }, [src, fallbackSrc, currentSrc]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 text-gray-400">🖼️</div>
        </div>
      )}
      
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-12 h-12 mx-auto mb-2">❌</div>
            <div className="text-sm">Failed to load image</div>
          </div>
        </div>
      )}
    </div>
  );
};