/**
 * Performance Monitoring System
 * Tracks operation performance and provides optimization recommendations
 * Helps identify bottlenecks and optimize chain-specific configurations
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChainConfig } from '../hooks/useChainConfig';

export interface PerformanceMetric {
  operation: string;
  chainId: number;
  duration: number;
  success: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  operation: string;
  chainId: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  lastUpdated: number;
}

export interface PerformanceReport {
  chainId: number;
  chainName: string;
  stats: PerformanceStats[];
  recommendations: string[];
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  lastGenerated: number;
}

/**
 * Performance Monitoring Hook
 * Tracks and analyzes operation performance across chains
 */
export function usePerformanceMonitor() {
  const { chainId, config: chainConfig } = useChainConfig();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [currentStats, setCurrentStats] = useState<PerformanceStats[]>([]);
  const metricsRef = useRef<PerformanceMetric[]>([]);

  // Performance thresholds based on chain characteristics
  const getPerformanceThresholds = useCallback((targetChainId: number) => {
    if (targetChainId === 137) {
      // Polygon - higher thresholds due to network congestion
      return {
        'transaction-confirm': { good: 30000, fair: 60000 }, // 30s good, 60s fair
        'data-fetch': { good: 5000, fair: 10000 }, // 5s good, 10s fair
        'nft-scan': { good: 20000, fair: 40000 }, // 20s good, 40s fair
        'cache-invalidation': { good: 2000, fair: 5000 }, // 2s good, 5s fair
      };
    } else {
      // ApeChain - lower thresholds due to faster network
      return {
        'transaction-confirm': { good: 15000, fair: 30000 }, // 15s good, 30s fair
        'data-fetch': { good: 2000, fair: 5000 }, // 2s good, 5s fair
        'nft-scan': { good: 10000, fair: 20000 }, // 10s good, 20s fair
        'cache-invalidation': { good: 1000, fair: 2000 }, // 1s good, 2s fair
      };
    }
  }, []);

  // Record a performance metric
  const recordMetric = useCallback((
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ) => {
    if (!chainId) return;

    const metric: PerformanceMetric = {
      operation,
      chainId,
      duration,
      success,
      timestamp: Date.now(),
      metadata,
    };

    // Add to metrics array (keep last 1000 metrics per chain)
    setMetrics(prev => {
      const updated = [...prev, metric];
      const chainMetrics = updated.filter(m => m.chainId === chainId);
      const otherMetrics = updated.filter(m => m.chainId !== chainId);
      
      // Keep only last 1000 metrics for current chain
      const trimmedChainMetrics = chainMetrics.slice(-1000);
      
      const final = [...otherMetrics, ...trimmedChainMetrics];
      metricsRef.current = final;
      return final;
    });

    // Log significant performance issues
    const thresholds = getPerformanceThresholds(chainId);
    const threshold = thresholds[operation as keyof typeof thresholds];
    
    if (threshold && duration > threshold.fair) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ [PERF] Slow ${operation} on chain ${chainId}: ${duration}ms (threshold: ${threshold.fair}ms)`);
      }
    } else if (threshold && duration > threshold.good) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 [PERF] ${operation} on chain ${chainId}: ${duration}ms (above good threshold: ${threshold.good}ms)`);
      }
    }

    if (!success && process.env.NODE_ENV === 'development') {
      console.error(`❌ [PERF] Failed ${operation} on chain ${chainId}: ${duration}ms`, metadata);
    }
  }, [chainId, getPerformanceThresholds]);

  // Calculate performance statistics
  const calculateStats = useCallback((targetChainId: number): PerformanceStats[] => {
    const chainMetrics = metricsRef.current.filter(m => m.chainId === targetChainId);
    
    // Group by operation
    const operationGroups = chainMetrics.reduce((groups, metric) => {
      if (!groups[metric.operation]) {
        groups[metric.operation] = [];
      }
      groups[metric.operation].push(metric);
      return groups;
    }, {} as Record<string, PerformanceMetric[]>);

    return Object.entries(operationGroups).map(([operation, operationMetrics]) => {
      const successful = operationMetrics.filter(m => m.success);
      const failed = operationMetrics.filter(m => !m.success);
      const durations = operationMetrics.map(m => m.duration);

      return {
        operation,
        chainId: targetChainId,
        totalOperations: operationMetrics.length,
        successfulOperations: successful.length,
        failedOperations: failed.length,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
        minDuration: Math.min(...durations) || 0,
        maxDuration: Math.max(...durations) || 0,
        successRate: (successful.length / operationMetrics.length) * 100 || 0,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Generate performance report with recommendations
  const generateReport = useCallback((targetChainId?: number): PerformanceReport => {
    const reportChainId = targetChainId || chainId || 33139;
    const reportChainName = reportChainId === 137 ? 'Polygon' : 'ApeChain';
    const stats = calculateStats(reportChainId);
    const thresholds = getPerformanceThresholds(reportChainId);
    
    const recommendations: string[] = [];
    let overallHealth: PerformanceReport['overallHealth'] = 'excellent';

    // Analyze each operation type
    stats.forEach(stat => {
      const threshold = thresholds[stat.operation as keyof typeof thresholds];
      
      if (stat.successRate < 90) {
        recommendations.push(`${stat.operation}: Low success rate (${stat.successRate.toFixed(1)}%) - investigate failures`);
        overallHealth = 'poor';
      } else if (stat.successRate < 95) {
        recommendations.push(`${stat.operation}: Moderate success rate (${stat.successRate.toFixed(1)}%) - monitor closely`);
        if (overallHealth === 'excellent') overallHealth = 'fair';
      }

      if (threshold) {
        if (stat.averageDuration > threshold.fair) {
          recommendations.push(`${stat.operation}: Very slow average (${Math.round(stat.averageDuration)}ms) - needs optimization`);
          overallHealth = 'poor';
        } else if (stat.averageDuration > threshold.good) {
          recommendations.push(`${stat.operation}: Slow average (${Math.round(stat.averageDuration)}ms) - consider optimization`);
          if (overallHealth === 'excellent') overallHealth = 'good';
        }
      }
    });

    // Chain-specific recommendations
    if (reportChainId === 137) {
      // Polygon-specific recommendations
      const transactionStats = stats.find(s => s.operation === 'transaction-confirm');
      if (transactionStats && transactionStats.averageDuration > 45000) {
        recommendations.push('Consider increasing transaction timeout multiplier for Polygon congestion');
      }
      
      const dataFetchStats = stats.find(s => s.operation === 'data-fetch');
      if (dataFetchStats && dataFetchStats.averageDuration > 8000) {
        recommendations.push('Consider increasing batch sizes to reduce RPC calls on Polygon');
      }
    } else {
      // ApeChain-specific recommendations
      const transactionStats = stats.find(s => s.operation === 'transaction-confirm');
      if (transactionStats && transactionStats.averageDuration > 20000) {
        recommendations.push('ApeChain transactions slower than expected - check RPC endpoint health');
      }
    }

    // General recommendations
    if (stats.length === 0) {
      recommendations.push('No performance data available - start using the application to collect metrics');
      overallHealth = 'fair';
    }

    return {
      chainId: reportChainId,
      chainName: reportChainName,
      stats,
      recommendations,
      overallHealth,
      lastGenerated: Date.now(),
    };
  }, [chainId, calculateStats, getPerformanceThresholds]);

  // Update current stats periodically
  useEffect(() => {
    if (!chainId) return;

    const updateStats = () => {
      const newStats = calculateStats(chainId);
      setCurrentStats(newStats);
    };

    // Initial calculation
    updateStats();

    // Update every 30 seconds
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, [chainId, calculateStats]);

  // Performance measurement wrapper
  const measurePerformance = useCallback(async <T>(
    operation: string,
    asyncFunction: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await asyncFunction();
      const duration = Date.now() - startTime;
      recordMetric(operation, duration, true, metadata);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      recordMetric(operation, duration, false, { 
        ...metadata, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }, [recordMetric]);

  // Synchronous performance measurement
  const measureSync = useCallback(<T>(
    operation: string,
    syncFunction: () => T,
    metadata?: Record<string, any>
  ): T => {
    const startTime = Date.now();
    
    try {
      const result = syncFunction();
      const duration = Date.now() - startTime;
      recordMetric(operation, duration, true, metadata);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      recordMetric(operation, duration, false, { 
        ...metadata, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }, [recordMetric]);

  // Get performance summary for current chain
  const getPerformanceSummary = useCallback(() => {
    if (!chainId || currentStats.length === 0) {
      return {
        totalOperations: 0,
        averageSuccessRate: 0,
        averageDuration: 0,
        health: 'unknown' as const,
      };
    }

    const totalOps = currentStats.reduce((sum, stat) => sum + stat.totalOperations, 0);
    const avgSuccessRate = currentStats.reduce((sum, stat) => sum + stat.successRate, 0) / currentStats.length;
    const avgDuration = currentStats.reduce((sum, stat) => sum + stat.averageDuration, 0) / currentStats.length;
    
    let health: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (avgSuccessRate < 90 || avgDuration > getPerformanceThresholds(chainId)['transaction-confirm'].fair) {
      health = 'poor';
    } else if (avgSuccessRate < 95 || avgDuration > getPerformanceThresholds(chainId)['transaction-confirm'].good) {
      health = 'fair';
    } else if (avgSuccessRate < 98) {
      health = 'good';
    }

    return {
      totalOperations: totalOps,
      averageSuccessRate: avgSuccessRate,
      averageDuration: avgDuration,
      health,
    };
  }, [chainId, currentStats, getPerformanceThresholds]);

  return {
    // Core functions
    recordMetric,
    measurePerformance,
    measureSync,
    
    // Data access
    currentStats,
    generateReport,
    getPerformanceSummary,
    
    // Utilities
    getPerformanceThresholds: () => getPerformanceThresholds(chainId || 33139),
    clearMetrics: () => {
      setMetrics([]);
      setCurrentStats([]);
      metricsRef.current = [];
    },
  };
}