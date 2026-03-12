/**
 * NFT Metadata Hook
 * Professional React Query-based hook for NFT metadata fetching with proper caching and deduplication
 */

import { usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { OptimizedCache } from '../utils/performance';
import { SecurityUtils } from '../utils/security';

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
const metadataCache = new OptimizedCache<NFTMetadata>(5 * 1024 * 1024, 500, 900000); // 5MB, 500 items, 15min TTL

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
      name: typeof data.name === 'string' ? SecurityUtils.sanitizeString(data.name, 100) : undefined,
      description: typeof data.description === 'string' ? SecurityUtils.sanitizeString(data.description, 1000) : undefined,
      image: typeof data.image === 'string' ? data.image.slice(0, 500) : undefined,
      attributes: Array.isArray(data.attributes) ? 
        data.attributes.slice(0, 50).map((attr: any) => ({
          trait_type: typeof attr.trait_type === 'string' ? SecurityUtils.sanitizeString(attr.trait_type, 50) : '',
          value: typeof attr.value === 'string' || typeof attr.value === 'number' ? 
            SecurityUtils.sanitizeString(String(attr.value), 100) : ''
        })) : undefined
    };
    
    return { metadata };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sanitization error';
    return { error: `Metadata sanitization failed: ${errorMessage}` };
  }
}

async function fetchNFTMetadata(
  publicClient: any,
  contractAddress: string,
  tokenId: string
): Promise<{ metadata?: NFTMetadata; error?: string }> {
  // Validate inputs
  if (!contractAddress || !tokenId) {
    return { error: 'Invalid contract address or token ID' };
  }
  
  if (!SecurityUtils.validateAddress(contractAddress)) {
    return { error: 'Invalid contract address format' };
  }
  
  try {
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
    
    // Validate the token URI
    const urlValidation = validateMetadataUrl(tokenURI);
    if (!urlValidation.valid) {
      return { error: `Invalid token URI: ${urlValidation.error}` };
    }
    
    // Try multiple approaches for metadata URL
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      // Try proxy service for IPFS metadata
      const ipfsPath = tokenURI.slice(7);
      metadataUrl = `https://ipfs.io/ipfs/${ipfsPath}`;
    }
    
    // Try direct fetch first (faster), then Lambda proxy as fallback
    let data;
    try {
      // Try direct fetch first
      const response = await fetch(metadataUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (directError) {
      // Fallback to Lambda proxy if direct fetch fails
      try {
        const lambdaProxy = 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy';
        const proxiedMetadataUrl = `${lambdaProxy}?url=${encodeURIComponent(metadataUrl)}`;
        
        const response = await fetch(proxiedMetadataUrl, {
          signal: AbortSignal.timeout(5000),
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (proxyError) {
        const errorMessage = proxyError instanceof Error ? proxyError.message : 'Network error';
        return { error: `Failed to fetch metadata: ${errorMessage}` };
      }
    }
    
    const sanitized = sanitizeMetadata(data);
    if (sanitized.error) {
      return { error: sanitized.error };
    }
    
    return { metadata: sanitized.metadata };
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Contract read failed: ${errorMessage}` };
  }
}

export function useNFTMetadata(contractAddress: string, tokenId: string) {
  const publicClient = usePublicClient();
  
  const { data: result, isLoading: loading, error } = useQuery({
    queryKey: ['nft-metadata', contractAddress?.toLowerCase(), tokenId],
    queryFn: async () => {
      // Check optimized cache first
      const cacheKey = `${contractAddress?.toLowerCase()}_${tokenId}`;
      const cached = metadataCache.get(cacheKey);
      if (cached) {
        return { metadata: cached };
      }
      
      const result = await fetchNFTMetadata(publicClient, contractAddress, tokenId);
      
      // Only cache successful results
      if (result.metadata) {
        metadataCache.set(cacheKey, result.metadata);
      }
      
      return result;
    },
    enabled: !!publicClient && !!contractAddress && !!tokenId,
    staleTime: 60 * 60 * 1000, // 1 hour - NFT metadata rarely changes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in memory much longer
    retry: 1, // Try once more on failure
    retryDelay: 2000, // Fixed delay
    placeholderData: {
      metadata: {
        name: `NFT #${tokenId}`,
        image: '/placeholder-nft.svg',
      }
    },
    // Prevent excessive requests
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false,
    networkMode: 'online',
  });

  // Handle the structured result
  const metadata = result?.metadata || { 
    name: `NFT #${tokenId}`, 
    image: '/placeholder-nft.svg',
    description: result?.error || 'Metadata unavailable'
  };

  return { 
    metadata, 
    loading, 
    error: !!error || !!result?.error,
    errorMessage: result?.error
  };
}