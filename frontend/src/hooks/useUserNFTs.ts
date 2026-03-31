import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useAccount } from 'wagmi';
import { parseAbiItem } from 'viem';

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
    
    // Use centralized timeout configuration - reduced for faster response
    const timeoutMs = 8000; // 8 seconds max
    
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
    
    // Transform and verify Lambda response - limit to first 20 NFTs
    const rawNfts = ((data.nfts || data.ownedNfts) || []).slice(0, 20);
    console.log(`🔍 Lambda proxy returned ${rawNfts.length} NFTs for ${chainName}`);
    
    const verifiedNfts: UserNFT[] = [];
    const verificationSet = new Set<string>();
    
    // Verify ownership for first 10 NFTs only to reduce RPC calls
    for (const nft of rawNfts.slice(0, 10)) {
      if (!nft.contractAddress || !nft.tokenId) continue;
      
      const nftKey = `${nft.contractAddress}-${nft.tokenId}`;
      if (verificationSet.has(nftKey)) continue;
      
      try {
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
        
        if (owner?.toLowerCase() === userAddress.toLowerCase()) {
          verificationSet.add(nftKey);
          verifiedNfts.push({
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            name: nft.name || `NFT #${nft.tokenId}`,
            image: nft.image
          });
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log(`✅ Lambda result for ${chainName}: ${rawNfts.length} raw → ${verifiedNfts.length} verified NFTs`);
    return verifiedNfts;
    
  } catch (error) {
    const chainName = chainId === 137 ? 'Polygon' : chainId === 33139 ? 'ApeChain' : `Chain ${chainId}`;
    console.error(`💥 Lambda proxy failed for ${chainName}:`, error);
    return [];
  }
}

// Conservative on-chain NFT fetching to prevent RPC spam
async function fetchNFTsOnChain(
  publicClient: any,
  userAddress: string,
  chainId: number
): Promise<UserNFT[]> {
  if (!publicClient || !userAddress) return [];

  try {
    const currentBlock = await publicClient.getBlockNumber();
    const chainName = chainId === 137 ? 'Polygon' : chainId === 33139 ? 'ApeChain' : `Chain ${chainId}`;
    
    // Conservative settings to prevent RPC spam
    const chunkSize = 1000n; // Smaller chunks
    const maxChunks = 3; // Fewer chunks
    const targetCount = 10; // Fewer NFTs
    
    const allNFTs = new Map<string, UserNFT>();
    let chunksScanned = 0;
    
    console.log(`🔍 Conservative NFT scan for ${chainName} (max ${maxChunks} chunks)`);
    
    // Scan recent blocks only
    for (let toBlock = currentBlock; toBlock > 0n && chunksScanned < maxChunks; toBlock -= chunkSize) {
      const fromBlock = toBlock > chunkSize ? toBlock - chunkSize : 0n;
      
      try {
        const logs = await publicClient.getLogs({
          event: TRANSFER_EVENT,
          args: {
            to: userAddress as `0x${string}`
          },
          fromBlock,
          toBlock
        });
        
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
        
        if (allNFTs.size >= targetCount) {
          console.log(`Found ${allNFTs.size} NFTs, stopping scan`);
          break;
        }
        
      } catch (chunkError) {
        console.warn(`Chunk ${chunksScanned + 1} failed:`, chunkError);
        chunksScanned++;
        continue;
      }
    }

    // Verify ownership for found NFTs (limit to 5 to reduce RPC calls)
    const ownedNFTs: UserNFT[] = [];
    const nftsToCheck = Array.from(allNFTs.values()).slice(0, 5);
    
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
    console.error('Conservative NFT scan failed:', error);
    return [];
  }
}

async function fetchUserNFTs(
  publicClient: any,
  userAddress: string,
  chainId: number
): Promise<UserNFT[]> {
  if (!publicClient || !userAddress) return [];

  try {
    // Conservative approach: Try Lambda first with reduced verification
    let nfts = await fetchNFTsViaAPI(userAddress, chainId, publicClient);
    
    // Only fallback to on-chain if Lambda completely fails
    if (nfts.length === 0) {
      console.log(`🔄 Lambda returned no NFTs, trying conservative on-chain scan`);
      nfts = await fetchNFTsOnChain(publicClient, userAddress, chainId);
    }
    
    // Final deduplication
    const deduplicatedNFTs = Array.from(
      new Map(nfts.map(nft => [`${nft.contractAddress}-${nft.tokenId}`, nft])).values()
    );
    
    console.log(`✅ Final NFT result: ${deduplicatedNFTs.length} unique NFTs`);
    return deduplicatedNFTs;
    
  } catch (error) {
    console.error('NFT fetch failed:', error);
    return [];
  }
}

export function useUserNFTs(userAddress: string, chainId: number) {
  const publicClient = usePublicClient();
  const { address, isConnected } = useAccount();
  
  // Re-enabled with conservative limits for free Polygon RPC
  const shouldFetch = Boolean(
    isConnected && 
    address && 
    userAddress && 
    address.toLowerCase() === userAddress.toLowerCase() && 
    chainId && 
    publicClient
  );
  
  const query = useQuery({
    queryKey: ['userNFTs', userAddress, chainId],
    queryFn: () => fetchUserNFTs(publicClient, userAddress, chainId),
    enabled: shouldFetch,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    retryDelay: 10000, // 10s delay
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
  
  return {
    nfts: query.data || [],
    loading: query.isLoading,
    error: query.isError,
    refetch: query.refetch
  };
}