import { useCallback, useEffect, useRef } from 'react';
import { useChainId } from 'wagmi';
import { useChainConfig } from './useChainConfig';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context: Record<string, any>;
}

interface UserExperienceMetrics {
  pageLoadTime: number;
  transactionTime: number;
  cacheHitRate: number;
  errorRate: number;
  userSatisfactionScore: number;
}

interface AnalyticsSession {
  sessionId: string;
  startTime: number;
  metrics: PerformanceMetric[];
  userActions: string[];
  chainSwitches: number;
  transactionCount: number;
}

export const usePerformanceAnalytics = () => {
  const chainId = useChainId();
  const chainConfig = useChainConfig();
  const sessionRef = useRef<AnalyticsSession>({
    sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    metrics: [],
    userActions: [],
    chainSwitches: 0,
    transactionCount: 0
  });
  const metricsBuffer = useRef<PerformanceMetric[]>([]);

  // Record performance metric
  const recordMetric = useCallback((name: string, value: number, context: Record<string, any> = {}) => {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context: {
        chainId,
        sessionId: sessionRef.current.sessionId,
        ...context
      }
    };
    
    sessionRef.current.metrics.push(metric);
    metricsBuffer.current.push(metric);
    
    // Keep only recent metrics in memory
    if (sessionRef.current.metrics.length > 1000) {
      sessionRef.current.metrics = sessionRef.current.metrics.slice(-500);
    }
  }, [chainId]);

  // Measure operation performance
  const measureOperation = useCallback(<T>(
    operationName: string,
    operation: () => Promise<T>,
    context: Record<string, any> = {}
  ): Promise<T> => {
    const startTime = performance.now();
    
    return operation()
      .then(result => {
        const duration = performance.now() - startTime;
        recordMetric(`${operationName}_duration`, duration, {
          ...context,
          success: true
        });
        return result;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        recordMetric(`${operationName}_duration`, duration, {
          ...context,
          success: false,
          error: error.message
        });
        recordMetric(`${operationName}_error`, 1, {
          ...context,
          errorType: error.name,
          errorMessage: error.message
        });
        throw error;
      });
  }, [recordMetric]);

  // Calculate user experience metrics
  const calculateUXMetrics = useCallback((): UserExperienceMetrics => {
    const session = sessionRef.current;
    const recentMetrics = session.metrics.filter(m => 
      Date.now() - m.timestamp < 300000 // Last 5 minutes
    );
    
    // Page load time (average)
    const pageLoadMetrics = recentMetrics.filter(m => m.name.includes('page_load'));
    const avgPageLoadTime = pageLoadMetrics.length > 0 
      ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length
      : 0;
    
    // Transaction time (average)
    const transactionMetrics = recentMetrics.filter(m => m.name.includes('transaction'));
    const avgTransactionTime = transactionMetrics.length > 0
      ? transactionMetrics.reduce((sum, m) => sum + m.value, 0) / transactionMetrics.length
      : 0;
    
    // Cache hit rate
    const cacheHits = recentMetrics.filter(m => m.name === 'cache_hit').length;
    const cacheMisses = recentMetrics.filter(m => m.name === 'cache_miss').length;
    const cacheHitRate = (cacheHits + cacheMisses) > 0 
      ? cacheHits / (cacheHits + cacheMisses) 
      : 0;
    
    // Error rate
    const errorMetrics = recentMetrics.filter(m => m.name.includes('error'));
    const totalOperations = recentMetrics.filter(m => m.name.includes('duration')).length;
    const errorRate = totalOperations > 0 ? errorMetrics.length / totalOperations : 0;
    
    // User satisfaction score (based on performance thresholds)
    let satisfactionScore = 100;
    if (avgPageLoadTime > 3000) satisfactionScore -= 20;
    if (avgTransactionTime > 10000) satisfactionScore -= 30;
    if (cacheHitRate < 0.8) satisfactionScore -= 15;
    if (errorRate > 0.05) satisfactionScore -= 25;
    
    return {
      pageLoadTime: avgPageLoadTime,
      transactionTime: avgTransactionTime,
      cacheHitRate,
      errorRate,
      userSatisfactionScore: Math.max(0, satisfactionScore)
    };
  }, []);

  // Generate performance insights
  const generateInsights = useCallback(() => {
    const uxMetrics = calculateUXMetrics();
    const session = sessionRef.current;
    const insights: string[] = [];
    
    // Performance insights
    if (uxMetrics.pageLoadTime > 2000) {
      insights.push('Page load times are slower than optimal. Consider implementing more aggressive caching.');
    }
    
    if (uxMetrics.transactionTime > 15000) {
      insights.push('Transaction times are high. Check RPC endpoint health and consider timeout optimizations.');
    }
    
    if (uxMetrics.cacheHitRate < 0.7) {
      insights.push('Cache hit rate is low. Review cache strategies and TTL settings.');
    }
    
    if (uxMetrics.errorRate > 0.1) {
      insights.push('Error rate is elevated. Investigate common failure patterns and improve error handling.');
    }
    
    // Chain-specific insights
    const chainMetrics = session.metrics.filter(m => m.context.chainId === chainId);
    const avgChainPerformance = chainMetrics.length > 0
      ? chainMetrics.reduce((sum, m) => sum + m.value, 0) / chainMetrics.length
      : 0;
    
    if (chainId === 137 && avgChainPerformance > 5000) { // 5 second threshold for Polygon
      insights.push('Polygon performance is below target. Consider optimizing batch sizes and polling intervals.');
    }
    
    // User behavior insights
    if (session.chainSwitches > 5) {
      insights.push('Frequent chain switching detected. Ensure smooth cross-chain experience.');
    }
    
    if (session.transactionCount > 10 && uxMetrics.userSatisfactionScore < 70) {
      insights.push('High transaction volume with low satisfaction. Focus on transaction UX improvements.');
    }
    
    return {
      metrics: uxMetrics,
      insights,
      recommendations: generateRecommendations(uxMetrics)
    };
  }, [calculateUXMetrics, chainId, chainConfig]);

  // Generate actionable recommendations
  const generateRecommendations = useCallback((metrics: UserExperienceMetrics) => {
    const recommendations: string[] = [];
    
    if (metrics.pageLoadTime > 2000) {
      recommendations.push('Implement predictive preloading for frequently accessed data');
      recommendations.push('Optimize image loading with lazy loading and compression');
    }
    
    if (metrics.transactionTime > 10000) {
      recommendations.push('Implement transaction progress indicators');
      recommendations.push('Add transaction timeout handling with retry logic');
    }
    
    if (metrics.cacheHitRate < 0.8) {
      recommendations.push('Increase cache TTL for stable data');
      recommendations.push('Implement intelligent cache warming strategies');
    }
    
    if (metrics.errorRate > 0.05) {
      recommendations.push('Add circuit breaker pattern for failing operations');
      recommendations.push('Implement graceful degradation for non-critical features');
    }
    
    if (metrics.userSatisfactionScore < 80) {
      recommendations.push('Add performance monitoring dashboard for real-time insights');
      recommendations.push('Implement user feedback collection for satisfaction tracking');
    }
    
    return recommendations;
  }, []);

  // Track user actions
  const trackUserAction = useCallback((action: string, context: Record<string, any> = {}) => {
    sessionRef.current.userActions.push(action);
    
    if (action === 'chain_switch') {
      sessionRef.current.chainSwitches += 1;
    }
    
    if (action.includes('transaction')) {
      sessionRef.current.transactionCount += 1;
    }
    
    recordMetric('user_action', 1, { action, ...context });
  }, [recordMetric]);

  // Export analytics data
  const exportAnalytics = useCallback(() => {
    const session = sessionRef.current;
    const insights = generateInsights();
    
    return {
      session: {
        id: session.sessionId,
        duration: Date.now() - session.startTime,
        chainSwitches: session.chainSwitches,
        transactionCount: session.transactionCount,
        totalActions: session.userActions.length
      },
      metrics: insights.metrics,
      insights: insights.insights,
      recommendations: insights.recommendations,
      rawMetrics: session.metrics.slice(-100) // Last 100 metrics
    };
  }, [generateInsights]);

  // Periodic analytics processing
  useEffect(() => {
    const interval = setInterval(() => {
      // Process buffered metrics
      if (metricsBuffer.current.length > 0) {
        const insights = generateInsights();
        
        // Log insights for development
        if (process.env.NODE_ENV === 'development' && insights.insights.length > 0) {
          console.group('Performance Insights');
          insights.insights.forEach(insight => console.log('💡', insight));
          console.groupEnd();
        }
        
        metricsBuffer.current = [];
      }
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [generateInsights]);

  // Web Vitals integration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
          }
          
          if (entry.entryType === 'measure') {
            recordMetric(`custom_${entry.name}`, entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation', 'measure'] });
      
      return () => observer.disconnect();
    }
  }, [recordMetric]);

  return {
    recordMetric,
    measureOperation,
    trackUserAction,
    calculateUXMetrics,
    generateInsights,
    exportAnalytics
  };
};