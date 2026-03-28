import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useAccount } from 'wagmi';
import { parseAbiItem } from 'viem';
import { useChainConfig } from '../hooks/useChainConfig';
import { useMemo } from 'react';

interface UserNFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  image?: string;
}

// ERC721 Transfer event ABI
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');

async function fetchNFTsViaAPI(
  userAddress: string,
  chainId: number,
  nftConfig: any,
  publicClient: any
): Promise<UserNFT[]> {
  try {
    // Use environment-aware Lambda proxy endpoint
    const lambdaProxy = process.env.REACT_APP_ENV === 'staging' 
      ? 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/staging/proxy'
      : 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy';
    
    // Skip Lambda in development mode only if explicitly disabled
    if (process.env.REACT_APP_ENV === 'development' && process.env.REACT_APP_SKIP_LAMBDA === 'true') {
      console.log('Development mode: Lambda disabled via REACT_APP_SKIP_LAMBDA, using on-chain scanning');
      return [];
    }
    
    const url = `${lambdaProxy}?owner=${encodeURIComponent(userAddress)}&chainId=${chainId}`;
    
    const chainName = chainId === 137 ? 'Polygon' : chainId === 33139 ? 'ApeChain' : `Chain ${chainId}`;
    console.log(`🔍 Fetching NFTs via Lambda proxy for ${chainName} (${chainId})`);
    console.log(`📡 Using endpoint: ${lambdaProxy}`);
    
    // Use centralized timeout configuration
    const timeoutMs = nftConfig.scanTimeout;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(timeoutMs)
    });
    
    if (!response.ok) {
      console.error(`❌ Lambda proxy error for ${chainName}: ${response.status}`);
      throw new Error(`Lambda proxy error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform and verify Lambda response
    const rawNfts = (data.nfts || data.ownedNfts) || [];
    console.log(`🔍 Lambda proxy returned ${rawNfts.length} NFTs for ${chainName}, verifying ownership...`);
    
    const verifiedNfts: UserNFT[] = [];
    
    // Verify ownership for each NFT returned by Lambda
    for (let i = 0; i < rawNfts.length; i++) {
      const nft = rawNfts[i];
      
      if (!nft.contractAddress || !nft.tokenId) continue;
      
      try {
        // Verify ownership on-chain
        if (!publicClient) continue;
        
        const owner = await publicClient.readContract({
          address: nft.contractAddress as `0x${string}`,
          abi: [{
            inputs: [{ name: 'tokenId', type: 'uint256' }],
            name: 'ownerOf',
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'ownerOf',
          args: [BigInt(nft.tokenId)]
        });
        
        // Only include if user actually owns it
        if (owner?.toLowerCase() === userAddress.toLowerCase()) {
          // Only log first few verified NFTs to avoid spam
          if (verifiedNfts.length < 3) {
            console.log(`✅ Verified NFT ownership on ${chainName}:`, {
              contract: nft.contractAddress,
              tokenId: nft.tokenId,
              name: nft.name,
              hasImage: !!nft.image
            });
          }
          
          verifiedNfts.push({
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            name: nft.name || `NFT #${nft.tokenId}`,
            image: nft.image
          });
        }
      } catch (error) {
        // Skip NFTs that fail ownership verification
        continue;
      }
    }
    
    console.log(`✅ Lambda proxy result for ${chainName}: ${rawNfts.length} raw NFTs → ${verifiedNfts.length} verified owned NFTs`);
    return verifiedNfts;
    
  } catch (error) {
    const chainName = chainId === 137 ? 'Polygon' : chainId === 33139 ? 'ApeChain' : `Chain ${chainId}`;
    console.error(`💥 Lambda proxy failed for ${chainName}:`, error);
    return [];
  }
}

