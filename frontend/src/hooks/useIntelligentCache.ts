import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useChainId } from 'wagmi';
import { useChainConfig } from './useChainConfig';

interface CacheStrategy {
  priority: 'high' | 'medium' | 'low';
  ttl: number;
  prefetchTrigger: 'immediate' | 'hover' | 'scroll' | 'idle';
}

interface UserBehaviorPattern {
  frequentQueries: string[];
  navigationPattern: string[];
  timeSpent: Record<string, number>;
  lastActivity: number;
}

export const useIntelligentCache = () => {
  const queryClient = useQueryClient();
  const chainId = useChainId();
  const chainConfig = useChainConfig();
  const behaviorRef = useRef<UserBehaviorPattern>({
    frequentQueries: [],
    navigationPattern: [],
    timeSpent: {},
    lastActivity: Date.now()
  });

  // Cache strategies based on data type and user behavior
  const getCacheStrategy = useCallback((queryKey: string[]): CacheStrategy => {
    const key = queryKey.join('-');
    const behavior = behaviorRef.current;
    
    // High priority: frequently accessed data
    if (behavior.frequentQueries.includes(key)) {
      return {
        priority: 'high',
        ttl: chainConfig.staleTime * 2, // High priority: 60s ApeChain, 90s Polygon
        prefetchTrigger: 'immediate'
      };
    }
    
    // Medium priority: navigation-related data
    if (key.includes('raffle') || key.includes('nft')) {
      return {
        priority: 'medium',
        ttl: chainConfig.staleTime, // Medium priority: 30s ApeChain, 45s Polygon
        prefetchTrigger: 'hover'
      };
    }
    
    // Low priority: metadata and static content
    return {
      priority: 'low',
      ttl: chainConfig.staleTime * 0.5, // Low priority: 15s ApeChain, 22.5s Polygon
      prefetchTrigger: 'idle'
    };
  }, [chainConfig]);

  // Track user behavior patterns
  const trackQuery = useCallback((queryKey: string[]) => {
    const key = queryKey.join('-');
    const behavior = behaviorRef.current;
    
    // Update frequency tracking
    const index = behavior.frequentQueries.indexOf(key);
    if (index > -1) {
      behavior.frequentQueries.splice(index, 1);
    }
    behavior.frequentQueries.unshift(key);
    behavior.frequentQueries = behavior.frequentQueries.slice(0, 10);
    
    behavior.lastActivity = Date.now();
  }, []);

  // Predictive prefetching based on patterns
  const predictivePreload = useCallback(async (currentPath: string) => {
    const behavior = behaviorRef.current;
    const predictions: string[] = [];
    
    // Predict based on navigation patterns
    if (currentPath.includes('/browse')) {
      predictions.push('raffle-details', 'user-nfts');
    } else if (currentPath.includes('/dashboard')) {
      predictions.push('created-raffles', 'raffle-positions');
    }
    
    // Preload predicted queries during idle time
    requestIdleCallback(() => {
      predictions.forEach(prediction => {
        const queryKey = [prediction, chainId.toString()];
        const strategy = getCacheStrategy(queryKey);
        
        if (strategy.priority === 'high') {
          queryClient.prefetchQuery({
            queryKey,
            staleTime: strategy.ttl
          });
        }
      });
    });
  }, [chainId, queryClient, getCacheStrategy]);

  // Adaptive cache cleanup based on memory pressure
  const adaptiveCacheCleanup = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    // Sort by last access time and priority
    const sortedQueries = queries
      .filter(query => {
        const age = Date.now() - (query.state.dataUpdatedAt || 0);
        const strategy = getCacheStrategy(query.queryKey as string[]);
        return age > strategy.ttl;
      })
      .sort((a, b) => {
        const aStrategy = getCacheStrategy(a.queryKey as string[]);
        const bStrategy = getCacheStrategy(b.queryKey as string[]);
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        return priorityOrder[aStrategy.priority] - priorityOrder[bStrategy.priority];
      });
    
    // Remove low priority stale queries
    sortedQueries.slice(0, Math.floor(sortedQueries.length * 0.3)).forEach(query => {
      queryClient.removeQueries({ queryKey: query.queryKey });
    });
  }, [queryClient, getCacheStrategy]);

  // Smart prefetch on user interactions
  const smartPrefetch = useCallback((element: HTMLElement, queryKey: string[]) => {
    const strategy = getCacheStrategy(queryKey);
    
    const prefetchHandler = () => {
      queryClient.prefetchQuery({
        queryKey,
        staleTime: strategy.ttl
      });
      trackQuery(queryKey);
    };
    
    switch (strategy.prefetchTrigger) {
      case 'immediate':
        prefetchHandler();
        break;
      case 'hover':
        element.addEventListener('mouseenter', prefetchHandler, { once: true });
        break;
      case 'scroll':
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            prefetchHandler();
            observer.disconnect();
          }
        }, { threshold: 0.1 });
        observer.observe(element);
        break;
      case 'idle':
        requestIdleCallback(prefetchHandler);
        break;
    }
  }, [queryClient, getCacheStrategy, trackQuery]);

  // Periodic cache optimization
  useEffect(() => {
    const interval = setInterval(() => {
      adaptiveCacheCleanup();
    }, chainConfig.staleTime * 2); // Cleanup interval based on chain config
    
    return () => clearInterval(interval);
  }, [adaptiveCacheCleanup, chainConfig]);

  return {
    trackQuery,
    predictivePreload,
    smartPrefetch,
    getCacheStrategy,
    adaptiveCacheCleanup
  };
};