/**
 * NFT Metadata Hook
 * Professional React Query-based hook for NFT metadata fetching with proper caching and deduplication
 */

import { usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { OptimizedCache } from '../utils/performance';

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

function validateUrl(url: string): boolean {
  try {
    // Handle data URLs
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    const parsed = new URL(url);
    // Allow HTTPS, IPFS, and Arweave protocols
    if (!['https:', 'ipfs:', 'ar:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Skip hostname checks for non-HTTP protocols
    if (parsed.protocol !== 'https:') {
      return true;
    }
    
    // Block private/local networks for HTTPS
    if (parsed.hostname === 'localhost' || 
        parsed.hostname.startsWith('127.') ||
        parsed.hostname.startsWith('192.168.') ||
        parsed.hostname.startsWith('10.') ||
        parsed.hostname.includes('169.254.')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function sanitizeMetadata(data: any): NFTMetadata {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid metadata format');
  }
  
  return {
    name: typeof data.name === 'string' ? data.name.slice(0, 100) : undefined,
    description: typeof data.description === 'string' ? data.description.slice(0, 1000) : undefined,
    image: typeof data.image === 'string' ? data.image.slice(0, 500) : undefined,
    attributes: Array.isArray(data.attributes) ? 
      data.attributes.slice(0, 50).map((attr: any) => ({
        trait_type: typeof attr.trait_type === 'string' ? attr.trait_type.slice(0, 50) : '',
        value: typeof attr.value === 'string' || typeof attr.value === 'number' ? 
          String(attr.value).slice(0, 100) : ''
      })) : undefined
  };
}

async function fetchNFTMetadata(
  publicClient: any,
  contractAddress: string,
  tokenId: string
): Promise<NFTMetadata> {
  // Validate inputs
  if (!contractAddress || !tokenId) {
    throw new Error('Invalid contract address or token ID');
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
      throw new Error('No token URI found');
    }
    
    // Try multiple approaches for metadata URL
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      // Try proxy service for IPFS metadata
      const ipfsPath = tokenURI.slice(7);
      metadataUrl = `https://ipfs.io/ipfs/${ipfsPath}`;
    }
    
    // Try fetching metadata with multiple attempts
    let data;
    const metadataUrls = [];
    
    if (tokenURI.startsWith('ipfs://')) {
      const path = tokenURI.slice(7);
      metadataUrls.push(
        `https://ipfs.io/ipfs/${path}`,
        `https://cloudflare-ipfs.com/ipfs/${path}`,
        `https://gateway.pinata.cloud/ipfs/${path}`
      );
    } else {
      metadataUrls.push(tokenURI);
    }
    
    // Try each URL until one works
    for (const url of metadataUrls) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(5000),
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          data = await response.json();
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (!data) {
      throw new Error('All metadata URLs failed');
    }
    return sanitizeMetadata(data);
    
  } catch (error) {
    // Return fallback metadata instead of throwing
    return {
      name: `NFT #${tokenId}`,
      image: '/placeholder-nft.svg',
      description: 'Metadata unavailable'
    };
  }
}

export function useNFTMetadata(contractAddress: string, tokenId: string) {
  const publicClient = usePublicClient();
  
  const { data: metadata, isLoading: loading, error } = useQuery({
    queryKey: ['nft-metadata', contractAddress?.toLowerCase(), tokenId],
    queryFn: async () => {
      // Check optimized cache first
      const cacheKey = `${contractAddress?.toLowerCase()}_${tokenId}`;
      const cached = metadataCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      const result = await fetchNFTMetadata(publicClient, contractAddress, tokenId);
      metadataCache.set(cacheKey, result);
      return result;
    },
    enabled: !!publicClient && !!contractAddress && !!tokenId,
    staleTime: 60 * 60 * 1000, // 1 hour - NFT metadata rarely changes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in memory much longer
    retry: false, // Disable retries to reduce console spam
    retryDelay: 2000, // Fixed delay
    placeholderData: {
      name: `NFT #${tokenId}`,
      image: '/placeholder-nft.svg',
    },
    // Prevent excessive requests
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false,
    networkMode: 'online',
  });

  return { 
    metadata: metadata || { name: `NFT #${tokenId}`, image: '/placeholder-nft.svg' }, 
    loading, 
    error: !!error 
  };
}