/**
 * Professional Raffle Contract Hooks
 * Uses wagmi React hooks for proper mobile Safari compatibility
 */

import React from 'react';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI, RAFFLE_CONTRACT_ABI, ERC721_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';

export interface CreateRaffleParams {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: number;
  duration: number;
}

/**
 * Hook for reading platform fee
 */
export function usePlatformFee() {
  return useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'platformFee',
  });
}

/**
 * Hook for reading raffle counter
 */
export function useRaffleCounter() {
  return useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });
}

/**
 * Hook for checking NFT approval status
 */
export function useNFTApprovalStatus(nftContract: string, userAddress: string) {
  return useReadContract({
    address: nftContract as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'isApprovedForAll',
    args: [userAddress as `0x${string}`, RAFFLE_FACTORY_ADDRESS as `0x${string}`],
    query: {
      enabled: !!(nftContract && userAddress),
    },
  });
}

/**
 * Hook for NFT approval transaction
 */
export function useNFTApproval() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveNFT = async (nftContract: string) => {
    return await writeContractAsync({
      address: nftContract as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'setApprovalForAll',
      args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, true],
      chainId: 33139, // Force ApeChain
    });
  };

  return {
    approveNFT,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

/**
 * Hook for creating raffle with nuclear state isolation
 */
export function useCreateRaffle() {
  const [localState, setLocalState] = React.useState({
    hash: null as `0x${string}` | null,
    error: null as Error | null,
    isPending: false,
    isConfirming: false,
    isSuccess: false
  });

  const createRaffle = async (params: CreateRaffleParams) => {
    // Track attempt number globally
    const attemptCount = (window as any).__raffleAttemptCount || 0;
    (window as any).__raffleAttemptCount = attemptCount + 1;
    
    console.log(`🔍 RAFFLE ATTEMPT #${attemptCount + 1} - STARTING FRESH:`, {
      attemptNumber: attemptCount + 1,
      params
    });
    
    try {
      setLocalState(prev => ({ ...prev, isPending: true, error: null }));
      
      // Convert APE to wei (18 decimals)
      const ticketPriceWei = parseEther(params.ticketPrice);
      
      console.log(`🔍 RAFFLE ATTEMPT #${attemptCount + 1} - TRANSACTION PARAMS:`, {
        address: RAFFLE_FACTORY_ADDRESS,
        nftContract: params.nftContract,
        tokenId: params.tokenId,
        ticketPriceWei: ticketPriceWei.toString(),
        maxTickets: params.maxTickets,
        duration: params.duration,
        chainId: 33139
      });
      
      // Use direct viem writeContract to bypass wagmi state pollution
      const { writeContract } = await import('wagmi/actions');
      const { config } = await import('../config/wagmi');
      
      // Capture MetaMask state before transaction
      const ethereum = (window as any).ethereum;
      const metamaskState = {
        chainId: await ethereum?.request({ method: 'eth_chainId' }),
        gasPrice: await ethereum?.request({ method: 'eth_gasPrice' }),
        blockNumber: await ethereum?.request({ method: 'eth_blockNumber' }),
        accounts: await ethereum?.request({ method: 'eth_accounts' })
      };
      
      console.log(`🔍 RAFFLE ATTEMPT #${attemptCount + 1} - METAMASK STATE:`, metamaskState);
      
      // Try MetaMask gas estimation directly
      const args = [
        params.nftContract as `0x${string}`,
        BigInt(params.tokenId),
        ticketPriceWei,
        BigInt(params.maxTickets),
        BigInt(params.duration)
      ];
      
      try {
        // Encode function call data manually
        const { encodeFunctionData } = await import('viem');
        const calldata = encodeFunctionData({
          abi: RAFFLE_FACTORY_ABI,
          functionName: 'createRaffle',
          args: [
            params.nftContract as `0x${string}`,
            BigInt(params.tokenId),
            ticketPriceWei,
            BigInt(params.maxTickets),
            BigInt(params.duration)
          ]
        });
        
        const gasEstimate = await ethereum?.request({
          method: 'eth_estimateGas',
          params: [{
            from: metamaskState.accounts[0],
            to: RAFFLE_FACTORY_ADDRESS,
            data: calldata
          }]
        });
        
        const gasPriceDecimal = parseInt(metamaskState.gasPrice, 16);
        const gasEstimateDecimal = parseInt(gasEstimate, 16);
        const estimatedCostWei = gasEstimateDecimal * gasPriceDecimal;
        const estimatedCostEth = estimatedCostWei / 1e18;
        
        console.log(`🔍 RAFFLE ATTEMPT #${attemptCount + 1} - METAMASK GAS ESTIMATION:`, {
          gasEstimate,
          gasEstimateDecimal,
          gasPrice: metamaskState.gasPrice,
          gasPriceDecimal,
          estimatedCostWei,
          estimatedCostEth,
          estimatedCostUSD: estimatedCostEth * 2000 // Rough APE price
        });
      } catch (gasError) {
        console.log(`🔍 RAFFLE ATTEMPT #${attemptCount + 1} - GAS ESTIMATION ERROR:`, gasError);
      }
      
      // Deep diagnostic logging for gas estimation issue
      console.log(`🔍 RAFFLE ATTEMPT #${attemptCount + 1} - DEEP DIAGNOSTICS:`, {
        wagmiConfig: !!config,
        factoryAddress: RAFFLE_FACTORY_ADDRESS,
        abiLength: RAFFLE_FACTORY_ABI.length,
        argsTypes: args.map(arg => typeof arg),
        windowEthereum: !!ethereum,
        metamaskVersion: ethereum?.version,
        chainIdFromWindow: ethereum?.chainId
      });
      
      // Single transaction attempt - no automatic retry to prevent duplicates
      const hash = await writeContract(config, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'createRaffle',
        args: [
          params.nftContract as `0x${string}`,
          BigInt(params.tokenId),
          ticketPriceWei,
          BigInt(params.maxTickets),
          BigInt(params.duration)
        ],
        chainId: 33139,
        gas: BigInt(300000), // Set reasonable gas limit to avoid estimation issues
      });
      
      console.log(`✅ RAFFLE ATTEMPT #${attemptCount + 1} - SUCCESS:`, hash);
      setLocalState(prev => ({ ...prev, hash, isPending: false, isSuccess: true }));
      return hash;
      
    } catch (error: any) {
      console.error(`❌ RAFFLE ATTEMPT #${attemptCount + 1} - FAILED:`, error);
      setLocalState(prev => ({ ...prev, error, isPending: false }));
      throw error;
    }
  };

  const reset = () => {
    setLocalState({
      hash: null,
      error: null,
      isPending: false,
      isConfirming: false,
      isSuccess: false
    });
  };

  return {
    createRaffle,
    hash: localState.hash,
    error: localState.error,
    isPending: localState.isPending,
    isConfirming: localState.isConfirming,
    isSuccess: localState.isSuccess,
    reset,
  };
}

