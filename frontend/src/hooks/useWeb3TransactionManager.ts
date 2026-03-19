/**
 * Web3 Transaction Manager Hook
 * Centralized transaction handling with error management, loading states, and success callbacks
 */

import { useEffect, useRef, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';

export interface TransactionConfig {
  timeout?: number;
  successMessage?: string;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
  enableToasts?: boolean;
}

export interface TransactionState {
  hash: string | undefined;
  error: Error | null;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  executeTransaction: (contractCall: any) => Promise<string>;
}

export function useWeb3TransactionManager(config: TransactionConfig = {}): TransactionState {
  const {
    timeout = 60000,
    successMessage,
    onSuccess,
    onError,
    enableToasts = true
  } = config;

  const { writeContractAsync, data: hash, error, isPending: wagmiPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
    timeout,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const lastSuccessHash = useRef<string | null>(null);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash.current) {
      lastSuccessHash.current = hash;
      setIsProcessing(false);
      
      if (enableToasts && successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(hash);
      }
    }
  }, [isSuccess, hash, successMessage, onSuccess, enableToasts]);

  // Handle transaction receipt errors or timeouts
  useEffect(() => {
    if (receiptError || (hash && !isConfirming && !isSuccess)) {
      setIsProcessing(false);
      
      if (enableToasts) {
        if (receiptError) {
          toast.error('Transaction confirmation failed. Please try again.');
        } else {
          // Timeout case
          const timeoutId = setTimeout(() => {
            toast.error('Transaction confirmation timed out. Check wallet or try again.');
          }, 35000);
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [receiptError, hash, isConfirming, isSuccess, enableToasts]);

  // Handle transaction errors (including user rejection)
  useEffect(() => {
    if (error) {
      setIsProcessing(false);
      
      if (enableToasts) {
        if (error.message?.includes('User rejected')) {
          toast.error('Transaction cancelled by user.');
        } else if (error.message?.includes('insufficient funds')) {
          toast.error('Insufficient funds for transaction.');
        } else {
          toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
        }
      }
      
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError, enableToasts]);

  // Execute transaction function
  const executeTransaction = async (contractCall: any): Promise<string> => {
    setIsProcessing(true);
    try {
      const result = await writeContractAsync(contractCall);
      return result;
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };

  return {
    hash,
    error,
    isPending: isProcessing,
    isConfirming: isConfirming && isProcessing,
    isSuccess,
    executeTransaction
  };
}

// Specialized transaction hooks for common patterns

/**
 * Hook for NFT approval transactions
 */
export function useNFTApprovalTransaction() {
  return useWeb3TransactionManager({
    successMessage: 'NFT approval successful!',
    timeout: 60000
  });
}

/**
 * Hook for raffle creation transactions
 */
export function useRaffleCreationTransaction(onSuccess?: (hash: string) => void) {
  return useWeb3TransactionManager({
    successMessage: 'Raffle created successfully!',
    onSuccess,
    timeout: 60000
  });
}

/**
 * Hook for ticket purchase transactions
 */
export function useTicketPurchaseTransaction() {
  return useWeb3TransactionManager({
    successMessage: 'Tickets purchased successfully!',
    timeout: 60000
  });
}

