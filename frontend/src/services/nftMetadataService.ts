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

      // Handle IPFS URLs with fallback gateways
      let metadataUrl = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsHash = tokenURI.replace('ipfs://', '');
        metadataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      }

      // Fetch metadata with fallback
      const metadata = await this.fetchWithFallback(metadataUrl);
      if (!metadata) return null;
      
      // Handle IPFS image URLs
      if (metadata.image?.startsWith('ipfs://')) {
        const ipfsHash = metadata.image.replace('ipfs://', '');
        metadata.image = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      }

      this.metadataCache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error('Failed to fetch NFT metadata:', error);
      return null;
    }
  }

  private async fetchWithFallback(url: string): Promise<NFTMetadata | null> {
    const gateways = [
      url,
      url.replace('gateway.pinata.cloud', 'ipfs.io'),
      url.replace('gateway.pinata.cloud', 'cloudflare-ipfs.com')
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000)
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }
}

export const nftMetadataService = new NFTMetadataService();