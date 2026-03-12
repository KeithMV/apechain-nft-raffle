// Simplified Image Proxy Service - Best of both worlds
export class SimpleImageProxy {
  private static readonly PROXY_URL = 'https://images.weserv.nl/?url=';
  
  private static readonly IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/'
  ];

  static getImageUrl(originalUrl: string): string {
    if (!originalUrl) return '/placeholder-nft.svg';
    
    try {
      // Handle IPFS URLs - try direct IPFS gateway first
      if (originalUrl.startsWith('ipfs://')) {
        const path = originalUrl.slice(7);
        const directUrl = `${this.IPFS_GATEWAYS[0]}${path}`;
        return directUrl; // Return direct IPFS, fallback will handle failures
      }
      
      // For trusted domains, try direct first
      if (originalUrl.includes('img.op.xyz') || originalUrl.includes('img.other.page') || originalUrl.includes('nft-cdn.alchemy.com')) {
        return originalUrl;
      }
      
      // For other URLs, use external proxy
      return `${this.PROXY_URL}${encodeURIComponent(originalUrl)}`;
      
    } catch {
      return '/placeholder-nft.svg';
    }
  }

  static getFallbackUrls(originalUrl: string): string[] {
    if (!originalUrl) return ['/placeholder-nft.svg'];
    
    const urls: string[] = [];
    
    if (originalUrl.startsWith('ipfs://')) {
      const path = originalUrl.slice(7);
      // Try direct IPFS gateways first (faster)
      this.IPFS_GATEWAYS.forEach((gateway) => {
        const directUrl = `${gateway}${path}`;
        urls.push(directUrl);
      });
      
      // Then try Lambda proxy as fallback
      const lambdaProxy = 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy';
      this.IPFS_GATEWAYS.forEach((gateway) => {
        const directUrl = `${gateway}${path}`;
        urls.push(`${lambdaProxy}?url=${encodeURIComponent(directUrl)}`);
      });
    } else if (originalUrl.startsWith('http')) {
      // For HTTP URLs, try direct first if it's a trusted domain
      if (originalUrl.includes('img.op.xyz') || originalUrl.includes('img.other.page') || originalUrl.includes('nft-cdn.alchemy.com')) {
        urls.push(originalUrl);
      }
      
      // Try Lambda proxy
      const lambdaProxy = 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy';
      urls.push(`${lambdaProxy}?url=${encodeURIComponent(originalUrl)}`);
      
      // Try external proxy as final fallback
      const proxiedUrl = `${this.PROXY_URL}${encodeURIComponent(originalUrl)}`;
      urls.push(proxiedUrl);
    }
    
    // Always end with placeholder
    urls.push('/placeholder-nft.svg');
    return [...new Set(urls)]; // Remove duplicates
  }
}