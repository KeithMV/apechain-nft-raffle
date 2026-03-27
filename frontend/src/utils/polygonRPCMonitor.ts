/**
 * Polygon RPC Health Monitor
 * Real-time monitoring and automatic failover for Polygon RPC endpoints
 */

import { updatePolygonRPCEndpoints, getPolygonRPCEndpoints } from '../config/wagmiUnified';

interface RPCEndpoint {
  url: string;
  isHealthy: boolean;
  responseTime: number;
  lastChecked: number;
  failureCount: number;
  successCount: number;
}

class PolygonRPCHealthMonitor {
  private endpoints: Map<string, RPCEndpoint> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeEndpoints();
  }

  private initializeEndpoints() {
    const urls = getPolygonRPCEndpoints();
    urls.forEach(url => {
      this.endpoints.set(url, {
        url,
        isHealthy: true,
        responseTime: 0,
        lastChecked: 0,
        failureCount: 0,
        successCount: 0,
      });
    });
  }

  /**
   * Start monitoring Polygon RPC endpoints
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🔍 [POLYGON RPC] Starting health monitoring...');

    // Initial health check
    this.checkAllEndpoints();

    // Set up periodic monitoring (every 30 seconds)
    this.monitoringInterval = setInterval(() => {
      this.checkAllEndpoints();
    }, 30000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ [POLYGON RPC] Stopped health monitoring');
  }

  /**
   * Check health of all endpoints
   */
  private async checkAllEndpoints() {
    console.log('🔍 [POLYGON RPC] Checking endpoint health...');

    const promises = Array.from(this.endpoints.keys()).map(url => 
      this.checkEndpointHealth(url)
    );

    await Promise.allSettled(promises);

    // Update the list of healthy endpoints
    this.updateHealthyEndpoints();
  }

  /**
   * Check health of a single endpoint
   */
  private async checkEndpointHealth(url: string): Promise<void> {
    const endpoint = this.endpoints.get(url);
    if (!endpoint) return;

    const startTime = Date.now();

    try {
      // Simple health check - get latest block number
      const response = await fetch(url, {
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
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        
        if (data.result && !data.error) {
          // Success
          endpoint.isHealthy = true;
          endpoint.responseTime = responseTime;
          endpoint.successCount++;
          endpoint.failureCount = Math.max(0, endpoint.failureCount - 1); // Reduce failure count on success
          
          console.log(`✅ [POLYGON RPC] ${url} - ${responseTime}ms`);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      // Failure
      endpoint.isHealthy = false;
      endpoint.responseTime = Date.now() - startTime;
      endpoint.failureCount++;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`❌ [POLYGON RPC] ${url} - ${errorMessage}`);

      // Mark as unhealthy after 3 consecutive failures
      if (endpoint.failureCount >= 3) {
        endpoint.isHealthy = false;
        console.warn(`🚫 [POLYGON RPC] ${url} marked as unhealthy (${endpoint.failureCount} failures)`);
      }
    }

    endpoint.lastChecked = Date.now();
  }

  /**
   * Update the list of healthy endpoints in wagmi config
   */
  private updateHealthyEndpoints() {
    const healthyEndpoints = Array.from(this.endpoints.values())
      .filter(endpoint => endpoint.isHealthy)
      .sort((a, b) => a.responseTime - b.responseTime) // Sort by response time
      .map(endpoint => endpoint.url);

    if (healthyEndpoints.length === 0) {
      console.error('🚨 [POLYGON RPC] No healthy endpoints available! Using fallback...');
      // Use emergency fallback
      healthyEndpoints.push('https://rpc-mainnet.maticvigil.com');
    }

    console.log(`🔄 [POLYGON RPC] Updated healthy endpoints (${healthyEndpoints.length}):`, healthyEndpoints);
    updatePolygonRPCEndpoints(healthyEndpoints);
  }

  /**
   * Get current endpoint health status
   */
  getHealthStatus() {
    const endpoints = Array.from(this.endpoints.values());
    const healthy = endpoints.filter(e => e.isHealthy);
    const unhealthy = endpoints.filter(e => !e.isHealthy);

    return {
      total: endpoints.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      healthyEndpoints: healthy.map(e => ({
        url: e.url,
        responseTime: e.responseTime,
        successCount: e.successCount,
      })),
      unhealthyEndpoints: unhealthy.map(e => ({
        url: e.url,
        failureCount: e.failureCount,
        lastError: 'Connection failed',
      })),
    };
  }

  /**
   * Force health check of all endpoints
   */
  async forceHealthCheck() {
    console.log('🔄 [POLYGON RPC] Forcing health check...');
    await this.checkAllEndpoints();
    return this.getHealthStatus();
  }

  /**
   * Get the best available endpoint
   */
  getBestEndpoint(): string | null {
    const healthyEndpoints = Array.from(this.endpoints.values())
      .filter(endpoint => endpoint.isHealthy)
      .sort((a, b) => a.responseTime - b.responseTime);

    return healthyEndpoints.length > 0 ? healthyEndpoints[0].url : null;
  }
}

// Export singleton instance
export const polygonRPCMonitor = new PolygonRPCHealthMonitor();

// Auto-start monitoring when imported
if (typeof window !== 'undefined') {
  // Start monitoring after a short delay to avoid blocking app startup
  setTimeout(() => {
    polygonRPCMonitor.startMonitoring();
  }, 5000);
}