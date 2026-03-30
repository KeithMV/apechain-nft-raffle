/**
 * UNIFIED RPC CONFIGURATION
 * Single source of truth for all RPC endpoints
 * Replaces scattered RPC configs throughout the codebase
 */

import { config as envConfig } from './environment';

export interface RPCEndpoint {
  url: string;
  name: string;
  priority: number;
  isHealthy: boolean;
  failureCount: number;
}

/**
 * Get Alchemy RPC URL for Polygon
 */
function getAlchemyPolygonURL(): string | null {
  const apiKey = process.env.REACT_APP_ALCHEMY_API_KEY;
  console.log('🔑 [ALCHEMY] API Key check:', {
    present: !!apiKey,
    length: apiKey?.length || 0,
    value: apiKey ? `${apiKey.substring(0, 6)}...` : 'undefined'
  });
  
  if (!apiKey || apiKey.length < 15) {
    console.warn('⚠️ [ALCHEMY] API key missing or too short, using public RPC');
    return null;
  }
  
  const url = `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;
  console.log('✅ [ALCHEMY] Using Alchemy RPC for Polygon');
  return url;
}

/**
 * Get CORS-friendly public RPC URL for Polygon
 */
function getPublicPolygonURL(): string {
  return 'https://polygon-rpc.com';
}

/**
 * ApeChain RPC Configuration
 */
export const APECHAIN_RPC: RPCEndpoint[] = [
  {
    url: envConfig.rpcUrl,
    name: 'ApeChain Primary',
    priority: 1,
    isHealthy: true,
    failureCount: 0,
  },
  {
    url: 'https://rpc.apechain.com',
    name: 'ApeChain Backup',
    priority: 2,
    isHealthy: true,
    failureCount: 0,
  },
];

/**
 * Polygon RPC Configuration - Alchemy first, then public fallback
 * Prioritizes Alchemy for reliability when API key is available
 */
export const POLYGON_RPC: RPCEndpoint[] = (() => {
  const alchemyURL = getAlchemyPolygonURL();
  const publicURL = getPublicPolygonURL();
  
  const endpoints: RPCEndpoint[] = [];
  
  // Use Alchemy as primary if available
  if (alchemyURL) {
    endpoints.push({
      url: alchemyURL,
      name: 'Alchemy Polygon (Primary)',
      priority: 1,
      isHealthy: true,
      failureCount: 0,
    });
  }
  
  // Add public RPC as fallback
  endpoints.push({
    url: publicURL,
    name: 'Polygon Public (Fallback)',
    priority: alchemyURL ? 2 : 1,
    isHealthy: true,
    failureCount: 0,
  });
  
  return endpoints;
})();

/**
 * Get RPC endpoints for a chain
 */
export function getRPCEndpoints(chainId: number): RPCEndpoint[] {
  switch (chainId) {
    case 33139: // ApeChain
      return APECHAIN_RPC;
    case 137: // Polygon
      return POLYGON_RPC;
    default:
      console.warn(`Unknown chain ID: ${chainId}, using ApeChain endpoints`);
      return APECHAIN_RPC;
  }
}

/**
 * Get primary RPC URL for a chain
 */
export function getPrimaryRPCURL(chainId: number): string {
  const endpoints = getRPCEndpoints(chainId);
  const healthy = endpoints.find(ep => ep.isHealthy);
  return healthy?.url || endpoints[0].url;
}

/**
 * Get all RPC URLs for a chain (for wagmi config)
 */
export function getAllRPCURLs(chainId: number): string[] {
  return getRPCEndpoints(chainId).map(ep => ep.url);
}

/**
 * Debug info
 */
export function logRPCConfig() {
  console.log('🔧 [RPC CONFIG] Current configuration:');
  console.log('  ApeChain:', APECHAIN_RPC.map(ep => ep.url));
  console.log('  Polygon:', POLYGON_RPC.map(ep => ep.url));
  console.log('  Alchemy API Key:', process.env.REACT_APP_ALCHEMY_API_KEY ? 'Present' : 'Missing');
}