/**
 * V4 Contract Hooks - Clean Architecture
 * Focused transaction hooks with extracted concerns
 */

import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { useContractVersionManager } from './useContractVersionManager';
import { useNFTApprovalTransaction, useRaffleCreationTransaction, useTicketPurchaseTransaction } from './useWeb3TransactionManager';
import { useContractValidator } from './useContractValidator';
import { RAFFLE_FACTORY_ABI, ERC721_ABI, RAFFLE_CONTRACT_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';
import { useCacheInvalidation } from './useCacheInvalidation';

// Re-export read hooks for backward compatibility
export { 
  usePlatformFeeV4, 
  useRaffleCounterV4, 
  useFactoryPauseStatusV4, 
  useRaffleContractV4, 
  useNFTApprovalStatusV4 
} from './useContractReads';

export interface CreateRaffleParams {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: number;
  duration: number;
}

/**
 * Hook for NFT approval transaction (V4 aware)
 */
export function useNFTApprovalV4() {
  const chainId = useChainId();
  const { factoryAddress, currentVersion } = useContractVersionManager();
  const { validateNFTApproval } = useContractValidator();
  const { hash, error, isPending, isConfirming, isSuccess, executeTransaction } = useNFTApprovalTransaction();

  const approveNFT = async (nftContract: string) => {
    // Validate input
    const validation = validateNFTApproval(nftContract);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    return await executeTransaction({
      address: nftContract as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'setApprovalForAll',
      args: [factoryAddress as `0x${string}`, true],
      chainId: chainId,
    });
  };

  return {
    approveNFT,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
    version: currentVersion,
  };
}

/**
 * Hook for creating raffle with V4 support and rate limit awareness
 */
export function useCreateRaffleV4() {
  const chainId = useChainId();
  const { factoryAddress, currentVersion, rateLimit, rateLimitText } = useContractVersionManager();
  const { validateRaffleCreation } = useContractValidator();
  const { invalidateAll } = useCacheInvalidation();
  
  const handleSuccess = () => {
    setTimeout(() => invalidateAll(), 500);
  };
  
  const { hash, error, isPending, isConfirming, isSuccess, executeTransaction } = useRaffleCreationTransaction(handleSuccess);

  const createRaffle = async (params: CreateRaffleParams) => {
    // Validate all inputs
    const validation = validateRaffleCreation(params);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const ticketPriceWei = parseEther(params.ticketPrice);
    
    return await executeTransaction({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'createRaffle',
      args: [
        params.nftContract as `0x${string}`,
        BigInt(params.tokenId),
        ticketPriceWei,
        BigInt(params.maxTickets),
        BigInt(params.duration)
      ],
      chainId: chainId,
    });
  };

  return {
    createRaffle,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
    version: currentVersion,
    rateLimit,
    rateLimitText
  };
}
/**
 * Hook for buying raffle tickets (V4 aware)
 */
export function useBuyTickets() {
  const { validateTicketPurchase } = useContractValidator();
  const { invalidateAll } = useCacheInvalidation();
  
  const handleSuccess = () => invalidateAll();
  
  const { hash, error, isPending, isConfirming, isSuccess, executeTransaction } = useTicketPurchaseTransaction();

  const buyTickets = async (raffleContract: string, quantity: number, ticketPrice: string) => {
    // Validate all inputs
    const validation = validateTicketPurchase({ raffleContract, quantity, ticketPrice });
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const ticketPriceWei = parseEther(ticketPrice);
    const totalCost = ticketPriceWei * BigInt(quantity);
    
    return await executeTransaction({
      address: raffleContract as `0x${string}`,
      abi: RAFFLE_CONTRACT_ABI,
      functionName: 'buyTickets',
      args: [BigInt(quantity)],
      value: totalCost,
    });
  };

  return {
    buyTickets,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

/**
 * Hook for emergency pause (owner only) - V4 aware
 */
export function useEmergencyPause() {
  const chainId = useChainId();
  const { factoryAddress } = useContractVersionManager();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const pause = () => {
    writeContract({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyPause',
      chainId: chainId,
    });
  };

  const unpause = () => {
    writeContract({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyUnpause',
      chainId: chainId,
    });
  };

  return {
    pause,
    unpause,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

/**
 * Rate limit checker hook (stub implementation)
 */
export function useRateLimitChecker(userAddress?: string) {
  const { currentVersion, rateLimit, rateLimitText } = useContractVersionManager();
  
  // TODO: Implement actual rate limiting logic
  return {
    canCreateRaffle: true,
    timeRemaining: 0,
    rateLimit,
    rateLimitText,
    version: currentVersion
  };
}