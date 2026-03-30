import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useNFTApprovalStatusV4, useNFTApprovalV4 } from './useRaffleContractV4';
import { appToast } from '../utils/toast';

interface ApprovalState {
  status: boolean | null;
  isChecking: boolean;
  contract: string | null;
  lastChecked: number;
}

/**
 * Dedicated hook for managing NFT contract approval state
 * Handles race conditions, caching, and proper state management
 */
export function useNFTApprovalManager() {
  const { address } = useAccount();
  
  // Approval state per contract
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalState>>({});
  const [currentContract, setCurrentContract] = useState<string>('');
  
  // Refs to prevent race conditions
  const activeRequestRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get approval status for current contract
  const { data: approvalData, refetch: refetchApproval } = useNFTApprovalStatusV4(
    currentContract, 
    address || ''
  );
  
  // Approval transaction hook
  const { 
    approveNFT, 
    isPending: approvalPending, 
    isConfirming: approvalConfirming, 
    isSuccess: approvalSuccess,
    error: approvalError
  } = useNFTApprovalV4();
  
  // Get current approval state
  const currentApprovalState = currentContract ? approvalStates[currentContract] : null;
  
  // Update approval state when data changes
  useEffect(() => {
    if (currentContract && approvalData !== undefined) {
      setApprovalStates(prev => ({
        ...prev,
        [currentContract]: {
          status: approvalData as boolean,
          isChecking: false,
          contract: currentContract,
          lastChecked: Date.now()
        }
      }));
    }
  }, [currentContract, approvalData]);
  
  // Handle approval success
  useEffect(() => {
    if (approvalSuccess && currentContract) {
      // Immediately update local state
      setApprovalStates(prev => ({
        ...prev,
        [currentContract]: {
          status: true,
          isChecking: false,
          contract: currentContract,
          lastChecked: Date.now()
        }
      }));
      
      appToast.success('NFT contract approved successfully!');
      
      // Refetch after a delay to confirm
      setTimeout(() => {
        if (activeRequestRef.current === currentContract) {
          refetchApproval();
        }
      }, 2000);
    }
  }, [approvalSuccess, currentContract, refetchApproval]);
  
  // Handle approval errors
  useEffect(() => {
    if (approvalError) {
      console.error('Approval error:', approvalError);
    }
  }, [approvalError]);
  
  // Check approval for a specific contract
  const checkApprovalForContract = useCallback(async (contractAddress: string) => {
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return;
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set as active request
    activeRequestRef.current = contractAddress;
    
    // Use ref to get current state to avoid stale closures
    setApprovalStates(prev => {
      const existingState = prev[contractAddress];
      const isRecentData = existingState && (Date.now() - existingState.lastChecked) < 30000;
      
      if (isRecentData && existingState.status !== null) {
        // Use cached data - just set current contract
        setCurrentContract(contractAddress);
        return prev;
      }
      
      // Set checking state
      return {
        ...prev,
        [contractAddress]: {
          status: null,
          isChecking: true,
          contract: contractAddress,
          lastChecked: Date.now()
        }
      };
    });
    
    // Set current contract (this will trigger the wagmi query)
    setCurrentContract(contractAddress);
    
    // Set timeout to refetch if needed
    timeoutRef.current = setTimeout(() => {
      if (activeRequestRef.current === contractAddress) {
        refetchApproval();
      }
    }, 1000);
  }, [refetchApproval]);
  
  // Approve a contract
  const approveContract = useCallback(async (contractAddress: string) => {
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      throw new Error('Invalid contract address');
    }
    
    try {
      await approveNFT(contractAddress);
    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    }
  }, [approveNFT]);
  
  // Clear approval state (useful for cleanup)
  const clearApprovalState = useCallback(() => {
    setApprovalStates({});
    setCurrentContract('');
    activeRequestRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    // Current state
    approvalStatus: currentApprovalState?.status ?? null,
    isCheckingApproval: currentApprovalState?.isChecking ?? false,
    currentContract,
    
    // Transaction states
    approvalPending,
    approvalConfirming,
    approvalSuccess,
    approvalError,
    
    // Actions
    checkApprovalForContract,
    approveContract,
    clearApprovalState,
    
    // All approval states (for debugging)
    allApprovalStates: approvalStates
  };
}