// Enhanced Image Proxy Service - Production Ready
export class SimpleImageProxy {
  private static readonly LAMBDA_PROXY = 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy';
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
      
      // 1. Lambda proxy with different IPFS gateways (PRIMARY)
      this.IPFS_GATEWAYS.forEach((gateway) => {
        const directUrl = `${gateway}${path}`;
        urls.push(`${this.LAMBDA_PROXY}?url=${encodeURIComponent(directUrl)}`);
      });
      
      // 2. Direct IPFS gateways (SECONDARY)
      this.IPFS_GATEWAYS.forEach((gateway) => {
        urls.push(`${gateway}${path}`);
      });
      
      // 3. Backup proxy with IPFS (TERTIARY)
      const primaryGateway = `${this.IPFS_GATEWAYS[0]}${path}`;
      urls.push(`${this.BACKUP_PROXY}${encodeURIComponent(primaryGateway)}`);
      
    } else if (originalUrl.startsWith('http')) {
      // 1. Lambda proxy (PRIMARY)
      urls.push(`${this.LAMBDA_PROXY}?url=${encodeURIComponent(originalUrl)}`);
      
      // 2. Direct URL for CORS-enabled sources (SECONDARY)
      if (originalUrl.includes('img.op.xyz') || 
          originalUrl.includes('img.other.page') ||
          originalUrl.includes('arweave.net')) {
        urls.push(originalUrl);
      }
      
      // 3. Backup proxy (TERTIARY)
      urls.push(`${this.BACKUP_PROXY}${encodeURIComponent(originalUrl)}`);
    }
    
    // Final fallback
    urls.push('/placeholder-nft.svg');
    
    // Remove duplicates while preserving order
    return [...new Set(urls)];
  }

  // New method for debugging image loading issues
  static async testImageUrl(url: string): Promise<{ success: boolean; error?: string; status?: number }> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      return {
        success: response.ok,
        status: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }
}