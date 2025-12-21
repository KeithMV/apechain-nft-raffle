// Simplified Image Proxy Service - Best of both worlds
export class SimpleImageProxy {
  private static readonly PROXY_URL = 'https://images.weserv.nl/?url=';
  
  private static readonly IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ];

  static getImageUrl(originalUrl: string): string {
    if (!originalUrl) return '/placeholder-nft.svg';
    
    try {
      // Handle IPFS URLs
      if (originalUrl.startsWith('ipfs://')) {
        const path = originalUrl.slice(7);
        const directUrl = `${this.IPFS_GATEWAYS[0]}${path}`;
        // Use proxy to bypass CORS
        return `${this.PROXY_URL}${encodeURIComponent(directUrl)}`;
      }
      
      // Regular URLs through proxy
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
      // Try each gateway through proxy
      this.IPFS_GATEWAYS.forEach(gateway => {
        const directUrl = `${gateway}${path}`;
        urls.push(`${this.PROXY_URL}${encodeURIComponent(directUrl)}`);
      });
    } else {
      urls.push(`${this.PROXY_URL}${encodeURIComponent(originalUrl)}`);
    }
    
    urls.push('/placeholder-nft.svg');
    return urls;
  }
}