// Enhanced Image Proxy Service - Environment Aware
export class SimpleImageProxy {
  // Environment-aware Lambda proxy endpoint
  private static readonly LAMBDA_PROXY = process.env.REACT_APP_ENV === 'staging' 
    ? 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/staging/proxy'
    : 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy';
  
  private static readonly BACKUP_PROXY = 'https://images.weserv.nl/?url=';
  
  private static readonly IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
  ];

  static getImageUrl(originalUrl: string): string {
    if (!originalUrl) return '/placeholder-nft.svg';
    
    try {
      // Handle IPFS URLs
      if (originalUrl.startsWith('ipfs://')) {
        const path = originalUrl.slice(7);
        const directUrl = `${this.IPFS_GATEWAYS[0]}${path}`;
        // Use Lambda proxy first, then backup
        return `${this.LAMBDA_PROXY}?url=${encodeURIComponent(directUrl)}`;
      }
      
      // Regular URLs through Lambda proxy
      return `${this.LAMBDA_PROXY}?url=${encodeURIComponent(originalUrl)}`;
      
    } catch {
      return '/placeholder-nft.svg';
    }
  }

  static getFallbackUrls(originalUrl: string): string[] {
    if (!originalUrl) return ['/placeholder-nft.svg'];
    
    const urls: string[] = [];
    
    if (originalUrl.startsWith('ipfs://')) {
      const path = originalUrl.slice(7);
      
      // Limit to 3 high-quality IPFS sources for better performance
      urls.push(`${this.LAMBDA_PROXY}?url=${encodeURIComponent(`https://ipfs.io/ipfs/${path}`)}`);
      urls.push(`https://ipfs.io/ipfs/${path}`);
      urls.push(`https://gateway.pinata.cloud/ipfs/${path}`);
      
    } else if (originalUrl.startsWith('http')) {
      // Limit to 2 HTTP sources for better performance
      urls.push(`${this.LAMBDA_PROXY}?url=${encodeURIComponent(originalUrl)}`);
      
      // Only add direct URL for known CORS-enabled sources
      if (originalUrl.includes('img.op.xyz') || 
          originalUrl.includes('arweave.net') ||
          originalUrl.includes('polygon-metadata.s3.amazonaws.com') ||
          originalUrl.includes('assets.polygon.technology')) {
        urls.push(originalUrl);
      }
    }
    
    // Final fallback
    urls.push('/placeholder-nft.svg');
    
    console.log(`🖼️ [PERF] Reduced fallback URLs from 15+ to ${urls.length} for better performance`);
    return urls;
  }

  // Intelligent image preloading for better performance
  static async preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000); // 3 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      img.src = url;
    });
  }

  // Get the best available image URL with preloading
  static async getBestImageUrl(originalUrl: string): Promise<string> {
    const urls = this.getFallbackUrls(originalUrl);
    
    // Try to preload the first 2 URLs in parallel for speed
    const preloadPromises = urls.slice(0, 2).map(async (url) => {
      const success = await this.preloadImage(url);
      return success ? url : null;
    });
    
    const results = await Promise.allSettled(preloadPromises);
    
    // Return the first successful URL
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        console.log('🖼️ [PERF] Preloaded image successfully:', result.value.substring(0, 50) + '...');
        return result.value;
      }
    }
    
    // Fallback to placeholder if all preloads fail
    console.log('🖼️ [PERF] All preloads failed, using placeholder');
    return '/placeholder-nft.svg';
  }
}