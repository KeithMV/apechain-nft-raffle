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

  // Get the best available RPC endpoint
  const getBestEndpoint = useCallback((): string => {
    if (!healthStatus) {
      // Fallback to default endpoints if health status not ready
      const defaultEndpoints = getRPCEndpoints(chainId || 33139);
      return defaultEndpoints[0]?.url || 'https://rpc.apechain.com';
    }
    
    return healthStatus.activeEndpoint;
  }, [healthStatus, chainId, getRPCEndpoints]);

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

  // Initialize health status
  useEffect(() => {
    if (!chainId) return;
    
    const endpoints = getRPCEndpoints(chainId);
    if (endpoints.length > 0) {
      setHealthStatus({
        endpoints,
        activeEndpoint: endpoints[0].url,
        totalFailures: 0,
        lastHealthCheck: Date.now(),
      });
    }
  }, [chainId, getRPCEndpoints]);

  return {
    healthStatus,
    getBestEndpoint,
    reportFailure,
    reportSuccess,
  };
}