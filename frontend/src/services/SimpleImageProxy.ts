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
    
    // Use your working Lambda proxy first (best option)
    const lambdaProxy = 'https://jozcl4cuwoelx73rz72bsvfz440zdjhe.lambda-url.us-east-1.on.aws';
    
    if (originalUrl.startsWith('http') && !originalUrl.includes('localhost')) {
      urls.push(`${lambdaProxy}?url=${encodeURIComponent(originalUrl)}`);
    }
    
    if (originalUrl.startsWith('ipfs://')) {
      const path = originalUrl.slice(7);
      // Try each gateway through your Lambda proxy
      this.IPFS_GATEWAYS.forEach((gateway) => {
        const directUrl = `${gateway}${path}`;
        urls.push(`${lambdaProxy}?url=${encodeURIComponent(directUrl)}`);
        urls.push(directUrl); // Also try direct
      });
    } else {
      // For img.op.xyz and img.other.page, try direct first (they may have CORS headers)
      if (originalUrl.includes('img.op.xyz') || originalUrl.includes('img.other.page')) {
        urls.push(originalUrl);
      }
      
      const proxiedUrl = `${this.PROXY_URL}${encodeURIComponent(originalUrl)}`;
      urls.push(proxiedUrl);
    }
    
    urls.push('/placeholder-nft.svg');
    return urls;
  }
}