/**
 * Batch Processing Utilities
 * Memory-efficient batch processing for large datasets
 */

export interface BatchOptions {
  batchSize?: number;
  delay?: number;
  maxConcurrent?: number;
}

/**
 * Memory-efficient batch processor with CONSERVATIVE OPTIMIZATION
 * Process items in small batches with delays to prevent RPC overload
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchOptions = {}
): Promise<R[]> {
  const { 
    batchSize = 3,        // REDUCED: Much smaller batches
    delay = 100,          // INCREASED: Longer delays between batches
    maxConcurrent = 2     // REDUCED: Less concurrency
  } = options;
  
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Process batch with limited concurrency
    const batchPromises = batch.map(processor);
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Always add delay between batches (except last batch)
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Process items with concurrency control
 */
export async function processConcurrent<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  maxConcurrent: number = 3
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
    });
    
    executing.push(promise);
    
    if (executing.length >= maxConcurrent) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
}

/**
 * Process items in chunks with progress callback
 */
export async function processChunks<T, R>(
  items: T[],
  processor: (chunk: T[]) => Promise<R[]>,
  chunkSize: number = 10,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const totalItems = items.length;
  let processedItems = 0;
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
    
    processedItems += chunk.length;
    if (onProgress) {
      onProgress(processedItems, totalItems);
    }
  }
  
  return results;
}

/**
 * Batch processor with retry logic
 */
export async function processBatchWithRetry<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchOptions & { maxRetries?: number; retryDelay?: number } = {}
): Promise<(R | Error)[]> {
  const { 
    batchSize = 5, 
    delay = 0, 
    maxRetries = 3, 
    retryDelay = 1000 
  } = options;
  
  const results: (R | Error)[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        let lastError: Error;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await processor(item);
          } catch (error) {
            lastError = error as Error;
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            }
          }
        }
        
        throw lastError!;
      })
    );
    
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    ));
    
    if (delay > 0 && i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Queue-based batch processor
 */
export class BatchQueue<T, R> {
  private queue: T[] = [];
  private processing = false;
  private processor: (items: T[]) => Promise<R[]>;
  private batchSize: number;
  private delay: number;
  private onResults?: (results: R[]) => void;
  private onError?: (error: Error) => void;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    options: BatchOptions & { 
      onResults?: (results: R[]) => void;
      onError?: (error: Error) => void;
    } = {}
  ) {
    this.processor = processor;
    this.batchSize = options.batchSize || 10;
    this.delay = options.delay || 100;
    this.onResults = options.onResults;
    this.onError = options.onError;
  }

  add(item: T): void {
    this.queue.push(item);
    this.processQueue();
  }

  addBatch(items: T[]): void {
    this.queue.push(...items);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.batchSize);
        
        try {
          const results = await this.processor(batch);
          if (this.onResults) {
            this.onResults(results);
          }
        } catch (error) {
          if (this.onError) {
            this.onError(error as Error);
          }
        }

        if (this.delay > 0 && this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
      }
    } finally {
      this.processing = false;
    }
  }

  clear(): void {
    this.queue = [];
  }

  size(): number {
    return this.queue.length;
  }
}