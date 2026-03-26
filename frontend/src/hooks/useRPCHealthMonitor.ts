/**
 * RPC Health Monitoring System
 * Automatically monitors RPC endpoint health and prioritizes reliable connections
 * Reduces RPC failures and improves transaction success rates
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChainConfig } from '../hooks/useChainConfig';

export interface RPCEndpoint {
  url: string;
  priority: number;
  isHealthy: boolean;
  lastChecked: number;
  responseTime: number;
  failureCount: number;
  successCount: number;
}

export interface RPCHealthStatus {
  endpoints: RPCEndpoint[];
  activeEndpoint: string;
  totalFailures: number;
  lastHealthCheck: number;
}

/**
 * RPC Health Monitoring Hook
 * Monitors endpoint health and provides the best available endpoint
 */
export function useRPCHealthMonitor(chainId: number | undefined) {
  const { config: chainConfig } = useChainConfig();
  const [healthStatus, setHealthStatus] = useState<RPCHealthStatus | null>(null);
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const isMonitoring = useRef(false);

  // Get RPC endpoints for the current chain
  const getRPCEndpoints = useCallback((targetChainId: number): RPCEndpoint[] => {
    if (targetChainId === 33139) {
      // ApeChain endpoints
      return [
        { url: 'https://apechain.calderaexplorer.xyz/api/eth-rpc', priority: 1, isHealthy: true, lastChecked: 0, responseTime: 0, failureCount: 0, successCount: 0 },
        { url: 'https://rpc.apechain.com', priority: 2, isHealthy: true, lastChecked: 0, responseTime: 0, failureCount: 0, successCount: 0 },
      ];
    } else if (targetChainId === 137) {
      // Polygon endpoints - prioritized based on reliability
      return [
        { url: 'https://rpc-mainnet.matic.network', priority: 1, isHealthy: true, lastChecked: 0, responseTime: 0, failureCount: 0, successCount: 0 },
        { url: 'https://polygon-rpc.com', priority: 2, isHealthy: true, lastChecked: 0, responseTime: 0, failureCount: 0, successCount: 0 },
        { url: 'https://rpc.ankr.com/polygon', priority: 3, isHealthy: true, lastChecked: 0, responseTime: 0, failureCount: 0, successCount: 0 },
        { url: 'https://rpc-mainnet.matic.quiknode.pro', priority: 4, isHealthy: true, lastChecked: 0, responseTime: 0, failureCount: 0, successCount: 0 },
        { url: 'https://polygon.llamarpc.com', priority: 5, isHealthy: false, lastChecked: 0, responseTime: 0, failureCount: 3, successCount: 0 }, // Known to be failing
      ];
    }
    return [];
  }, []);

  // Health check function for a single endpoint
  const checkEndpointHealth = useCallback(async (endpoint: RPCEndpoint): Promise<RPCEndpoint> => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        if (data.result) {
          return {
            ...endpoint,
            isHealthy: true,
            lastChecked: Date.now(),
            responseTime,
            failureCount: Math.max(0, endpoint.failureCount - 1), // Reduce failure count on success
            successCount: endpoint.successCount + 1,
          };
        }
      }
      
      throw new Error(`HTTP ${response.status}`);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const newFailureCount = endpoint.failureCount + 1;
      
      return {
        ...endpoint,
        isHealthy: newFailureCount < chainConfig.rpc.failureThreshold,
        lastChecked: Date.now(),
        responseTime,
        failureCount: newFailureCount,
        successCount: endpoint.successCount,
      };
    }
  }, [chainConfig.rpc.failureThreshold]);

  // Perform health check on all endpoints
  const performHealthCheck = useCallback(async (targetChainId: number) => {
    if (!targetChainId || isMonitoring.current) return;
    
    isMonitoring.current = true;
    
    try {
      const currentEndpoints = healthStatus?.endpoints || getRPCEndpoints(targetChainId);
      
      console.log(`🏥 [RPC-HEALTH] Starting health check for chain ${targetChainId} with ${currentEndpoints.length} endpoints`);
      
      // Check all endpoints in parallel
      const healthCheckPromises = currentEndpoints.map(endpoint => checkEndpointHealth(endpoint));
      const updatedEndpoints = await Promise.all(healthCheckPromises);
      
      // Sort by health status and response time
      const sortedEndpoints = updatedEndpoints.sort((a, b) => {
        // Healthy endpoints first
        if (a.isHealthy !== b.isHealthy) {
          return a.isHealthy ? -1 : 1;
        }
        // Then by priority
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Then by response time
        return a.responseTime - b.responseTime;
      });
      
      // Find the best active endpoint
      const activeEndpoint = sortedEndpoints.find(ep => ep.isHealthy)?.url || sortedEndpoints[0].url;
      
      const newHealthStatus: RPCHealthStatus = {
        endpoints: sortedEndpoints,
        activeEndpoint,
        totalFailures: sortedEndpoints.reduce((sum, ep) => sum + ep.failureCount, 0),
        lastHealthCheck: Date.now(),
      };
      
      setHealthStatus(newHealthStatus);
      
      const healthyCount = sortedEndpoints.filter(ep => ep.isHealthy).length;
      const avgResponseTime = sortedEndpoints
        .filter(ep => ep.isHealthy && ep.responseTime > 0)
        .reduce((sum, ep, _, arr) => sum + ep.responseTime / arr.length, 0);
      
      console.log(`✅ [RPC-HEALTH] Health check complete: ${healthyCount}/${sortedEndpoints.length} healthy, avg response: ${Math.round(avgResponseTime)}ms, active: ${activeEndpoint}`);
      
    } catch (error) {
      console.error('❌ [RPC-HEALTH] Health check failed:', error);
    } finally {
      isMonitoring.current = false;
    }
  }, [healthStatus, getRPCEndpoints, checkEndpointHealth]);

  // Start health monitoring
  useEffect(() => {
    if (!chainId) return;
    
    // Initial health check
    performHealthCheck(chainId);
    
    // Set up periodic health checks
    if (healthCheckInterval.current) {
      clearInterval(healthCheckInterval.current);
    }
    
    healthCheckInterval.current = setInterval(() => {
      performHealthCheck(chainId);
    }, chainConfig.rpc.healthCheckInterval);
    
    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
        healthCheckInterval.current = null;
      }
    };
  }, [chainId, chainConfig.rpc.healthCheckInterval, performHealthCheck]);

  // Report RPC failure (called by other hooks when RPC calls fail)
  const reportFailure = useCallback((failedUrl: string) => {
    if (!healthStatus) return;
    
    setHealthStatus(prev => {
      if (!prev) return prev;
      
      const updatedEndpoints = prev.endpoints.map(endpoint => {
        if (endpoint.url === failedUrl) {
          const newFailureCount = endpoint.failureCount + 1;
          return {
            ...endpoint,
            failureCount: newFailureCount,
            isHealthy: newFailureCount < chainConfig.rpc.failureThreshold,
            lastChecked: Date.now(),
          };
        }
        return endpoint;
      });
      
      // Find new active endpoint if current one became unhealthy
      const currentActive = updatedEndpoints.find(ep => ep.url === prev.activeEndpoint);
      const newActiveEndpoint = currentActive?.isHealthy 
        ? prev.activeEndpoint 
        : updatedEndpoints.find(ep => ep.isHealthy)?.url || updatedEndpoints[0].url;
      
      return {
        ...prev,
        endpoints: updatedEndpoints,
        activeEndpoint: newActiveEndpoint,
        totalFailures: prev.totalFailures + 1,
      };
    });
    
    console.warn(`⚠️ [RPC-HEALTH] Reported failure for ${failedUrl}`);
  }, [healthStatus, chainConfig.rpc.failureThreshold]);

  // Report RPC success (called by other hooks when RPC calls succeed)
  const reportSuccess = useCallback((successUrl: string, responseTime: number) => {
    if (!healthStatus) return;
    
    setHealthStatus(prev => {
      if (!prev) return prev;
      
      const updatedEndpoints = prev.endpoints.map(endpoint => {
        if (endpoint.url === successUrl) {
          return {
            ...endpoint,
            successCount: endpoint.successCount + 1,
            responseTime: (endpoint.responseTime + responseTime) / 2, // Moving average
            isHealthy: true,
            lastChecked: Date.now(),
          };
        }
        return endpoint;
      });
      
      return {
        ...prev,
        endpoints: updatedEndpoints,
      };
    });
  }, [healthStatus]);

  // Get the best available RPC endpoint
  const getBestEndpoint = useCallback((): string => {
    if (!healthStatus) {
      // Fallback to default endpoints if health status not ready
      const defaultEndpoints = getRPCEndpoints(chainId || 33139);
      return defaultEndpoints[0]?.url || 'https://rpc.apechain.com';
    }
    
    return healthStatus.activeEndpoint;
  }, [healthStatus, chainId, getRPCEndpoints]);

  // Get all healthy endpoints (for load balancing)
  const getHealthyEndpoints = useCallback((): string[] => {
    if (!healthStatus) return [];
    
    return healthStatus.endpoints
      .filter(ep => ep.isHealthy)
      .sort((a, b) => a.responseTime - b.responseTime)
      .map(ep => ep.url);
  }, [healthStatus]);

  return {
    healthStatus,
    getBestEndpoint,
    getHealthyEndpoints,
    reportFailure,
    reportSuccess,
    performHealthCheck: () => performHealthCheck(chainId || 33139),
    isMonitoring: isMonitoring.current,
  };
}