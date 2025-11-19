import { createPublicClient, http, fallback } from 'viem';
import { apeChain } from '../config/wagmi';

// Production-grade RPC configuration
interface RPCEndpoint {
  name: string;
  url: string;
  blockLimit: number;
  priority: number;
  timeout: number;
}

// Environment-based RPC configuration
function getRPCEndpoints(): RPCEndpoint[] {
  const endpoints: RPCEndpoint[] = [];
  
  // Add Alchemy if API key is available
  if (process.env.REACT_APP_ALCHEMY_API_KEY) {
    endpoints.push({
      name: 'Alchemy',
      url: `https://apechain-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
      blockLimit: 9000,
      priority: 1,
      timeout: 8000
    });
  }
  
  // Official ApeChain RPC
  endpoints.push({
    name: 'Official ApeChain',
    url: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
    blockLimit: 50000,
    priority: 2,
    timeout: 10000
  });
  
  // Backup public RPC
  endpoints.push({
    name: 'Public RPC',
    url: process.env.REACT_APP_BACKUP_RPC_URL || 'https://rpc.apechain.com',
    blockLimit: 25000,
    priority: 3,
    timeout: 12000
  });
  
  return endpoints.sort((a, b) => a.priority - b.priority);
}

const RPC_ENDPOINTS = getRPCEndpoints();

// Rate limiting and circuit breaker
class RPCRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequestsPerMinute = 60;
  
  canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = requests.filter(time => now - time < 60000);
    this.requests.set(endpoint, recentRequests);
    
    return recentRequests.length < this.maxRequestsPerMinute;
  }
  
  recordRequest(endpoint: string): void {
    const requests = this.requests.get(endpoint) || [];
    requests.push(Date.now());
    this.requests.set(endpoint, requests);
  }
}

const rateLimiter = new RPCRateLimiter();

// Create production-grade transport with fallback
const transport = fallback(
  RPC_ENDPOINTS.map(endpoint => 
    http(endpoint.url, {
      timeout: endpoint.timeout,
      retryCount: 3,
      retryDelay: 1000
    })
  )
);

// Create public client with fallback
export const publicClient = createPublicClient({
  chain: apeChain,
  transport,
});

// Adaptive block limit based on RPC performance
class BlockLimitOptimizer {
  private successRates = new Map<string, { success: number; total: number }>();
  private currentLimits = new Map<string, number>();
  
  getOptimalLimit(): number {
    // Find the best performing endpoint
    let bestLimit = 9000; // Conservative default
    
    for (const endpoint of RPC_ENDPOINTS) {
      const stats = this.successRates.get(endpoint.name);
      if (stats && stats.total > 10) {
        const successRate = stats.success / stats.total;
        if (successRate > 0.9) {
          bestLimit = Math.max(bestLimit, endpoint.blockLimit);
        }
      }
    }
    
    return Math.min(bestLimit, 50000); // Cap at 50k for safety
  }
  
  recordResult(endpoint: string, success: boolean, blockCount: number): void {
    const stats = this.successRates.get(endpoint) || { success: 0, total: 0 };
    stats.total++;
    if (success) stats.success++;
    this.successRates.set(endpoint, stats);
  }
}

const blockLimitOptimizer = new BlockLimitOptimizer();

export function getOptimalBlockLimit(): number {
  return blockLimitOptimizer.getOptimalLimit();
}

// Comprehensive RPC health monitoring
export async function testRPCHealth(url: string): Promise<{
  healthy: boolean;
  latency: number;
  blockNumber?: bigint;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const testClient = createPublicClient({
      chain: apeChain,
      transport: http(url, { timeout: 5000 }),
    });
    
    const blockNumber = await testClient.getBlockNumber();
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      latency,
      blockNumber
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get best available RPC endpoint with comprehensive health check
export async function getBestRPC(): Promise<{
  url: string;
  blockLimit: number;
  name: string;
  latency: number;
}> {
  const healthChecks = await Promise.all(
    RPC_ENDPOINTS.map(async endpoint => ({
      ...endpoint,
      health: await testRPCHealth(endpoint.url)
    }))
  );
  
  // Find the best healthy endpoint (lowest latency)
  const healthyEndpoints = healthChecks
    .filter(endpoint => endpoint.health.healthy)
    .sort((a, b) => a.health.latency - b.health.latency);
  
  if (healthyEndpoints.length === 0) {
    // All endpoints are down, return first as fallback
    const fallback = RPC_ENDPOINTS[0];
    return {
      url: fallback.url,
      blockLimit: fallback.blockLimit,
      name: fallback.name,
      latency: Infinity
    };
  }
  
  const best = healthyEndpoints[0];
  return {
    url: best.url,
    blockLimit: best.blockLimit,
    name: best.name,
    latency: best.health.latency
  };
}

// Export for monitoring
export function getRPCStats() {
  return {
    endpoints: RPC_ENDPOINTS.length,
    hasAlchemy: RPC_ENDPOINTS.some(e => e.name === 'Alchemy'),
    optimalBlockLimit: getOptimalBlockLimit()
  };
}