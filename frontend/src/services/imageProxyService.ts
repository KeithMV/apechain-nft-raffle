/**
 * Image Proxy Service
 * Handles secure NFT image loading through proxy to avoid CORS issues
 */

interface ImageProxyOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export class ImageProxyService {
  private static readonly PROXY_ENDPOINTS = [
    'https://images.weserv.nl/?url=',
    'https://wsrv.nl/?url=',
  ];

  private static readonly IPFS_GATEWAYS = [
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://ipfs.infura.io/ipfs/',
  ];

  /**
   * Convert IPFS URL to HTTP URL using fastest gateway
   */
  private static resolveIPFS(ipfsUrl: string): string {
    if (!ipfsUrl.startsWith('ipfs://')) return ipfsUrl;
    
    const pathParts = ipfsUrl.slice(7).split('/');
    const hash = pathParts[0];
    // Support both CIDv0 (46 chars) and CIDv1 (variable length)
    if (!/^[a-zA-Z0-9]{32,}$/.test(hash)) {
      throw new Error('Invalid IPFS hash');
    }
    
    // Use Cloudflare IPFS gateway (fastest and most reliable)
    const path = ipfsUrl.slice(7);
    return `${this.IPFS_GATEWAYS[0]}${path}`;
  }

  /**
   * Validate image URL for security
   */
  private static validateImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // Only allow HTTPS
      if (parsed.protocol !== 'https:') return false;
      
      // Block private networks and localhost
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.1') || hostname.startsWith('172.2') || hostname.startsWith('172.3') ||
          hostname.includes('169.254.')) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get proxied image URL with optimization
   */
  static getProxiedImageUrl(
    originalUrl: string, 
    options: ImageProxyOptions = {}
  ): string {
    // Sanitize URL for logging to prevent log injection
    const sanitizedUrl = originalUrl.replace(/[\r\n\t]/g, '').slice(0, 200);
    console.log(`🖼️ Processing image URL: ${sanitizedUrl}`);
    try {
      // Comprehensive HTML entity decoding
      const textarea = document.createElement('textarea');
      textarea.innerHTML = originalUrl;
      let cleanUrl = textarea.value;
      
      // Handle IPFS URLs
      let resolvedUrl = cleanUrl;
      if (cleanUrl.startsWith('ipfs://')) {
        resolvedUrl = this.resolveIPFS(cleanUrl);
        const sanitizedResolved = resolvedUrl.replace(/[\r\n\t]/g, '').slice(0, 200);
        console.log(`📋 IPFS resolved to: ${sanitizedResolved}`);
      }

      // Validate URL
      if (!this.validateImageUrl(resolvedUrl)) {
        return '/placeholder-nft.svg';
      }

      // Build proxy URL with optimization
      const params = new URLSearchParams();
      if (options.width) params.set('w', options.width.toString());
      if (options.height) params.set('h', options.height.toString());
      if (options.quality) params.set('q', options.quality.toString());
      if (options.format) params.set('output', options.format);
      
      // Add optimization defaults
      params.set('fit', 'cover');
      params.set('a', 'attention'); // Smart cropping
      params.set('il', ''); // Interlace for progressive loading
      
      const queryString = params.toString();
      const proxyUrl = `${this.PROXY_ENDPOINTS[0]}${encodeURIComponent(resolvedUrl)}${queryString ? '&' + queryString : ''}`;
      
      const sanitizedProxyUrl = proxyUrl.replace(/[\r\n\t]/g, '').slice(0, 200);
      console.log(`🔗 Final proxy URL: ${sanitizedProxyUrl}`);
      return proxyUrl;
    } catch (error) {
      const sanitizedOriginal = originalUrl.replace(/[\r\n\t]/g, '').slice(0, 100);
      console.error(`❌ Image proxy failed for ${sanitizedOriginal}:`, error);
      return '/placeholder-nft.svg';
    }
  }

  /**
   * Get multiple image URLs with fallbacks
   */
  static getImageWithFallbacks(
    originalUrl: string,
    options: ImageProxyOptions = {}
  ): string[] {
    const urls: string[] = [];
    
    try {
      // Primary: Proxied image
      urls.push(this.getProxiedImageUrl(originalUrl, options));
      
      // Fallback 1: Multiple IPFS gateways for IPFS URLs
      if (originalUrl.startsWith('ipfs://')) {
        const path = originalUrl.slice(7);
        this.IPFS_GATEWAYS.slice(0, 3).forEach(gateway => {
          const directUrl = `${gateway}${path}`;
          if (this.validateImageUrl(directUrl)) {
            urls.push(directUrl);
          }
        });
      } else if (this.validateImageUrl(originalUrl)) {
        urls.push(originalUrl);
      }
      
      // Fallback 2: Alternative proxies with validation
      if (this.validateImageUrl(originalUrl)) {
        this.PROXY_ENDPOINTS.slice(1).forEach(proxy => {
          const proxyUrl = `${proxy}${encodeURIComponent(originalUrl)}`;
          urls.push(proxyUrl);
        });
      }
      
    } catch (error) {
      console.warn('Failed to generate image URLs:', error);
    }
    
    // Always include placeholder as final fallback
    urls.push('/placeholder-nft.svg');
    
    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Preload image with fallbacks
   */
  static async preloadImage(url: string): Promise<string> {
    const urls = this.getImageWithFallbacks(url);
    
    for (const imageUrl of urls) {
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          const cleanup = () => {
            img.onload = null;
            img.onerror = null;
          };
          img.onload = () => {
            cleanup();
            resolve();
          };
          img.onerror = (error) => {
            cleanup();
            reject(error);
          };
          img.src = imageUrl;
        });
        return imageUrl; // Return first successful URL
      } catch {
        continue; // Try next URL
      }
    }
    
    return '/placeholder-nft.svg'; // All failed
  }
}