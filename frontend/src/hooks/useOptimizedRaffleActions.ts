import { useState, useCallback, useEffect } from 'react';
import { useOptimizedBuyTickets, useOptimizedSelectWinner } from './useOptimizedTransactionManager';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';
import { parseEther } from 'viem';
import { toastManager } from '../utils/toastManager';
import { CreatedRaffle } from '../components/RaffleCard';
import { config } from '../config/environment';

export interface RaffleActionsState {
  processingRaffles: Set<string>;
  ticketQuantities: { [key: string]: number };
}

export interface RaffleActionsHandlers {
  handleBuyTickets: (raffle: CreatedRaffle) => Promise<void>;
  handleWinnerSelection: (raffle: CreatedRaffle) => Promise<void>;
  setTicketQuantity: (raffleContract: string, quantity: number, maxAvailable: number) => void;
  clearTicketQuantities: () => void;
}

export interface UseOptimizedRaffleActionsReturn extends RaffleActionsState, RaffleActionsHandlers {
  isProcessing: (raffleContract: string) => boolean;
  refetchData: () => void;
}

export function useOptimizedRaffleActions(refetch: () => void): UseOptimizedRaffleActionsReturn {
  // State management
  const [processingRaffles, setProcessingRaffles] = useState<Set<string>>(new Set());
  const [ticketQuantities, setTicketQuantities] = useState<{ [key: string]: number }>({});
  const [currentRaffleContract, setCurrentRaffleContract] = useState<string | null>(null);

  // Optimized transaction managers with chain-aware optimistic data
  const buyTicketsManager = useOptimizedBuyTickets();
  const winnerSelectionManager = useOptimizedSelectWinner();
  
  // Unified cache invalidation
  const { quickInvalidate } = useUnifiedCacheInvalidation();

  // Helper functions
  const addProcessingRaffle = useCallback((raffleContract: string) => {
    setProcessingRaffles(prev => new Set(prev).add(raffleContract));
    setCurrentRaffleContract(raffleContract);
  }, []);

  const removeProcessingRaffle = useCallback((raffleContract: string) => {
    setProcessingRaffles(prev => {
      const newSet = new Set(prev);
      newSet.delete(raffleContract);
      return newSet;
    });
    if (currentRaffleContract === raffleContract) {
      setCurrentRaffleContract(null);
    }
  }, [currentRaffleContract]);

  const isProcessing = useCallback((raffleContract: string) => {
    return processingRaffles.has(raffleContract);
  }, [processingRaffles]);

  // Ticket quantity management
  const setTicketQuantity = useCallback((
    raffleContract: string, 
    quantity: number, 
    maxAvailable: number
  ) => {
    setTicketQuantities(prev => ({
      ...prev,
      [raffleContract]: Math.max(1, Math.min(25, maxAvailable, quantity))
    }));
  }, []);

  const clearTicketQuantities = useCallback(() => {
    setTicketQuantities({});
  }, []);

  // Optimized buy tickets handler
  const handleBuyTickets = useCallback(async (raffle: CreatedRaffle) => {
    // SECURITY: Validate and sanitize inputs
    if (!raffle || typeof raffle !== 'object') {
      toastManager.error('Invalid raffle data');
      return;
    }
    
    if (!raffle.raffleContract || !/^0x[a-fA-F0-9]{40}$/.test(raffle.raffleContract)) {
      toastManager.error('Invalid raffle contract address');
      return;
    }
    
    const quantity = ticketQuantities[raffle.raffleContract] || 1;
    const availableTickets = raffle.maxTickets - raffle.ticketsSold;
    
    // Validation with sanitized inputs
    if (config.enableLogging) {
      console.log('🎫 [TICKETS] Validation check:', { quantity, availableTickets, maxTickets: raffle.maxTickets });
    }
    
    if (typeof quantity !== 'number' || quantity < 1 || quantity > 25) {
      if (config.enableLogging) {
        console.error('❌ [TICKETS] Invalid quantity:', { quantity, type: typeof quantity });
      }
      toastManager.error('Invalid ticket quantity');
      return;
    }
    
    if (quantity > availableTickets) {
      toastManager.error(`Only ${availableTickets} tickets available`);
      return;
    }
    
    // Check if already processing
    if (isProcessing(raffle.raffleContract)) {
      return;
    }
    
    if (config.enableLogging) {
      // SECURITY: Sanitized logging - only log safe string representation
      const sanitizedContract = String(raffle.raffleContract || '').substring(0, 50);
      const sanitizedPrice = String(raffle.ticketPrice || '').substring(0, 20);
      console.log('Buying tickets:', { 
        raffleContract: sanitizedContract, 
        quantity,
        ticketPrice: sanitizedPrice
      });
    }
    
    // Start processing
    addProcessingRaffle(raffle.raffleContract);
    
    try {
      // Convert ticket price to wei and calculate total value
      const ticketPriceWei = typeof raffle.ticketPrice === 'string' 
        ? parseEther(raffle.ticketPrice)
        : BigInt(raffle.ticketPrice);
      
      const totalValue = ticketPriceWei * BigInt(quantity);
      
      // Use optimized transaction manager with contract call
      await buyTicketsManager.executeTransaction({
        address: raffle.raffleContract as `0x${string}`,
        abi: [{
          name: 'buyTickets',
          type: 'function',
          stateMutability: 'payable',
          inputs: [{ name: 'quantity', type: 'uint256' }],
          outputs: []
        }],
        functionName: 'buyTickets',
        args: [BigInt(quantity)],
        value: totalValue
      });
      
      // Success handling is done in useEffect
    } catch (error) {
      console.error('Failed to buy tickets:', error);
      removeProcessingRaffle(raffle.raffleContract);
    }
  }, [
    ticketQuantities, 
    buyTicketsManager, 
    isProcessing, 
    addProcessingRaffle, 
    removeProcessingRaffle
  ]);

  // Optimized winner selection handler
  const handleWinnerSelection = useCallback(async (raffle: CreatedRaffle) => {
    // Check if already processing
    if (isProcessing(raffle.raffleContract)) {
      return;
    }
    
    if (config.enableLogging) {
      // SECURITY: Sanitized logging - only log safe string representation
      const sanitizedContract = String(raffle.raffleContract || '').substring(0, 50);
      console.log('Selecting winner:', { 
        raffleContract: sanitizedContract
      });
    }
    
    // Start processing
    addProcessingRaffle(raffle.raffleContract);
    
    try {
      // Use optimized transaction manager with chain-aware optimistic data
      await winnerSelectionManager.executeTransaction({
        address: raffle.raffleContract as `0x${string}`,
        abi: [{
          name: 'emergencyReveal',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [],
          outputs: []
        }],
        functionName: 'emergencyReveal'
      });
      
      // Success handling is done in useEffect with chain-aware cache invalidation
    } catch (error) {
      console.error('Failed to start winner selection:', error);
      removeProcessingRaffle(raffle.raffleContract);
    }
  }, [
    winnerSelectionManager, 
    isProcessing, 
    addProcessingRaffle, 
    removeProcessingRaffle
  ]);

  // Effect: Handle buy tickets success
  useEffect(() => {
    if (buyTicketsManager.isSuccess && currentRaffleContract) {
      // Clear processing states and ticket quantities
      removeProcessingRaffle(currentRaffleContract);
      clearTicketQuantities();
      
      // Quick cache invalidation for immediate UI feedback
      quickInvalidate(currentRaffleContract);
      
      // Refetch data to show updated ticket counts
      refetch();
    }
  }, [
    buyTicketsManager.isSuccess, 
    currentRaffleContract,
    refetch, 
    clearTicketQuantities,
    removeProcessingRaffle,
    quickInvalidate
  ]);

  // Effect: Handle buy tickets error
  useEffect(() => {
    if (buyTicketsManager.error && currentRaffleContract) {
      removeProcessingRaffle(currentRaffleContract);
    }
  }, [buyTicketsManager.error, currentRaffleContract, removeProcessingRaffle]);

  // Effect: Handle winner selection success
  useEffect(() => {
    if (winnerSelectionManager.isSuccess && currentRaffleContract) {
      // Clear processing states and refetch data
      removeProcessingRaffle(currentRaffleContract);
      
      // Quick cache invalidation for immediate UI feedback
      quickInvalidate(currentRaffleContract);
      
      refetch();
    }
  }, [
    winnerSelectionManager.isSuccess, 
    currentRaffleContract,
    refetch,
    removeProcessingRaffle,
    quickInvalidate
  ]);

  // Effect: Handle winner selection error
  useEffect(() => {
    if (winnerSelectionManager.error && currentRaffleContract) {
      removeProcessingRaffle(currentRaffleContract);
    }
  }, [winnerSelectionManager.error, currentRaffleContract, removeProcessingRaffle]);

  return {
    // State
    processingRaffles,
    ticketQuantities,
    
    // Handlers
    handleBuyTickets,
    handleWinnerSelection,
    setTicketQuantity,
    clearTicketQuantities,
    
    // Utilities
    isProcessing,
    refetchData: refetch,
  };
}