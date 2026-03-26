import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useChainId } from 'wagmi';
import { useChainConfig } from './useChainConfig';
import { useIntelligentCache } from './useIntelligentCache';

interface PreloadRule {
  trigger: string;
  targets: string[];
  priority: number;
  condition?: () => boolean;
}

interface UserSession {
  startTime: number;
  pageViews: string[];
  interactions: string[];
  preferences: Record<string, any>;
}

export const usePredictivePreloading = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const chainId = useChainId();
  const chainConfig = useChainConfig();
  const { trackQuery, getCacheStrategy } = useIntelligentCache();
  const sessionRef = useRef<UserSession>({
    startTime: Date.now(),
    pageViews: [],
    interactions: [],
    preferences: {}
  });

  // Preload rules based on user behavior patterns
  const preloadRules: PreloadRule[] = [
    {
      trigger: '/browse',
      targets: ['raffle-details', 'user-nfts', 'raffle-positions'],
      priority: 1,
      condition: () => true
    },
    {
      trigger: '/dashboard',
      targets: ['created-raffles', 'user-balance', 'transaction-history'],
      priority: 1,
      condition: () => true
    },
    {
      trigger: '/raffle/',
      targets: ['nft-metadata', 'raffle-participants', 'similar-raffles'],
      priority: 2,
      condition: () => true
    },
    {
      trigger: 'wallet-connect',
      targets: ['user-nfts', 'user-balance', 'created-raffles'],
      priority: 1,
      condition: () => true
    },
    {
      trigger: 'chain-switch',
      targets: ['all-raffles', 'user-data'],
      priority: 1,
      condition: () => true
    }
  ];

  // Track user session and build preferences
  const updateSession = useCallback((action: string, data?: any) => {
    const session = sessionRef.current;
    
    switch (action) {
      case 'page-view':
        session.pageViews.push(data);
        if (session.pageViews.length > 20) {
          session.pageViews = session.pageViews.slice(-20);
        }
        break;
      case 'interaction':
        session.interactions.push(data);
        if (session.interactions.length > 50) {
          session.interactions = session.interactions.slice(-50);
        }
        break;
      case 'preference':
        session.preferences = { ...session.preferences, ...data };
        break;
    }
  }, []);

  // Predict next likely actions based on current context
  const predictNextActions = useCallback((currentPath: string): string[] => {
    const session = sessionRef.current;
    const predictions: string[] = [];
    
    // Pattern-based predictions
    if (currentPath === '/browse') {
      // Users often go to raffle details after browsing
      predictions.push('raffle-details', 'user-nfts');
      
      // If user frequently creates raffles, preload dashboard
      const dashboardVisits = session.pageViews.filter(p => p.includes('/dashboard')).length;
      if (dashboardVisits > 2) {
        predictions.push('dashboard-data');
      }
    }
    
    if (currentPath === '/dashboard') {
      // Users often check browse page after dashboard
      predictions.push('browse-raffles');
      
      // If user has created raffles, they might check details
      const createActions = session.interactions.filter(i => i.includes('create')).length;
      if (createActions > 0) {
        predictions.push('raffle-management');
      }
    }
    
    if (currentPath.includes('/raffle/')) {
      // Users often buy tickets or check similar raffles
      predictions.push('ticket-purchase', 'similar-raffles', 'user-balance');
    }
    
    // Time-based predictions
    const sessionDuration = Date.now() - session.startTime;
    if (sessionDuration > 300000) { // 5 minutes
      // Long sessions often involve multiple actions
      predictions.push('comprehensive-data');
    }
    
    return [...new Set(predictions)];
  }, []);

  // Execute preloading based on predictions
  const executePreloading = useCallback(async (predictions: string[]) => {
    if (process.env.NODE_ENV === 'development' && predictions.length > 0) {
      console.log(`🔮 [PREDICTIVE] Loading ${predictions.length} predictions`);
    }
    
    const preloadPromises = predictions.map(async (prediction) => {
      try {
        switch (prediction) {
          case 'raffle-details':
            // Preload top raffles metadata
            queryClient.prefetchQuery({
              queryKey: ['all-raffles', chainId, 0, 5],
              staleTime: chainConfig.staleTime
            });
            break;
            
          case 'user-nfts':
            // Preload user NFTs if wallet connected
            queryClient.prefetchQuery({
              queryKey: ['user-nfts', chainId],
              staleTime: chainConfig.staleTime * 1.5 // User data stays fresh longer
            });
            break;
            
          case 'user-balance':
            queryClient.prefetchQuery({
              queryKey: ['user-balance', chainId],
              staleTime: chainConfig.staleTime * 1.5 // User data stays fresh longer
            });
            break;
            
          case 'created-raffles':
            queryClient.prefetchQuery({
              queryKey: ['created-raffles', chainId, 0, 10],
              staleTime: chainConfig.staleTime * 1.5 // User data stays fresh longer
            });
            break;
            
          case 'browse-raffles':
            queryClient.prefetchQuery({
              queryKey: ['all-raffles', chainId, 0, 10],
              staleTime: chainConfig.staleTime
            });
            break;
            
          default:
            // Generic preload based on prediction
            queryClient.prefetchQuery({
              queryKey: [prediction, chainId],
              staleTime: chainConfig.staleTime
            });
        }
        
        trackQuery([prediction, chainId.toString()]);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Preload failed for ${prediction}:`, error);
        }
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }, [chainId, chainConfig, queryClient, trackQuery]);

  // Smart preloading based on user interactions
  const triggerPreload = useCallback(async (trigger: string, context?: any) => {
    const applicableRules = preloadRules.filter(rule => 
      trigger.includes(rule.trigger) && (!rule.condition || rule.condition())
    );
    
    // Sort by priority
    applicableRules.sort((a, b) => a.priority - b.priority);
    
    // Execute preloading for high priority rules immediately
    const highPriorityTargets = applicableRules
      .filter(rule => rule.priority === 1)
      .flatMap(rule => rule.targets);
    
    if (highPriorityTargets.length > 0) {
      await executePreloading(highPriorityTargets);
    }
    
    // Execute lower priority rules during idle time
    const lowPriorityTargets = applicableRules
      .filter(rule => rule.priority > 1)
      .flatMap(rule => rule.targets);
    
    if (lowPriorityTargets.length > 0) {
      requestIdleCallback(() => {
        executePreloading(lowPriorityTargets);
      });
    }
    
    updateSession('interaction', trigger);
  }, [executePreloading, updateSession]);

  // Intelligent background preloading
  const backgroundPreload = useCallback(() => {
    const predictions = predictNextActions(location.pathname);
    
    if (predictions.length > 0) {
      requestIdleCallback(() => {
        executePreloading(predictions);
      });
    }
  }, [location.pathname, predictNextActions, executePreloading]);

  // Track page views and trigger preloading
  useEffect(() => {
    updateSession('page-view', location.pathname);
    triggerPreload(location.pathname);
    
    // Background preload after a short delay
    const timer = setTimeout(backgroundPreload, 2000);
    return () => clearTimeout(timer);
  }, [location.pathname, updateSession, triggerPreload, backgroundPreload]);

  // Periodic background preloading during idle time
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        backgroundPreload();
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [backgroundPreload]);

  return {
    triggerPreload,
    predictNextActions,
    updateSession,
    executePreloading,
    backgroundPreload
  };
};