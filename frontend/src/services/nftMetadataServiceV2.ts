import { PublicClient } from 'viem';

// NFT metadata service with reliable gateways only
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

      // Handle IPFS URLs with reliable gateway
      let metadataUrl = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsHash = tokenURI.replace('ipfs://', '');
        metadataUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      }

      // Fetch metadata with fallback
      const metadata = await this.fetchWithFallback(metadataUrl);
      if (!metadata) return null;
      
      // Handle IPFS image URLs with reliable gateways
      if (metadata.image?.startsWith('ipfs://')) {
        const ipfsHash = metadata.image.replace('ipfs://', '');
        const imageGateways = [
          `https://ipfs.io/ipfs/${ipfsHash}`,
          `https://dweb.link/ipfs/${ipfsHash}`,
          `https://nftstorage.link/ipfs/${ipfsHash}`,
          `https://4everland.io/ipfs/${ipfsHash}`
        ];
        
        metadata.image = imageGateways[0];
        (metadata as any).imageAlternatives = imageGateways.slice(1);
      }

      this.metadataCache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error('Failed to fetch NFT metadata:', error);
      return null;
    }
  }

  private async fetchWithFallback(url: string): Promise<NFTMetadata | null> {
    // Build comprehensive gateway list for Web3 resilience
    const gateways = [];
    
    if (url.includes('ipfs')) {
      // IPFS gateways in order of reliability
      gateways.push(
        url,
        url.replace(/https:\/\/[^/]+/, 'https://ipfs.io'),
        url.replace(/https:\/\/[^/]+/, 'https://dweb.link'),
        url.replace(/https:\/\/[^/]+/, 'https://nftstorage.link'),
        url.replace(/https:\/\/[^/]+/, 'https://4everland.io')
      );
    } else {
      // For problematic direct URLs, use multiple CORS proxies
      gateways.push(
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      );
      
      // Only try direct URL if it's not a known problematic endpoint
      if (!url.includes('api.op.xyz') && !url.includes('api.other.page')) {
        gateways.unshift(url); // Add direct URL as first option
      }
    }

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}:`, error);
        continue;
      }
    }
    return null;
  }
}

export const nftMetadataService = new NFTMetadataService();