// On-chain NFT fetching with centralized configuration
async function fetchNFTsOnChain(
  publicClient: any,
  userAddress: string,
  chainId: number,
  nftConfig: any
): Promise<UserNFT[]> {
  if (!publicClient || !userAddress) return [];

  try {
    const currentBlock = await publicClient.getBlockNumber();
    const chainName = chainId === 137 ? 'Polygon' : chainId === 33139 ? 'ApeChain' : `Chain ${chainId}`;
    
    // Use centralized NFT configuration
    const chunkSize = nftConfig.chunkSize;
    const maxChunks = nftConfig.maxChunks;
    const targetCount = nftConfig.targetCount;
    
    const allNFTs = new Map<string, UserNFT>();
    let chunksScanned = 0;
    
    console.log(`🔍 Starting on-chain NFT scan for ${chainName} with ${chunkSize.toString()} block chunks`);
    
    // Scan in reverse chronological order (recent first)
    for (let toBlock = currentBlock; toBlock > 0n && chunksScanned < maxChunks; toBlock -= chunkSize) {
      const fromBlock = toBlock > chunkSize ? toBlock - chunkSize : 0n;
      
      console.log(`Scanning chunk ${chunksScanned + 1}/${maxChunks}: blocks ${fromBlock} to ${toBlock}`);
      
      try {
        const logs = await publicClient.getLogs({
          event: TRANSFER_EVENT,
          args: {
            to: userAddress as `0x${string}`
          },
          fromBlock,
          toBlock
        });
        
        // Add found NFTs to map
        for (const log of logs) {
          const contractAddress = log.address;
          const tokenId = log.args.tokenId?.toString();
          
          if (contractAddress && tokenId) {
            const key = `${contractAddress}-${tokenId}`;
            if (!allNFTs.has(key)) {
              allNFTs.set(key, {
                contractAddress,
                tokenId,
                name: `NFT #${tokenId}`
              });
            }
          }
        }
        
        chunksScanned++;
        
        // Use centralized early exit configuration
        if (allNFTs.size >= targetCount) {
          console.log(`Found ${allNFTs.size} NFTs, stopping scan for ${chainName}`);
          break;
        }
        
      } catch (chunkError) {
        console.warn(`Chunk ${chunksScanned + 1} failed, continuing:`, chunkError);
        chunksScanned++;
        continue;
      }
    }

    console.log(`Scan complete: ${allNFTs.size} unique NFTs found from ${chunksScanned} chunks`);

    // Verify ownership for found NFTs
    const ownedNFTs: UserNFT[] = [];
    const nftsToCheck = Array.from(allNFTs.values()).slice(0, targetCount);
    
    for (const nft of nftsToCheck) {
      try {
        const owner = await publicClient.readContract({
          address: nft.contractAddress as `0x${string}`,
          abi: [{
            inputs: [{ name: 'tokenId', type: 'uint256' }],
            name: 'ownerOf',
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'ownerOf',
          args: [BigInt(nft.tokenId)]
        });
        
        if (owner?.toLowerCase() === userAddress.toLowerCase()) {
          ownedNFTs.push(nft);
        }
      } catch (error) {
        continue;
      }
    }

    return ownedNFTs;
    
  } catch (error) {
    console.error('On-chain NFT fetch failed:', error);
    return [];
  }
}

async function fetchUserNFTs(
  publicClient: any,
  userAddress: string,
  chainId: number,
  nftConfig: any
): Promise<UserNFT[]> {
  if (!publicClient || !userAddress) return [];

  try {
    // Try API first (when implemented)
    let nfts = await fetchNFTsViaAPI(userAddress, chainId, nftConfig, publicClient);
    
    // If API fails or returns nothing, use on-chain scanning
    if (nfts.length === 0) {
      nfts = await fetchNFTsOnChain(publicClient, userAddress, chainId, nftConfig);
    }
    
    return nfts;
    
  } catch (error) {
    console.error('Failed to fetch user NFTs:', error);
    return [];
  }
}

export function useUserNFTs(userAddress: string, chainId: number) {
  const publicClient = usePublicClient();
  const { address, isConnected, isConnecting } = useAccount();
  
  // Use centralized NFT configuration
  const { config: chainConfig } = useChainConfig();
  const nftConfig = chainConfig.nft;

  // Apply wallet state management pattern
  const resolvedAddress = useMemo(() => {
    if (!isConnected || isConnecting) return undefined;
    return userAddress || address;
  }, [userAddress, address, isConnected, isConnecting]);

  const { data: nfts = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['user-nfts', resolvedAddress?.toLowerCase(), chainId],
    queryFn: () => fetchUserNFTs(publicClient, resolvedAddress!, chainId, nftConfig),
    enabled: Boolean(resolvedAddress && chainId && publicClient && isConnected && !isConnecting),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    nfts,
    loading,
    error: !!error,
    refetch
  };
}