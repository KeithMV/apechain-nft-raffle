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
  
  console.log(`🔍 Loading NFT metadata for ${contractAddress} #${tokenId}`);
  
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
    console.error(`❌ No token URI found for ${contractAddress} #${tokenId}`);
    throw new Error('No token URI found');
  }
  
  console.log(`📋 Token URI: ${tokenURI}`);

  // Validate tokenURI
  if (!validateUrl(tokenURI)) {
    console.error(`❌ Invalid token URI: ${tokenURI}`);
    throw new Error('Invalid or unsafe token URI');
  }

  // Try multiple proxy services for better reliability
  const proxyServices = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(tokenURI)}`,
    `https://corsproxy.io/?${encodeURIComponent(tokenURI)}`,
    `https://cors-anywhere.herokuapp.com/${tokenURI}`
  ];
  
  let data;
  let proxyError;
  
  // Try each proxy service
  for (const proxyUrl of proxyServices) {
    try {
      console.log(`🌐 Fetching metadata via proxy: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NFT-Raffle-App/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status}`);
      }
      
      if (proxyUrl.includes('allorigins.win')) {
        const proxyData = await response.json();
        if (!proxyData.contents) {
          throw new Error('No content in proxy response');
        }
        data = JSON.parse(proxyData.contents);
      } else {
        // Direct response from other proxies
        const text = await response.text();
        data = JSON.parse(text);
      }
      
      console.log(`✅ Metadata fetched successfully via proxy`);
      break;
      
    } catch (error) {
      console.warn(`⚠️ Proxy failed:`, error);
      proxyError = error;
      continue;
    }
  }
  
  if (!data) {
    console.warn(`⚠️ All proxies failed, trying direct fetch:`, proxyError);
    
    // Fallback to direct fetch for IPFS URLs
    if (tokenURI.startsWith('ipfs://')) {
      const ipfsPath = tokenURI.slice(7);
      const ipfsGateways = [
        'https://cloudflare-ipfs.com/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://dweb.link/ipfs/'
      ];
      
      for (const gateway of ipfsGateways) {
        try {
          const directUrl = `${gateway}${ipfsPath}`;
          console.log(`🔄 Trying IPFS gateway: ${directUrl}`);
          
          const response = await fetch(directUrl, {
            signal: AbortSignal.timeout(8000),
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'public, max-age=3600'
            }
          });
          
          if (response.ok) {
            const text = await response.text();
            data = JSON.parse(text);
            console.log(`✅ IPFS gateway success: ${gateway}`);
            break;
          }
        } catch (err) {
          console.warn(`❌ IPFS gateway failed: ${gateway}`, err);
          continue;
        }
      }
    }
    
    if (!data) {
      throw new Error('All metadata fetch attempts failed');
    }
  }
  
  // Sanitize and validate metadata
  const sanitizedData = sanitizeMetadata(data);
  
  // Process image URL securely
  let imageUrl = sanitizedData.image;
  const imageAlternatives: string[] = [];
  
  if (imageUrl?.startsWith('ipfs://')) {
    const ipfsPath = imageUrl.slice(7);
    const ipfsHash = ipfsPath.split('/')[0];
    // Validate IPFS hash format (support both v0 and v1)
    if (!/^[a-zA-Z0-9]{46,59}$/.test(ipfsHash) && !/^[a-z2-7]{59}$/.test(ipfsHash)) {
      console.warn('Invalid IPFS hash format:', ipfsHash);
      imageUrl = '/placeholder-nft.svg';
    } else {
      // Keep original URL for proxy service to handle
      imageUrl = imageUrl;
    }
  } else if (imageUrl?.startsWith('ar://')) {
    // Arweave URLs
    const arweaveId = imageUrl.slice(5);
    imageUrl = `https://arweave.net/${arweaveId}`;
  } else if (imageUrl?.startsWith('data:image/')) {
    // Data URLs are valid
    // Keep as is
  } else if (imageUrl && !validateUrl(imageUrl)) {
    console.warn('Invalid image URL:', imageUrl);
    imageUrl = '/placeholder-nft.svg';
  }

  const processedMetadata: NFTMetadata = {
    name: sanitizedData.name,
    description: sanitizedData.description,
    image: imageUrl || '/placeholder-nft.svg',
    imageAlternatives,
    attributes: sanitizedData.attributes,
  };

  console.log(`✅ NFT metadata loaded for ${contractAddress} #${tokenId}:`, {
    name: processedMetadata.name,
    image: processedMetadata.image,
    hasAlternatives: imageAlternatives.length > 0
  });
  return processedMetadata;
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
    retry: (failureCount, error) => {
      // Don't retry CORS errors or 404s
      if (error?.message?.includes('CORS') || 
          error?.message?.includes('404') || 
          error?.message?.includes('invalid') ||
          error?.message?.includes('ERR_FAILED')) {
        return false;
      }
      return failureCount < 1; // Reduce retries
    },
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