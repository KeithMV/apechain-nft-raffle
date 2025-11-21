/**
 * Transaction batching service to reduce MetaMask password prompts
 * Groups related operations to minimize wallet interactions
 */
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback } from 'react';

interface BatchedTransaction {
  id: string;
  description: string;
  execute: () => Promise<any>;
  status: 'pending' | 'executing' | 'success' | 'error';
  result?: any;
  error?: string;
}

export function useTransactionBatching() {
  const [batch, setBatch] = useState<BatchedTransaction[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const addToBatch = useCallback((transaction: Omit<BatchedTransaction, 'status'>) => {
    setBatch(prev => [...prev, { ...transaction, status: 'pending' }]);
  }, []);

  const executeBatch = useCallback(async () => {
    if (batch.length === 0 || isExecuting) return;

    setIsExecuting(true);
    const results: any[] = [];

    try {
      for (const transaction of batch) {
        setBatch(prev => prev.map(t => 
          t.id === transaction.id ? { ...t, status: 'executing' } : t
        ));

        try {
          const result = await transaction.execute();
          results.push(result);
          
          setBatch(prev => prev.map(t => 
            t.id === transaction.id ? { ...t, status: 'success', result } : t
          ));
        } catch (error) {
          setBatch(prev => prev.map(t => 
            t.id === transaction.id ? { 
              ...t, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } : t
          ));
          throw error; // Stop batch execution on error
        }
      }

      return results;
    } finally {
      setIsExecuting(false);
    }
  }, [batch, isExecuting]);

  const clearBatch = useCallback(() => {
    setBatch([]);
  }, []);

  return {
    batch,
    addToBatch,
    executeBatch,
    clearBatch,
    isExecuting,
    hasPendingTransactions: batch.some(t => t.status === 'pending')
  };
}

// Optimized contract interaction hook with reduced wallet calls
export function useOptimizedContractWrite() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [lastTransactionHash, setLastTransactionHash] = useState<string>();

  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: lastTransactionHash as `0x${string}`,
  });

  const writeContractOptimized = useCallback(async (config: any) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      const result = await writeContract(config);
      setLastTransactionHash(result as any);
      return result;
    } catch (error) {
      console.error('Contract write failed:', error);
      throw error;
    }
  }, [address, writeContract]);

  return {
    writeContract: writeContractOptimized,
    isConfirming,
    receipt,
    lastTransactionHash
  };
}

// Session-aware contract calls to reduce redundant requests
export class ContractSessionManager {
  private static instance: ContractSessionManager;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 30000; // 30 seconds

  static getInstance(): ContractSessionManager {
    if (!ContractSessionManager.instance) {
      ContractSessionManager.instance = new ContractSessionManager();
    }
    return ContractSessionManager.instance;
  }

  // Cache contract reads to avoid repeated calls
  async cachedContractRead<T>(
    key: string,
    contractCall: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    const data = await contractCall();
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
    
    return data;
  }

  // Clear cache for specific keys or all
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Get cache stats for debugging
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const contractSessionManager = ContractSessionManager.getInstance();