/**
 * Hook for reading raffle contract address by ID
 */
export function useRaffleContract(raffleId: number) {
  return useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'getRaffleContract',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId >= 0,
    },
  });
}

/**
 * Hook for emergency pause (owner only)
 */
export function useEmergencyPause() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const pause = () => {
    writeContract({
      address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyPause',
    });
  };

  const unpause = () => {
    writeContract({
      address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyUnpause',
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
 * Hook for checking if factory is paused
 */
export function useFactoryPauseStatus() {
  return useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'paused',
  });
}

/**
 * Hook for buying raffle tickets
 */
export function useBuyTickets() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyTickets = async (raffleContract: string, quantity: number, ticketPrice: string) => {
    try {
      // Validate inputs
      if (!raffleContract || quantity <= 0 || !ticketPrice) {
        throw new Error('Invalid parameters for buyTickets');
      }
      
      // Calculate total cost with precision handling
      const ticketPriceWei = parseEther(ticketPrice);
      const totalCost = ticketPriceWei * BigInt(quantity);
      
      console.log('💰 Buy tickets parameters:', {
        raffleContract,
        quantity,
        ticketPrice,
        ticketPriceWei: ticketPriceWei.toString(),
        totalCost: totalCost.toString(),
        quantityBigInt: BigInt(quantity).toString()
      });
      
      const result = await writeContractAsync({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'buyTickets',
        args: [BigInt(quantity)],
        value: totalCost,
        chainId: 33139,
      });
      
      console.log('✅ writeContractAsync completed successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in buyTickets function:', error);
      throw error;
    }
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