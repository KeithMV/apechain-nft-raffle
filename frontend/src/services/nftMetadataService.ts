import { PublicClient } from 'viem';

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
}

class NFTMetadataService {
  private metadataCache = new Map<string, NFTMetadata>();

  async getNFTMetadata(
    publicClient: PublicClient,
    contractAddress: string,
    tokenId: string
  ): Promise<NFTMetadata | null> {
    const cacheKey = `${contractAddress}-${tokenId}`;
    
    if (this.metadataCache.has(cacheKey)) {
      return this.metadataCache.get(cacheKey)!;
    }

    try {
      // Get tokenURI from contract
      const tokenURI = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            name: 'tokenURI',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'tokenId', type: 'uint256' }],
            outputs: [{ name: '', type: 'string' }]
          }
        ],
        functionName: 'tokenURI',
        args: [BigInt(tokenId)]
      }) as string;

      if (!tokenURI) return null;

      // Handle IPFS URLs
      let metadataUrl = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        metadataUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      // Fetch metadata
      const response = await fetch(metadataUrl);
      if (!response.ok) return null;

      const metadata: NFTMetadata = await response.json();
      
      // Handle IPFS image URLs
      if (metadata.image?.startsWith('ipfs://')) {
        metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      this.metadataCache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error('Failed to fetch NFT metadata:', error);
      return null;
    }
  }
}

export const nftMetadataService = new NFTMetadataService();