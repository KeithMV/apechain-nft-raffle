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
    const parsed = new URL(url);
    // Only allow HTTPS and IPFS protocols
    if (!['https:', 'ipfs:'].includes(parsed.protocol)) {
      return false;
    }
    // Block private/local networks
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
  
  console.log(`Loading NFT metadata for ${contractAddress} #${tokenId}`);
  
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

  // Validate tokenURI
  if (!validateUrl(tokenURI)) {
    throw new Error('Invalid or unsafe token URI');
  }

  // Handle IPFS URLs with optimized fallback gateways (fastest first)
  let metadataUrl = tokenURI;
  const ipfsGateways = [
    'https://cloudflare-ipfs.com/ipfs/', // Usually fastest
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
    'https://ipfs.io/ipfs/' // Fallback
  ];
  
  let data;
  if (tokenURI.startsWith('ipfs://')) {
    const ipfsHash = tokenURI.slice(7);
    
    // Validate IPFS hash format
    if (!/^[a-zA-Z0-9]{46,59}$/.test(ipfsHash)) {
      throw new Error('Invalid IPFS hash format');
    }
    
    // Try multiple IPFS gateways with timeout optimization
    for (const gateway of ipfsGateways) {
      try {
        metadataUrl = `${gateway}${ipfsHash}`;
        const response = await fetch(metadataUrl, { 
          signal: AbortSignal.timeout(8000), // Reduced timeout
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'NFT-Raffle-App/1.0',
            'Cache-Control': 'public, max-age=3600' // Enable caching
          }
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          const text = await response.text();
          if (text.length > 50000) { // Reduced size limit for faster parsing
            throw new Error('Response too large');
          }
          data = JSON.parse(text);
          break;
        }
      } catch (err) {
        continue;
      }
    }
    
    if (!data) {
      throw new Error('All IPFS gateways failed');
    }
  } else {
    const response = await fetch(metadataUrl, {
      signal: AbortSignal.timeout(8000), // Reduced timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NFT-Raffle-App/1.0',
        'Cache-Control': 'public, max-age=3600' // Enable caching
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Invalid content type');
    }
    const text = await response.text();
    if (text.length > 50000) { // Reduced size limit
      throw new Error('Response too large');
    }
    data = JSON.parse(text);
  }
  
  // Sanitize and validate metadata
  const sanitizedData = sanitizeMetadata(data);
  
  // Process image URL securely
  let imageUrl = sanitizedData.image;
  const imageAlternatives: string[] = [];
  
  if (imageUrl?.startsWith('ipfs://')) {
    const ipfsHash = imageUrl.slice(7);
    // Validate IPFS hash format
    if (!/^[a-zA-Z0-9]{46,59}$/.test(ipfsHash)) {
      imageUrl = '/placeholder-nft.svg';
    } else {
      imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      imageAlternatives.push(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        `https://dweb.link/ipfs/${ipfsHash}`
      );
    }
  } else if (imageUrl && !validateUrl(imageUrl)) {
    imageUrl = '/placeholder-nft.svg';
  }

  const processedMetadata: NFTMetadata = {
    name: sanitizedData.name,
    description: sanitizedData.description,
    image: imageUrl || '/placeholder-nft.svg',
    imageAlternatives,
    attributes: sanitizedData.attributes,
  };

  console.log('NFT metadata loaded:', processedMetadata);
  return processedMetadata;
}

export function useNFTMetadata(contractAddress: string, tokenId: string) {
  const publicClient = usePublicClient();
  
  const { data: metadata, isLoading: loading, error } = useQuery({
    queryKey: ['nft-metadata', contractAddress, tokenId],
    queryFn: async () => {
      // Check optimized cache first
      const cacheKey = `${contractAddress}_${tokenId}`;
      const cached = metadataCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      const result = await fetchNFTMetadata(publicClient, contractAddress, tokenId);
      metadataCache.set(cacheKey, result);
      return result;
    },
    enabled: !!publicClient && !!contractAddress && !!tokenId,
    staleTime: 30 * 60 * 1000, // 30 minutes - longer cache for NFT metadata
    gcTime: 2 * 60 * 60 * 1000, // 2 hours - keep in memory longer
    retry: (failureCount, error) => {
      // Don't retry on 404s or invalid contracts
      if (error?.message?.includes('404') || error?.message?.includes('invalid')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),
    placeholderData: {
      name: `NFT #${tokenId}`,
      image: '/placeholder-nft.svg',
    },
    // Optimize for performance
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  return { 
    metadata: metadata || { name: `NFT #${tokenId}`, image: '/placeholder-nft.svg' }, 
    loading, 
    error: !!error 
  };
}