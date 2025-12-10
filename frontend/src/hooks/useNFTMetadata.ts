/**
 * NFT Metadata Hook
 * Professional React Query-based hook for NFT metadata fetching with proper caching and deduplication
 */

import { usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';

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

async function fetchNFTMetadata(
  publicClient: any,
  contractAddress: string,
  tokenId: string
): Promise<NFTMetadata> {
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

  if (!tokenURI) {
    throw new Error('No token URI found');
  }

  // Handle IPFS URLs with fallback gateways
  let metadataUrl = tokenURI;
  const ipfsGateways = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://ipfs.io/ipfs/'
  ];
  
  let data;
  if (tokenURI.startsWith('ipfs://')) {
    const ipfsHash = tokenURI.slice(7);
    
    // Try multiple IPFS gateways
    for (const gateway of ipfsGateways) {
      try {
        metadataUrl = `${gateway}${ipfsHash}`;
        const response = await fetch(metadataUrl, { 
          signal: AbortSignal.timeout(10000)
        });
        if (response.ok) {
          data = await response.json();
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
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    data = await response.json();
  }
  
  // Process image URL
  let imageUrl = data.image;
  const imageAlternatives: string[] = [];
  
  if (imageUrl?.startsWith('ipfs://')) {
    const ipfsHash = imageUrl.slice(7);
    imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    
    imageAlternatives.push(
      `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      `https://dweb.link/ipfs/${ipfsHash}`
    );
  }

  const processedMetadata: NFTMetadata = {
    name: data.name,
    description: data.description,
    image: imageUrl,
    imageAlternatives,
    attributes: data.attributes,
  };

  console.log('NFT metadata loaded:', processedMetadata);
  return processedMetadata;
}

export function useNFTMetadata(contractAddress: string, tokenId: string) {
  const publicClient = usePublicClient();
  
  const { data: metadata, isLoading: loading, error } = useQuery({
    queryKey: ['nft-metadata', contractAddress, tokenId],
    queryFn: () => fetchNFTMetadata(publicClient, contractAddress, tokenId),
    enabled: !!publicClient && !!contractAddress && !!tokenId,
    staleTime: 15 * 60 * 1000, // 15 minutes - longer cache for NFT metadata
    gcTime: 60 * 60 * 1000, // 1 hour - keep in memory longer
    retry: (failureCount, error) => {
      // Don't retry on 404s or invalid contracts
      if (error?.message?.includes('404') || error?.message?.includes('invalid')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    placeholderData: {
      name: `NFT #${tokenId}`,
      image: '/placeholder-nft.svg',
    },
    // Use background refetch for better UX
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  return { 
    metadata: metadata || { name: `NFT #${tokenId}`, image: '/placeholder-nft.svg' }, 
    loading, 
    error: !!error 
  };
}