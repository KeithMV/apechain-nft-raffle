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