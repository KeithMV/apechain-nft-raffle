/**
 * Image Preloader Utilities
 * Efficient image preloading with priority queue and error handling
 */

export interface PreloadItem {
  src: string;
  priority: number;
}

export interface PreloadOptions {
  maxConcurrent?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Image preloader with priority queue
 */
export class ImagePreloader {
  private queue: PreloadItem[] = [];
  private loading = new Set<string>();
  private loaded = new Set<string>();
  private failed = new Set<string>();
  private maxConcurrent: number;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor(options: PreloadOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 3;
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 2;
    this.retryDelay = options.retryDelay || 1000;
  }

  preload(src: string, priority: number = 0): Promise<void> {
    if (this.loaded.has(src)) {
      return Promise.resolve();
    }
    
    if (this.failed.has(src)) {
      return Promise.reject(new Error(`Image previously failed to load: ${src}`));
    }
    
    if (this.loading.has(src)) {
      return this.waitForLoad(src);
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ src, priority });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processQueue();
      
      this.waitForLoad(src).then(resolve).catch(reject);
    });
  }

  preloadBatch(items: PreloadItem[]): Promise<PromiseSettledResult<void>[]> {
    const promises = items.map(item => this.preload(item.src, item.priority));
    return Promise.allSettled(promises);
  }

  isLoaded(src: string): boolean {
    return this.loaded.has(src);
  }

  isFailed(src: string): boolean {
    return this.failed.has(src);
  }

  isLoading(src: string): boolean {
    return this.loading.has(src);
  }

  getStats(): { loaded: number; failed: number; loading: number; queued: number } {
    return {
      loaded: this.loaded.size,
      failed: this.failed.size,
      loading: this.loading.size,
      queued: this.queue.length
    };
  }

  clear(): void {
    this.queue = [];
    this.loading.clear();
    this.loaded.clear();
    this.failed.clear();
  }

  private async processQueue(): Promise<void> {
    if (this.loading.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.loading.add(item.src);

    try {
      await this.loadImageWithRetry(item.src);
      this.loaded.add(item.src);
    } catch (error) {
      this.failed.add(item.src);
      console.warn(`Failed to preload image: ${item.src}`, error);
    } finally {
      this.loading.delete(item.src);
      this.processQueue();
    }
  }

  private async loadImageWithRetry(src: string): Promise<void> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        await this.loadImage(src);
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError!;
  }

  private loadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timeout: ${src}`));
      }, this.timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      
      img.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load image: ${src} - ${error}`));
      };
      
      img.src = src;
    });
  }

  private waitForLoad(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        if (this.loaded.has(src)) {
          resolve();
        } else if (this.failed.has(src)) {
          reject(new Error(`Image failed to load: ${src}`));
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }
}

/**
 * Simple image preload function
 */
export function preloadImage(src: string, timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeoutId = setTimeout(() => {
      reject(new Error(`Image load timeout: ${src}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve();
    };
    
    img.onerror = (error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load image: ${src} - ${error}`));
    };
    
    img.src = src;
  });
}

/**
 * Preload multiple images with progress callback
 */
export async function preloadImages(
  sources: string[],
  onProgress?: (loaded: number, total: number) => void,
  maxConcurrent: number = 3
): Promise<PromiseSettledResult<void>[]> {
  const preloader = new ImagePreloader({ maxConcurrent });
  let loaded = 0;

  const promises = sources.map(async (src) => {
    try {
      await preloader.preload(src);
      loaded++;
      if (onProgress) {
        onProgress(loaded, sources.length);
      }
    } catch (error) {
      loaded++;
      if (onProgress) {
        onProgress(loaded, sources.length);
      }
      throw error;
    }
  });

  return Promise.allSettled(promises);
}

/**
 * Create a global image preloader instance
 */
export const globalImagePreloader = new ImagePreloader({
  maxConcurrent: 5,
  timeout: 15000,
  retries: 3,
  retryDelay: 1000
});