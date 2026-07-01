/**
 * NFT Metadata Hook
 * Professional React Query-based hook for NFT metadata fetching with proper caching and deduplication
 */

import { usePublicClient, useChainId } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { OptimizedCache } from '../utils/performance';
import { sanitizeString, validateAddress } from '../utils/security';
import { useMemo } from 'react';

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  imageAlternatives?: string[];
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// Optimized cache for NFT metadata
const metadataCache = new OptimizedCache<NFTMetadata>({ 
  maxSize: 5 * 1024 * 1024, 
  maxItems: 500, 
  ttl: 900000 
}); // 5MB, 500 items, 15min TTL

// PHASE 1: Persistent localStorage cache for NFT metadata
const PERSISTENT_CACHE_PREFIX = 'nft_metadata_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedMetadata {
  data: NFTMetadata;
  timestamp: number;
  source: string;
}

function getPersistentCache(contractAddress: string, tokenId: string): CachedMetadata | null {
  try {
    const cacheKey = `${PERSISTENT_CACHE_PREFIX}${contractAddress.toLowerCase()}_${tokenId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const parsed: CachedMetadata = JSON.parse(cached);
    
    // Check if cache is still valid (24 hours)
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.warn('Failed to read persistent cache:', error);
    return null;
  }
}

function setPersistentCache(contractAddress: string, tokenId: string, metadata: NFTMetadata, source: string): void {
  try {
    const cacheKey = `${PERSISTENT_CACHE_PREFIX}${contractAddress.toLowerCase()}_${tokenId}`;
    const cacheData: CachedMetadata = {
      data: metadata,
      timestamp: Date.now(),
      source
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to write persistent cache:', error);
  }
}

function validateMetadataUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }

  try {
    // Handle data URLs
    if (url.startsWith('data:image/')) {
      return { valid: true };
    }
    
    const parsed = new URL(url);
    // Allow HTTPS, IPFS, and Arweave protocols
    if (!['https:', 'ipfs:', 'ar:'].includes(parsed.protocol)) {
      return { valid: false, error: `Unsupported protocol: ${parsed.protocol}. Only HTTPS, IPFS, and Arweave are allowed` };
    }
    
    // Skip hostname checks for non-HTTP protocols
    if (parsed.protocol !== 'https:') {
      return { valid: true };
    }
    
    // Block private/local networks for HTTPS
    if (parsed.hostname === 'localhost' || 
        parsed.hostname.startsWith('127.') ||
        parsed.hostname.startsWith('192.168.') ||
        parsed.hostname.startsWith('10.') ||
        parsed.hostname.includes('169.254.')) {
      return { valid: false, error: `Private/local network access blocked: ${parsed.hostname}` };
    }
    
    return { valid: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid URL format';
    return { valid: false, error: `URL parsing failed: ${errorMessage}` };
  }
}

function sanitizeMetadata(data: any): { metadata?: NFTMetadata; error?: string } {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid metadata format: must be a valid JSON object' };
  }
  
  try {
    const metadata: NFTMetadata = {
      name: typeof data.name === 'string' ? sanitizeString(data.name) : undefined,
      description: typeof data.description === 'string' ? sanitizeString(data.description) : undefined,
      image: typeof data.image === 'string' ? data.image.slice(0, 500) : undefined,
      attributes: Array.isArray(data.attributes) ? 
        data.attributes.slice(0, 50).map((attr: any) => ({
          trait_type: typeof attr.trait_type === 'string' ? sanitizeString(attr.trait_type) : '',
          value: typeof attr.value === 'string' || typeof attr.value === 'number' ? 
            sanitizeString(String(attr.value)) : ''
        })) : undefined
    };
    
    return { metadata };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sanitization error';
    return { error: `Metadata sanitization failed: ${errorMessage}` };
  }
}

/**
 * PHASE 1: Alchemy NFT API Integration - FIXED
 * Fetch specific NFT metadata from Alchemy API via Lambda function
 */
async function fetchNFTMetadataFromAlchemy(
  contractAddress: string,
  tokenId: string,
  chainId: number
): Promise<{ metadata?: NFTMetadata; error?: string }> {
  // Only support Polygon and ApeChain for now
  if (chainId !== 137 && chainId !== 33139) {
    return { error: 'Alchemy NFT API only supports Polygon (137) and ApeChain (33139)' };
  }
  
  try {
    console.log(`🔍 [ALCHEMY NFT] Fetching metadata for ${contractAddress?.replace(/[\r\n]/g, ' ')}/${tokenId?.replace(/[\r\n]/g, ' ')} on chain ${String(chainId).replace(/[^0-9]/g, '')}`);
    
    // Use environment-aware Lambda proxy for Alchemy NFT API
    const lambdaProxy = process.env.REACT_APP_LAMBDA_PROXY_URL || 'https://aeouvdxxl6.execute-api.us-east-1.amazonaws.com/prod/proxy';
    
    // FIXED: Call Lambda function with contract address and tokenId for specific NFT metadata
    const alchemyUrl = `${lambdaProxy}?contractAddress=${contractAddress}&tokenId=${tokenId}&chainId=${chainId}`;
    
    const response = await fetch(alchemyUrl, {
      signal: AbortSignal.timeout(15000), // Longer timeout for Alchemy
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const alchemyData = await response.json();
    
    // Check if Alchemy returned NFT metadata
    if (!alchemyData.success) {
      return { error: alchemyData.error || 'Alchemy API returned unsuccessful response' };
    }
    
    // Extract metadata from Alchemy response
    const nftData = alchemyData.nft;
    if (!nftData) {
      return { error: `NFT ${tokenId} not found in contract ${contractAddress}` };
    }
    
    // Extract and sanitize metadata from Alchemy response
    const alchemyMetadata = {
      name: nftData.name || nftData.title || nftData.metadata?.name,
      description: nftData.description || nftData.metadata?.description,
      image: nftData.image || nftData.media?.[0]?.gateway || nftData.media?.[0]?.raw || nftData.metadata?.image,
      attributes: nftData.metadata?.attributes || nftData.attributes || []
    };
    
    const sanitized = sanitizeMetadata(alchemyMetadata);
    if (sanitized.metadata) {
      console.log(`✅ [ALCHEMY NFT] Successfully fetched metadata for ${contractAddress?.replace(/[\r\n]/g, ' ')}/${tokenId?.replace(/[\r\n]/g, ' ')}`);
      return { metadata: sanitized.metadata };
    }
    
    return { error: sanitized.error };
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown Alchemy error';
    console.warn(`⚠️ [ALCHEMY NFT] Failed to fetch from Alchemy: ${errorMessage}`);
    return { error: `Alchemy NFT API failed: ${errorMessage}` };
  }
}

/**
 * PHASE 2: Enhanced NFT metadata fetching with Alchemy-first approach
 * Priority: Alchemy API → Blockchain tokenURI → Placeholder
 */
async function fetchNFTMetadata(
  publicClient: any,
  contractAddress: string,
  tokenId: string,
  chainId: number
): Promise<{ metadata?: NFTMetadata; error?: string; source?: string }> {
  // Validate inputs
  if (!contractAddress || !tokenId) {
    return { error: 'Invalid contract address or token ID' };
  }
  
  if (!validateAddress(contractAddress)) {
    return { error: 'Invalid contract address format' };
  }
  
  console.log(`🔍 [NFT METADATA] Fetching metadata for ${contractAddress?.replace(/[\r\n]/g, ' ')}/${tokenId?.replace(/[\r\n]/g, ' ')} on chain ${String(chainId).replace(/[^0-9]/g, '')}`);
  
  // PHASE 2: Try Alchemy first for supported chains
  let alchemyResult: { metadata?: NFTMetadata; error?: string } | undefined;
  
  if (chainId === 137 || chainId === 33139) {
    console.log(`⚡ [NFT METADATA] Trying Alchemy API first...`);
    
    alchemyResult = await fetchNFTMetadataFromAlchemy(contractAddress, tokenId, chainId);
    
    if (alchemyResult.metadata) {
      console.log(`✅ [NFT METADATA] Success via Alchemy API`);
      return { 
        metadata: alchemyResult.metadata, 
        source: 'alchemy' 
      };
    } else {
      console.log(`⚠️ [NFT METADATA] Alchemy failed: ${alchemyResult.error}, trying blockchain fallback...`);
    }
  } else {
    console.log(`ℹ️ [NFT METADATA] Chain ${chainId} not supported by Alchemy, using blockchain method`);
  }
  
  // PHASE 2: Fallback to blockchain method
  console.log(`🔗 [NFT METADATA] Trying blockchain tokenURI method...`);
  
  const blockchainResult = await fetchNFTMetadataFromBlockchain(publicClient, contractAddress, tokenId);
  
  if (blockchainResult.metadata) {
    console.log(`✅ [NFT METADATA] Success via blockchain tokenURI`);
    return { 
      metadata: blockchainResult.metadata, 
      source: 'blockchain' 
    };
  } else {
    console.log(`❌ [NFT METADATA] Both Alchemy and blockchain methods failed`);
    return { 
      error: `All methods failed. Alchemy: ${chainId === 137 || chainId === 33139 ? alchemyResult?.error || 'Unknown error' : 'Not supported'}. Blockchain: ${blockchainResult.error}`,
      source: 'none'
    };
  }
}

/**
 * PHASE 2: Original blockchain metadata fetching (now used as fallback)
 */
async function fetchNFTMetadataFromBlockchain(
  publicClient: any,
  contractAddress: string,
  tokenId: string
): Promise<{ metadata?: NFTMetadata; error?: string }> {
  try {
    console.log(`🔗 [BLOCKCHAIN] Reading tokenURI from contract...`);
    
    // Get tokenURI from contract
    const tokenURI = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: [
        {
          inputs: [{ name: 'tokenId', type: 'uint256' }],
          name: 'tokenURI',
          outputs: [{ name: '', type: 'string' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    });

    if (!tokenURI || typeof tokenURI !== 'string') {
      return { error: 'No token URI found for this NFT' };
    }
    
    console.log(`📋 [BLOCKCHAIN] TokenURI: ${tokenURI?.replace(/[\r\n]/g, ' ').slice(0, 200)}`);
    
    // Validate the token URI
    const urlValidation = validateMetadataUrl(tokenURI);
    if (!urlValidation.valid) {
      return { error: `Invalid token URI: ${urlValidation.error}` };
    }
    
    // Convert IPFS URLs to HTTP
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      const ipfsPath = tokenURI.slice(7);
      metadataUrl = `https://ipfs.io/ipfs/${ipfsPath}`;
      console.log(`🌐 [BLOCKCHAIN] Converted IPFS URL: ${metadataUrl}`);
    }
    
    // Use environment-aware Lambda proxy for metadata fetching
    const lambdaProxy = process.env.REACT_APP_LAMBDA_PROXY_URL || 'https://aeouvdxxl6.execute-api.us-east-1.amazonaws.com/prod/proxy';
    
    const proxiedMetadataUrl = `${lambdaProxy}?url=${encodeURIComponent(metadataUrl)}`;
    
    console.log(`🔄 [BLOCKCHAIN] Fetching metadata via Lambda proxy...`);
    
    try {
      const response = await fetch(proxiedMetadataUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const sanitized = sanitizeMetadata(data);
        if (sanitized.metadata) {
          console.log(`✅ [BLOCKCHAIN] Successfully fetched and sanitized metadata`);
          return { metadata: sanitized.metadata };
        }
        return { error: sanitized.error };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (proxyError) {
      const errorMessage = proxyError instanceof Error ? proxyError.message : 'Network error';
      console.warn(`⚠️ [BLOCKCHAIN] Proxy request failed: ${errorMessage}`);
      return { error: `Failed to fetch metadata: ${errorMessage}` };
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.warn(`❌ [BLOCKCHAIN] Contract read failed: ${errorMessage}`);
    return { error: `Contract read failed: ${errorMessage}` };
  }
}

export function useNFTMetadata(contractAddress: string, tokenId: string) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  
  // PHASE 3: Create dedicated Alchemy client for NFT metadata (worth paying for)
  const alchemyClient = useMemo(() => {
    // For now, just use the regular publicClient until we resolve CI/CD issues
    return publicClient;
  }, [publicClient]);
  
  const { data: result, isLoading: loading, error } = useQuery({
    queryKey: ['nft-metadata', chainId, contractAddress?.toLowerCase(), tokenId, 'v2-hotfix'], // v2-hotfix for Phase 1&2 only
    queryFn: async () => {
      // PHASE 1: Check persistent cache first (24-hour cache)
      const persistentCached = getPersistentCache(contractAddress, tokenId);
      if (persistentCached) {
        console.log(`🎯 [CACHE HIT] Using cached metadata for ${contractAddress}/${tokenId} (${persistentCached.source})`);
        // Also populate in-memory cache for faster subsequent access
        const memoryCacheKey = `${contractAddress?.toLowerCase()}_${tokenId}`;
        metadataCache.set(memoryCacheKey, persistentCached.data);
        return { 
          metadata: persistentCached.data, 
          source: `cached_${persistentCached.source}` 
        };
      }
      
      // Check optimized in-memory cache second
      const memoryCacheKey = `${contractAddress?.toLowerCase()}_${tokenId}`;
      const cached = metadataCache.get(memoryCacheKey);
      if (cached) {
        return { metadata: cached, source: 'memory_cache' };
      }
      
      console.log(`🔄 [CACHE MISS] Fetching fresh metadata for ${contractAddress}/${tokenId}`);
      
      // Use regular client for now (Phase 3 RPC routing temporarily disabled for CI/CD)
      const result = await fetchNFTMetadata(publicClient, contractAddress, tokenId, chainId);
      
      // Cache successful results in both caches
      if (result.metadata && result.source) {
        metadataCache.set(memoryCacheKey, result.metadata);
        setPersistentCache(contractAddress, tokenId, result.metadata, result.source);
      }
      
      return result;
    },
    enabled: !!publicClient && !!contractAddress && !!tokenId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - NFT metadata rarely changes, extended for Phase 1
    gcTime: 48 * 60 * 60 * 1000, // 48 hours - keep in memory much longer
    retry: false, // Disable retries to reduce API calls
    retryDelay: 2000,
    placeholderData: {
      metadata: {
        name: `NFT #${tokenId}`,
        image: '/placeholder-nft.svg',
      }
    },
    // CRITICAL: Prevent excessive requests to avoid rate limiting
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false,
    networkMode: 'online',
  });

  // Handle the structured result with source tracking
  const metadata = result?.metadata || { 
    name: `NFT #${tokenId}`, 
    image: '/placeholder-nft.svg',
    description: result?.error || 'Metadata unavailable'
  };

  // Log successful metadata source for debugging
  if (result?.metadata && result?.source) {
    console.log(`✅ [NFT METADATA] Successfully loaded from ${result?.source?.replace(/[\r\n]/g, ' ')} for ${contractAddress?.replace(/[\r\n]/g, ' ')}/${tokenId?.replace(/[\r\n]/g, ' ')}`);
  }

  return { 
    metadata, 
    loading, 
    error: !!error || !!result?.error,
    errorMessage: result?.error,
    source: result?.source // Track metadata source
  };
}