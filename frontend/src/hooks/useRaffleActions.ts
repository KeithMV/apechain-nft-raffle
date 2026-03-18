import { useState, useCallback, useEffect } from 'react';
import { useBuyTickets } from './useRaffleContractV4';
import { useWinnerSelection } from './useWinnerSelection';
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

export interface UseRaffleActionsReturn extends RaffleActionsState, RaffleActionsHandlers {
  isProcessing: (raffleContract: string) => boolean;
  refetchData: () => void;
}

export function useRaffleActions(refetch: () => void): UseRaffleActionsReturn {
  // State management
  const [processingRaffles, setProcessingRaffles] = useState<Set<string>>(new Set());
  const [ticketQuantities, setTicketQuantities] = useState<{ [key: string]: number }>({});

  // Web3 hooks
  const { buyTickets, isSuccess: buySuccess, error: buyError } = useBuyTickets();
  const { startWinnerSelection, revealSuccess } = useWinnerSelection();

  // Helper functions
  const addProcessingRaffle = useCallback((raffleContract: string) => {
    setProcessingRaffles(prev => new Set(prev).add(raffleContract));
  }, []);

  const removeProcessingRaffle = useCallback((raffleContract: string) => {
    setProcessingRaffles(prev => {
      const newSet = new Set(prev);
      newSet.delete(raffleContract);
      return newSet;
    });
  }, []);

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

  // Buy tickets handler
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
    
    // Start processing
    addProcessingRaffle(raffle.raffleContract);
    
    try {
      await buyTickets(raffle.raffleContract, quantity, raffle.ticketPrice);
      // Success handling is done in useEffect for buySuccess
    } catch (error) {
      console.error('Failed to buy tickets:', error);
      // Error handling is done in useEffect for buyError
      removeProcessingRaffle(raffle.raffleContract);
    }
  }, [ticketQuantities, buyTickets, isProcessing, addProcessingRaffle, removeProcessingRaffle]);

  // Winner selection handler
  const handleWinnerSelection = useCallback(async (raffle: CreatedRaffle) => {
    // Check if already processing
    if (isProcessing(raffle.raffleContract)) {
      return;
    }
    
    // Start processing
    addProcessingRaffle(raffle.raffleContract);
    
    try {
      await startWinnerSelection(raffle.raffleContract);
      // Success handling is done in useEffect for revealSuccess
    } catch (error) {
      console.error('Failed to start winner selection:', error);
      toast.error('Failed to start winner selection. Please try again.');
      removeProcessingRaffle(raffle.raffleContract);
    }
  }, [startWinnerSelection, isProcessing, addProcessingRaffle, removeProcessingRaffle]);

  // Effect: Handle buy success
  useEffect(() => {
    if (buySuccess) {
      // Clear processing states and ticket quantities
      setProcessingRaffles(new Set());
      clearTicketQuantities();
      // Refetch data to show updated ticket counts
      refetch();
    }
  }, [buySuccess, refetch, clearTicketQuantities]);

  // Effect: Handle buy error
  useEffect(() => {
    if (buyError) {
      // Clear processing states
      setProcessingRaffles(new Set());
      
      // Show appropriate error message
      if (buyError.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else {
        toast.error('Failed to buy tickets');
      }
    }
  }, [buyError]);

  // Effect: Handle winner selection success
  useEffect(() => {
    if (revealSuccess) {
      // Clear processing states and refetch data
      setProcessingRaffles(new Set());
      refetch();
    }
  }, [revealSuccess, refetch]);

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
    refetchData: refetch
  };
}