/**
 * Multi-Chain RPC Manager
 * Handles RPC failover, rate limiting, and chain-specific optimizations
 */

import { createPublicClient, http, fallback, PublicClient } from 'viem';
import { polygon, mainnet } from 'viem/chains';
import { apeChain } from './wagmi';

interface RpcEndpoint {
  url: string;
  priority: number;
  rateLimit?: number;
}

const POLYGON_RPCS: RpcEndpoint[] = [
  { url: 'https://polygon-mainnet.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78', priority: 1 },
  { url: 'https://polygon-rpc.com', priority: 2 },
  { url: 'https://rpc.ankr.com/polygon', priority: 3 },
  { url: 'https://polygon.llamarpc.com', priority: 4 },
  { url: 'https://polygon-mainnet.public.blastapi.io', priority: 5 },
  { url: 'https://polygon.blockpi.network/v1/rpc/public', priority: 6 },
];

const APECHAIN_RPCS: RpcEndpoint[] = [
  { url: 'https://apechain.calderachain.xyz/http', priority: 1 },
  { url: 'https://rpc.apechain.com', priority: 2 },
];

class ChainRpcManager {
  private clients: Map<number, PublicClient> = new Map();
  private failedRpcs: Set<string> = new Set();
  private lastRequestTime: Map<string, number> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Polygon client with fallback
    const polygonTransports = POLYGON_RPCS
      .filter(rpc => !this.failedRpcs.has(rpc.url))
      .map(rpc => http(rpc.url, {
        timeout: 10000,
        retryCount: 2,
        retryDelay: 1000,
      }));

    this.clients.set(137, createPublicClient({
      chain: polygon,
      transport: fallback(polygonTransports, {
        rank: false, // Use order priority
      }),
      batch: {
        multicall: {
          batchSize: 1024 * 200,
          wait: 32,
        },
      },
      pollingInterval: 15000,
    }));

    // ApeChain client
    const apechainTransports = APECHAIN_RPCS
      .filter(rpc => !this.failedRpcs.has(rpc.url))
      .map(rpc => http(rpc.url, {
        timeout: 8000,
        retryCount: 2,
        retryDelay: 1000,
      }));

    this.clients.set(33139, createPublicClient({
      chain: apeChain,
      transport: fallback(apechainTransports, {
        rank: false,
      }),
      batch: {
        multicall: {
          batchSize: 1024 * 100,
          wait: 16,
        },
      },
      pollingInterval: 8000,
    }));
  }

  getClient(chainId: number): PublicClient | null {
    return this.clients.get(chainId) || null;
  }

  markRpcFailed(rpcUrl: string) {
    this.failedRpcs.add(rpcUrl);
    // Reinitialize clients after marking RPC as failed
    setTimeout(() => {
      this.failedRpcs.delete(rpcUrl);
      this.initializeClients();
    }, 60000); // Retry failed RPC after 1 minute
  }

  isRateLimited(rpcUrl: string): boolean {
    const lastRequest = this.lastRequestTime.get(rpcUrl);
    if (!lastRequest) return false;
    
    // Implement basic rate limiting (1 request per second per RPC)
    return Date.now() - lastRequest < 1000;
  }

  recordRequest(rpcUrl: string) {
    this.lastRequestTime.set(rpcUrl, Date.now());
  }
}

export const rpcManager = new ChainRpcManager();

// Export chain-specific clients
export const getPolygonClient = () => rpcManager.getClient(137);
export const getApeChainClient = () => rpcManager.getClient(33139);