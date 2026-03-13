import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';

interface UserNFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  image?: string;
}

// ERC721 Transfer event ABI
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');

// API-based NFT fetching via secure Lambda proxy
async function fetchNFTsViaAPI(
  userAddress: string,
  chainId: number
): Promise<UserNFT[]> {
  try {
    // Use Lambda proxy for secure Alchemy API calls
    const lambdaProxy = 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy';
    const url = `${lambdaProxy}?owner=${encodeURIComponent(userAddress)}&chainId=${chainId}`;
    
    console.log(`Fetching NFTs via Lambda proxy for chain ${chainId}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(20000) // 20 second timeout for Lambda
    });
    
    if (!response.ok) {
      throw new Error(`Lambda proxy error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Alchemy response to our format
    const nfts: UserNFT[] = data.ownedNfts?.map((nft: any) => {
      console.log('Processing NFT:', {
        contract: nft.contract?.address,
        tokenId: nft.tokenId,
        title: nft.title,
        name: nft.name,
        hasMedia: !!nft.media?.length,
        hasMetadata: !!nft.metadata
      });
      
      return {
        contractAddress: nft.contract.address,
        tokenId: nft.tokenId,
        name: nft.title || nft.name || `NFT #${nft.tokenId}`,
        image: nft.media?.[0]?.gateway || nft.metadata?.image
      };
    }).filter(nft => nft.contractAddress && nft.tokenId) || [];
    
    console.log(`Lambda proxy: ${data.ownedNfts?.length || 0} raw NFTs, ${nfts.length} processed NFTs`);
    return nfts;
    
  } catch (error) {
    console.error('Lambda proxy failed:', error);
    return [];
  }
}

// On-chain NFT fetching with chunked scanning
async function fetchNFTsOnChain(
  publicClient: any,
  userAddress: string,
  chainId: number
): Promise<UserNFT[]> {
  if (!publicClient || !userAddress) return [];

  try {
    const currentBlock = await publicClient.getBlockNumber();
    const isApeChain = chainId === 33139;
    
    // Use reasonable chunk sizes to avoid timeouts
    const chunkSize = isApeChain ? 100000n : 50000n; // 100k for ApeChain, 50k for others
    const maxChunks = isApeChain ? 10 : 5; // Limit total chunks to prevent endless scanning
    
    const allNFTs = new Map<string, UserNFT>();
    let chunksScanned = 0;
    
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
        
        // If we found enough NFTs, stop scanning
        if (allNFTs.size >= 20) {
          console.log(`Found ${allNFTs.size} NFTs, stopping scan`);
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
    const nftsToCheck = Array.from(allNFTs.values()).slice(0, 20);
    
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
  chainId: number
): Promise<UserNFT[]> {
  if (!publicClient || !userAddress) return [];

  try {
    // Try API first (when implemented)
    let nfts = await fetchNFTsViaAPI(userAddress, chainId);
    
    // If API fails or returns nothing, use on-chain scanning
    if (nfts.length === 0) {
      nfts = await fetchNFTsOnChain(publicClient, userAddress, chainId);
    }
    
    return nfts;
    
  } catch (error) {
    console.error('Failed to fetch user NFTs:', error);
    return [];
  }
}

export function useUserNFTs(userAddress: string, chainId: number) {
  const publicClient = usePublicClient();

  const { data: nfts = [], isLoading: loading, error } = useQuery({
    queryKey: ['user-nfts', userAddress?.toLowerCase(), chainId],
    queryFn: () => fetchUserNFTs(publicClient, userAddress, chainId),
    enabled: !!publicClient && !!userAddress && !!chainId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    nfts,
    loading,
    error: !!error
  };
}