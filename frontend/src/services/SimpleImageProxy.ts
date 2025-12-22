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
    console.log('🔗 Generating fallback URLs for:', originalUrl);
    
    if (originalUrl.startsWith('ipfs://')) {
      const path = originalUrl.slice(7);
      // Try each gateway through proxy
      this.IPFS_GATEWAYS.forEach((gateway, index) => {
        const directUrl = `${gateway}${path}`;
        const proxiedUrl = `${this.PROXY_URL}${encodeURIComponent(directUrl)}`;
        urls.push(proxiedUrl);
        console.log(`🌐 IPFS Gateway ${index + 1}:`, proxiedUrl);
      });
    } else {
      const proxiedUrl = `${this.PROXY_URL}${encodeURIComponent(originalUrl)}`;
      urls.push(proxiedUrl);
      console.log('🌐 Direct URL:', proxiedUrl);
    }
    
    urls.push('/placeholder-nft.svg');
    console.log('📋 Total URLs generated:', urls.length);
    return urls;
  }
}