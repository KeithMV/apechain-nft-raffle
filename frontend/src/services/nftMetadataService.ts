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
        metadataUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      }

      // Fetch metadata with fallback
      const metadata = await this.fetchWithFallback(metadataUrl);
      if (!metadata) return null;
      
      // Handle IPFS image URLs with multiple gateways
      if (metadata.image?.startsWith('ipfs://')) {
        const ipfsHash = metadata.image.replace('ipfs://', '');
        // Try multiple IPFS gateways immediately
        const imageGateways = [
          `https://ipfs.io/ipfs/${ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
          `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
          `https://dweb.link/ipfs/${ipfsHash}`,
          `https://nftstorage.link/ipfs/${ipfsHash}`
        ];
        
        // Use first gateway by default, validation happens in component
        metadata.image = imageGateways[0];
        
        // Store alternative gateways for fallback
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
    const gateways = [
      url,
      url.replace('ipfs.io', 'cloudflare-ipfs.com'),
      url.replace('ipfs.io', 'gateway.pinata.cloud'),
      url.replace('ipfs.io', 'dweb.link')
    ];

    // Add CORS proxy for non-IPFS URLs
    if (!url.includes('ipfs')) {
      gateways.push(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    }

    for (const gateway of gateways) {
      try {
        const isProxy = gateway.includes('allorigins.win');
        const response = await fetch(gateway, { 
          method: 'GET',
          headers: isProxy ? { 'Accept': 'application/json' } : { 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(15000)
        });
        if (response.ok) {
          let data = await response.json();
          
          // Handle CORS proxy response
          if (gateway.includes('allorigins.win') && data.contents) {
            data = JSON.parse(data.contents);
          }
          
          return data;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}:`, error);
        continue;
      }
    }
    return null;
  }

  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      // If HEAD fails, try GET with range to check if it's an image
      try {
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Range': 'bytes=0-1023' },
          signal: AbortSignal.timeout(3000)
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  }
}

export const nftMetadataService = new NFTMetadataService();