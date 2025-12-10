import { PublicClient } from 'viem';

// Updated NFT metadata service with improved reliability
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
      // Secure error handling - log safely without exposing sensitive data
      console.warn('NFT metadata fetch failed for contract:', contractAddress, 'tokenId:', tokenId);
      if (error instanceof Error) {
        console.warn('Error type:', error.name);
      }
      return null;
    }
  }

  private async fetchWithFallback(url: string): Promise<NFTMetadata | null> {
    // Validate URL to prevent SSRF
    if (!this.isValidMetadataUrl(url)) {
      // Block invalid or unsafe URLs
      return null;
    }
    
    // Build reliable gateway list
    const gateways: string[] = [];
    
    if (url.includes('ipfs')) {
      // IPFS gateways in order of reliability
      gateways.push(
        url,
        url.replace(/https:\/\/[^/]+/, 'https://ipfs.io'),
        url.replace(/https:\/\/[^/]+/, 'https://dweb.link'),
        url.replace(/https:\/\/[^/]+/, 'https://nftstorage.link')
      );
    } else {
      // Only allow trusted domains for direct URLs
      if (this.isTrustedDomain(url)) {
        gateways.push(url);
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
        // Log gateway failure securely and continue
        console.warn('Gateway failed:', new URL(gateway).hostname);
        continue;
      }
    }
    return null;
  }
  
  private isValidMetadataUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTPS and IPFS protocols
      if (!['https:', 'ipfs:'].includes(parsedUrl.protocol)) {
        return false;
      }
      
      // Enhanced security: Block private IP ranges, localhost, and internal networks
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Block localhost variations and loopback
      if (['localhost', '127.0.0.1', '0.0.0.0', '::1', '0:0:0:0:0:0:0:1'].includes(hostname)) {
        return false;
      }
      
      // Block private IP ranges (RFC 1918)
      if (hostname.match(/^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\./)) {
        return false;
      }
      
      // Block link-local addresses (RFC 3927)
      if (hostname.match(/^169\.254\.|^fe80:/)) {
        return false;
      }
      
      // Block multicast addresses
      if (hostname.match(/^224\.|^ff[0-9a-f][0-9a-f]:/)) {
        return false;
      }
      
      // Block additional dangerous ranges
      if (hostname.match(/^0\.|^255\.|^::$/)) {
        return false;
      }
      
      // Block cloud metadata endpoints
      if (hostname.includes('metadata') || hostname.includes('169.254')) {
        return false;
      }
      
      // For IPFS, only allow known safe gateways
      if (parsedUrl.protocol === 'ipfs:') {
        return true; // Will be converted to safe gateway
      }
      
      // For HTTPS, only allow explicitly trusted domains
      const trustedGateways = [
        'ipfs.io', 'dweb.link', 'nftstorage.link', '4everland.io',
        'cloudflare-ipfs.com', 'gateway.pinata.cloud'
      ];
      
      // Strict domain matching - no partial matches to prevent subdomain attacks
      return this.isTrustedDomain(url) || 
             trustedGateways.some(gateway => 
               hostname === gateway || hostname.endsWith('.' + gateway)
             );
    } catch (error) {
      // Secure error handling for URL validation
      console.warn('URL validation failed - invalid format');
      return false;
    }
  }
  
  private isTrustedDomain(url: string): boolean {
    const trustedDomains = [
      'opensea.io', 'api.opensea.io',
      'metadata.ens.domains',
      'api.pudgypenguins.io',
      'boredapeyachtclub.com',
      'mutantapeyachtclub.com'
    ];
    
    try {
      const parsedUrl = new URL(url);
      return trustedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
      );
    } catch (error) {
      // Secure error handling for trusted domain check
      console.warn('Domain validation failed - invalid URL format');
      return false;
    }
  }

  private async validateImageUrl(url: string): Promise<boolean> {
    // Only validate URLs that pass our security checks
    if (!this.isValidMetadataUrl(url)) {
      return false;
    }
    
    try {
      // Only validate known safe domains to prevent SSRF
      const parsedUrl = new URL(url);
      const safeImageDomains = [
        'ipfs.io', 'dweb.link', 'nftstorage.link', '4everland.io',
        'cloudflare-ipfs.com', 'gateway.pinata.cloud',
        'opensea.io', 'api.opensea.io', 'cdn.other.page'
      ];
      
      const isDomainSafe = safeImageDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
      );
      
      if (!isDomainSafe) {
        return false;
      }
      
      // Use HEAD request only for validation, no GET fallback to prevent SSRF
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch (error) {
      // Secure error handling for image validation
      console.warn('Image URL validation failed - network or security error');
      return false;
    }
  }
}

export const nftMetadataService = new NFTMetadataService();