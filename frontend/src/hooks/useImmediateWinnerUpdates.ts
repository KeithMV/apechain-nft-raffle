import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useImmediateWinnerUpdates() {
  const queryClient = useQueryClient();

  const applyOptimisticWinnerUpdate = useCallback((raffleContract: string, winnerAddress?: string) => {
    console.log('🎯 [OPTIMISTIC] Applying immediate winner selection update for:', raffleContract);
    
    queryClient.setQueriesData(
      { queryKey: ['raffles'] },
      (oldData: any) => {
        if (!oldData) return oldData;
        
        if (Array.isArray(oldData)) {
          return oldData.map((raffle: any) => {
            if (raffle.raffleContract === raffleContract) {
              return {
                ...raffle,
                hasWinner: true,
                winnerAddress: winnerAddress || 'Processing...',
                isActive: false,
                completed: true,
                _optimisticWinnerSelected: true,
              };
            }
            return raffle;
          });
        }
        
        return oldData;
      }
    );
    
    toast.success('🎯 Winner selection in progress...', {
      duration: 2000,
      icon: '⚡',
    });
  }, [queryClient]);

  const invalidateRaffleQueries = useCallback(async () => {
    console.log('🔄 [INVALIDATE] Refreshing all raffle data after winner selection');
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['raffles'] }),
      queryClient.invalidateQueries({ queryKey: ['userRafflePositions'] }),
      queryClient.invalidateQueries({ queryKey: ['createdRaffles'] }),
      queryClient.invalidateQueries({ queryKey: ['raffleDetails'] }),
    ]);
  }, [queryClient]);

  const showWinnerSelectedSuccess = useCallback((raffleContract: string, transactionHash?: string) => {
    console.log('🏆 [SUCCESS] Winner selection completed for:', raffleContract);
    
    toast.success('🏆 Winner selected successfully!', {
      duration: 4000,
      icon: '🎉',
    });
    
    if (transactionHash) {
      toast.success(`Transaction: ${transactionHash.slice(0, 10)}...`, {
        duration: 3000,
        icon: '🔗',
      });
    }
  }, []);

  return {
    applyOptimisticWinnerUpdate,
    invalidateRaffleQueries,
    showWinnerSelectedSuccess,
  };
}