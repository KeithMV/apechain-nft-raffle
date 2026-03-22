import { useState, useCallback, useEffect } from 'react';
import { useBuyTickets } from './useRaffleContractV4';
import { useWinnerSelection } from './useWinnerSelection';
import { useTransactionProgress } from '../components/TransactionProgress';
import toast from 'react-hot-toast';
import { CreatedRaffle } from '../components/RaffleCard';

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
  // Progress UI state
  progressState: {
    isVisible: boolean;
    transactionType: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle';
    hash?: string;
    error?: Error | null;
  };
  progressHandlers: {
    showProgress: (type: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => void;
    showError: (error: Error) => void;
    hideProgress: () => void;
  };
}

export function useOptimizedRaffleActions(refetch: () => void): UseOptimizedRaffleActionsReturn {
  // State management
  const [processingRaffles, setProcessingRaffles] = useState<Set<string>>(new Set());
  const [ticketQuantities, setTicketQuantities] = useState<{ [key: string]: number }>({});
  const [currentRaffleContract, setCurrentRaffleContract] = useState<string | null>(null);

  // Progress UI management
  const progressManager = useTransactionProgress();

  // Web3 hooks with optimized transaction managers
  const buyTicketsHook = useBuyTickets();
  const winnerSelectionHook = useWinnerSelection();

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

  // Optimized buy tickets handler with progress tracking
  const handleBuyTickets = useCallback(async (raffle: CreatedRaffle) => {
    const quantity = ticketQuantities[raffle.raffleContract] || 1;
    const availableTickets = raffle.maxTickets - raffle.ticketsSold;
    
    // Validation
    if (quantity > availableTickets) {
      toast.error(`Only ${availableTickets} tickets available`);
      return;
    }
    
    // Check if already processing
    if (isProcessing(raffle.raffleContract)) {
      return;
    }
    
    // Start processing and show progress
    addProcessingRaffle(raffle.raffleContract);
    progressManager.showProgress('buy-tickets');
    
    try {
      await buyTicketsHook.buyTickets(
        raffle.raffleContract, 
        quantity, 
        raffle.ticketPrice,
        // Pass user address for optimistic updates if available
        undefined // We'll get this from wagmi context
      );
      
      // Success handling is done in useEffect
    } catch (error) {
      console.error('Failed to buy tickets:', error);
      progressManager.showError(error as Error);
      removeProcessingRaffle(raffle.raffleContract);
      
      // Hide progress after 3 seconds
      setTimeout(() => {
        progressManager.hideProgress();
      }, 3000);
    }
  }, [
    ticketQuantities, 
    buyTicketsHook.buyTickets, 
    isProcessing, 
    addProcessingRaffle, 
    removeProcessingRaffle,
    progressManager
  ]);

  // Optimized winner selection handler with progress tracking
  const handleWinnerSelection = useCallback(async (raffle: CreatedRaffle) => {
    // Check if already processing
    if (isProcessing(raffle.raffleContract)) {
      return;
    }
    
    // Start processing and show progress
    addProcessingRaffle(raffle.raffleContract);
    progressManager.showProgress('select-winner');
    
    try {
      await winnerSelectionHook.startWinnerSelection(raffle.raffleContract);
      // Success handling is done in useEffect
    } catch (error) {
      console.error('Failed to start winner selection:', error);
      progressManager.showError(error as Error);
      removeProcessingRaffle(raffle.raffleContract);
      
      // Hide progress after 3 seconds
      setTimeout(() => {
        progressManager.hideProgress();
      }, 3000);
    }
  }, [
    winnerSelectionHook.startWinnerSelection, 
    isProcessing, 
    addProcessingRaffle, 
    removeProcessingRaffle,
    progressManager
  ]);



  // Effect: Track winner selection progress
  useEffect(() => {
    if (winnerSelectionHook.commitSuccess || winnerSelectionHook.revealSuccess) {
      // Winner selection is a two-step process, show simple feedback
      if (winnerSelectionHook.commitSuccess) {
        toast.success('Commit phase completed');
      }
    }
  }, [winnerSelectionHook.commitSuccess, winnerSelectionHook.revealSuccess]);

  // Effect: Handle buy success
  useEffect(() => {
    if (buyTicketsHook.isSuccess && currentRaffleContract) {
      // Show success
      toast.success('Tickets purchased successfully!');
      
      // Clear processing states and ticket quantities
      removeProcessingRaffle(currentRaffleContract);
      clearTicketQuantities();
      
      // Refetch data to show updated ticket counts
      refetch();
      
      // Hide progress after 2 seconds
      setTimeout(() => {
        progressManager.hideProgress();
      }, 2000);
    }
  }, [
    buyTicketsHook.isSuccess, 
    buyTicketsHook.hash,
    currentRaffleContract,
    refetch, 
    clearTicketQuantities,
    removeProcessingRaffle,
    progressManager
  ]);

  // Effect: Handle buy error
  useEffect(() => {
    if (buyTicketsHook.error && currentRaffleContract) {
      progressManager.showError(buyTicketsHook.error);
      removeProcessingRaffle(currentRaffleContract);
      
      // Hide progress after 3 seconds
      setTimeout(() => {
        progressManager.hideProgress();
      }, 3000);
    }
  }, [buyTicketsHook.error, currentRaffleContract, removeProcessingRaffle, progressManager]);

  // Effect: Handle winner selection success
  useEffect(() => {
    if (winnerSelectionHook.revealSuccess && currentRaffleContract) {
      // Show success
      toast.success('Winner selected successfully!');
      
      // Clear processing states and refetch data
      removeProcessingRaffle(currentRaffleContract);
      refetch();
      
      // Hide progress after 2 seconds
      setTimeout(() => {
        progressManager.hideProgress();
      }, 2000);
    }
  }, [
    winnerSelectionHook.revealSuccess, 
    currentRaffleContract,
    refetch,
    removeProcessingRaffle,
    progressManager
  ]);

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
    
    // Progress UI state and handlers
    progressState: {
      isVisible: progressManager.isVisible,
      transactionType: progressManager.transactionType,
      hash: progressManager.hash,
      error: progressManager.error,
    },
    progressHandlers: {
      showProgress: progressManager.showProgress,
      showError: progressManager.showError,
      hideProgress: progressManager.hideProgress,
    },
  };
}