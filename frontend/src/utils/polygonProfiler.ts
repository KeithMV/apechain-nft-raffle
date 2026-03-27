/**
 * Polygon Performance Profiler
 * Identifies exactly what's causing slowness on Polygon
 */

import { startTimer, endTimer, debugLog } from './debugManager';

interface PerformanceMetric {
  operation: string;
  duration: number;
  chainId: number;
  timestamp: number;
  metadata?: any;
}

class PolygonProfiler {
  private metrics: PerformanceMetric[] = [];
  private chainId: number = 0;

  setChainId(chainId: number) {
    this.chainId = chainId;
    debugLog.info(`[PROFILER] Switched to chain ${chainId}`);
  }

  // Profile any async operation
  async profile<T>(operation: string, fn: () => Promise<T>, metadata?: any): Promise<T> {
    const startTime = Date.now();
    const timerKey = `${operation}-${this.chainId}`;
    
    startTimer(timerKey);
    
    try {
      const result = await fn();
      const duration = endTimer(timerKey);
      
      this.recordMetric({
        operation,
        duration,
        chainId: this.chainId,
        timestamp: Date.now(),
        metadata
      });
      
      return result;
    } catch (error) {
      const duration = endTimer(timerKey);
      
      this.recordMetric({
        operation: `${operation}-ERROR`,
        duration,
        chainId: this.chainId,
        timestamp: Date.now(),
        metadata: { error: error instanceof Error ? error.message : String(error), ...metadata }
      });
      
      throw error;
    }
  }

  // Profile React Query operations
  profileQuery(queryKey: string, queryFn: () => Promise<any>, metadata?: any) {
    return this.profile(`query-${queryKey}`, queryFn, metadata);
  }

  // Profile contract calls
  profileContract(contractName: string, method: string, contractFn: () => Promise<any>) {
    return this.profile(`contract-${contractName}-${method}`, contractFn, {
      contract: contractName,
      method
    });
  }

  // Profile RPC calls
  profileRPC(method: string, rpcFn: () => Promise<any>, endpoint?: string) {
    return this.profile(`rpc-${method}`, rpcFn, {
      method,
      endpoint: endpoint?.split('/').pop() // Just the domain
    });
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 50 metrics to avoid memory issues
    if (this.metrics.length > 50) {
      this.metrics = this.metrics.slice(-50);
    }

    // Log slow operations immediately
    if (metric.duration > 3000) {
      debugLog.error(`🐌 VERY SLOW: ${metric.operation} took ${metric.duration}ms on chain ${metric.chainId}`);
    } else if (metric.duration > 1000) {
      debugLog.warn(`⏳ SLOW: ${metric.operation} took ${metric.duration}ms on chain ${metric.chainId}`);
    }
  }

  // Get performance analysis
  getAnalysis() {
    const polygonMetrics = this.metrics.filter(m => m.chainId === 137);
    const apechainMetrics = this.metrics.filter(m => m.chainId === 33139);

    const analyzeMetrics = (metrics: PerformanceMetric[], chainName: string) => {
      if (metrics.length === 0) return null;

      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const slowOps = metrics.filter(m => m.duration > 2000);
      const fastOps = metrics.filter(m => m.duration < 500);
      
      const operationBreakdown = metrics.reduce((acc, m) => {
        const opType = m.operation.split('-')[0];
        if (!acc[opType]) acc[opType] = [];
        acc[opType].push(m.duration);
        return acc;
      }, {} as Record<string, number[]>);

      const operationAvgs = Object.entries(operationBreakdown).map(([op, durations]) => ({
        operation: op,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        count: durations.length,
        slowest: Math.max(...durations)
      })).sort((a, b) => b.avgDuration - a.avgDuration);

      return {
        chainName,
        totalOperations: metrics.length,
        avgDuration: Math.round(avgDuration),
        slowOperations: slowOps.length,
        fastOperations: fastOps.length,
        slowestOperations: operationAvgs.slice(0, 5),
        recentSlow: slowOps.slice(-3).map(m => ({
          operation: m.operation,
          duration: m.duration,
          metadata: m.metadata
        }))
      };
    };

    return {
      polygon: analyzeMetrics(polygonMetrics, 'Polygon'),
      apechain: analyzeMetrics(apechainMetrics, 'ApeChain'),
      comparison: polygonMetrics.length > 0 && apechainMetrics.length > 0 ? {
        polygonAvg: Math.round(polygonMetrics.reduce((sum, m) => sum + m.duration, 0) / polygonMetrics.length),
        apechainAvg: Math.round(apechainMetrics.reduce((sum, m) => sum + m.duration, 0) / apechainMetrics.length),
        slowdownFactor: Math.round((polygonMetrics.reduce((sum, m) => sum + m.duration, 0) / polygonMetrics.length) / 
                                  (apechainMetrics.reduce((sum, m) => sum + m.duration, 0) / apechainMetrics.length) * 100) / 100
      } : null
    };
  }

  // Print detailed analysis
  printAnalysis() {
    const analysis = this.getAnalysis();
    
    console.group('📊 POLYGON PERFORMANCE ANALYSIS');
    
    if (analysis.polygon) {
      console.group('🔶 Polygon Performance');
      console.log(`Average Duration: ${analysis.polygon.avgDuration}ms`);
      console.log(`Total Operations: ${analysis.polygon.totalOperations}`);
      console.log(`Slow Operations (>2s): ${analysis.polygon.slowOperations}`);
      console.log(`Fast Operations (<500ms): ${analysis.polygon.fastOperations}`);
      
      if (analysis.polygon.slowestOperations.length > 0) {
        console.log('\n🐌 Slowest Operation Types:');
        analysis.polygon.slowestOperations.forEach(op => {
          console.log(`  ${op.operation}: ${op.avgDuration}ms avg (${op.count} calls, slowest: ${op.slowest}ms)`);
        });
      }
      
      if (analysis.polygon.recentSlow.length > 0) {
        console.log('\n🚨 Recent Slow Operations:');
        analysis.polygon.recentSlow.forEach(op => {
          console.log(`  ${op.operation}: ${op.duration}ms`, op.metadata);
        });
      }
      console.groupEnd();
    }

    if (analysis.apechain) {
      console.group('⚡ ApeChain Performance');
      console.log(`Average Duration: ${analysis.apechain.avgDuration}ms`);
      console.log(`Total Operations: ${analysis.apechain.totalOperations}`);
      console.log(`Slow Operations (>2s): ${analysis.apechain.slowOperations}`);
      console.log(`Fast Operations (<500ms): ${analysis.apechain.fastOperations}`);
      console.groupEnd();
    }

    if (analysis.comparison) {
      console.group('⚖️ Chain Comparison');
      console.log(`Polygon Average: ${analysis.comparison.polygonAvg}ms`);
      console.log(`ApeChain Average: ${analysis.comparison.apechainAvg}ms`);
      console.log(`Polygon is ${analysis.comparison.slowdownFactor}x slower than ApeChain`);
      console.groupEnd();
    }

    console.groupEnd();
  }

  // Clear all metrics
  clear() {
    this.metrics = [];
    debugLog.info('[PROFILER] Metrics cleared');
  }
}

// Global profiler instance
export const polygonProfiler = new PolygonProfiler();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).polygonProfiler = polygonProfiler;
  (window as any).printPolygonAnalysis = () => polygonProfiler.printAnalysis();
  
  console.log('🔍 Polygon profiler available:');
  console.log('  • printPolygonAnalysis() - View detailed performance analysis');
}