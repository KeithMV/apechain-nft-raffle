import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import RaffleCard, { CreatedRaffle } from './RaffleCard';
import RaffleFilters from './RaffleFilters';
import { useInfiniteAllRafflesV4 } from '../hooks/useRafflePositionsV4';
import { useOptimizedRaffleActions } from '../hooks/useOptimizedRaffleActions';
// Phase 10: Enhanced performance utilities
import { throttle, measureSync } from '../utils/performance';
import { useNetwork } from '../contexts/NetworkContext';



export default function BrowseRaffles() {
  const { address } = useAccount();
  const { nativeCurrency, isApeChain } = useNetwork();
  
  // Remove debug console.log for production
  // console.log('🎨 BrowseRaffles: isApeChain =', isApeChain, 'currency =', nativeCurrency);
  
  // Memoize network-aware styling to prevent recalculation
  const styles = useMemo(() => ({
    borderColor: isApeChain ? 'border-emerald-400/30' : 'border-purple-400/30',
    shadowColor: isApeChain ? 'shadow-emerald-500/20' : 'shadow-purple-500/20',
    gradientBg: isApeChain 
      ? 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10'
      : 'from-purple-500/10 via-violet-500/10 to-indigo-500/10',
    titleGradient: isApeChain
      ? 'from-emerald-400 via-teal-300 to-cyan-400'
      : 'from-purple-400 via-violet-300 to-indigo-400',
    activeButtonStyle: isApeChain
      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
      : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
  }), [isApeChain]);
  
  // State management - simplified for infinite queries
  const [showExpired, setShowExpired] = useState(false);
  
  const BATCH_SIZE = 10;
  const {
    raffles,
    loading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    pageCount
  } = useInfiniteAllRafflesV4(BATCH_SIZE);
  
  // Listen for cache invalidation events to trigger refetch
  useEffect(() => {
    const handleCacheInvalidated = () => {
      console.log('🔄 [BROWSE] Cache invalidated, refetching data...');
      refetch();
    };
    
    window.addEventListener('cache-invalidated', handleCacheInvalidated);
    return () => window.removeEventListener('cache-invalidated', handleCacheInvalidated);
  }, [refetch]);
  
  // Consolidated optimized raffle actions hook - simplified without progress tracking
  const {
    processingRaffles,
    ticketQuantities,
    handleBuyTickets,
    handleWinnerSelection,
    setTicketQuantity
  } = useOptimizedRaffleActions(refetch);

  // Throttled load more function - now uses infinite query
  const loadMoreRaffles = useMemo(
    () => throttle(() => {
      if (!hasNextPage || isFetchingNextPage) {
        console.log('🚫 [LOAD-MORE] Cannot load more:', { hasNextPage, isFetchingNextPage });
        return;
      }
      console.log(`📄 [LOAD-MORE] Loading page ${pageCount + 1}...`);
      fetchNextPage();
    }, 1000),
    [hasNextPage, isFetchingNextPage, fetchNextPage, pageCount]
  );




  
  // Throttled version of setTicketQuantity for performance
  const throttledSetTicketQuantity = useMemo(
    () => throttle(setTicketQuantity, 100),
    [setTicketQuantity]
  );
  
  // Optimized filtered raffles with better memoization and performance monitoring
  const { filteredRaffles, activeCount, expiredCount } = useMemo(() => {
    return measureSync('raffle-filtering', () => {
      let active = 0;
      let expired = 0;
      const filtered: CreatedRaffle[] = [];
      
      for (const raffle of raffles) {
        if (raffle.isActive) {
          active++;
          filtered.push(raffle);
        } else {
          expired++;
          if (showExpired) {
            filtered.push(raffle);
          }
        }
      }
      
      return { filteredRaffles: filtered, activeCount: active, expiredCount: expired };
    });
  }, [raffles, showExpired]);

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border border-emerald-400/30 rounded-3xl shadow-2xl shadow-emerald-500/20 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
        <div className="relative z-10 flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-emerald-300 font-medium">Loading raffles...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border ${styles.borderColor} rounded-3xl shadow-2xl ${styles.shadowColor} overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(-45deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      
      <div className="relative z-10">
        <div className={`bg-gradient-to-r ${styles.gradientBg} px-4 sm:px-8 py-6 sm:py-8 border-b ${styles.borderColor}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent font-sans tracking-tight`}>NFT Raffles</h2>
            <RaffleFilters
              showExpired={showExpired}
              setShowExpired={setShowExpired}
              activeCount={activeCount}
              expiredCount={expiredCount}
              totalRaffles={raffles.length}
              isApeChain={isApeChain}
            />
          </div>
        </div>

      <div className="p-4 sm:p-8">
              {filteredRaffles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-emerald-400 text-2xl">🎆</span>
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-300 mb-2">
                    {showExpired ? 'No Raffles Found' : 'No Active Raffles'}
                  </h3>
                  <p className="text-slate-400">
                    {showExpired ? 'No raffles available' : 'Check back soon for new exciting NFT raffles'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredRaffles.map((raffle, index) => (
                    <RaffleCard
                      key={`${raffle.raffleContract}-${raffle.raffleId}`}
                      raffle={raffle}
                      ticketQuantities={ticketQuantities}
                      setTicketQuantity={throttledSetTicketQuantity}
                      handleBuyTickets={handleBuyTickets}
                      handleWinnerSelection={handleWinnerSelection}
                      processingRaffles={processingRaffles}
                      address={address}
                      nativeCurrency={nativeCurrency}
                    />
                  ))}
                </div>
              )}
              
              {/* Load More Button - Updated for Infinite Queries */}
              {filteredRaffles.length > 0 && hasNextPage && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMoreRaffles}
                    disabled={isFetchingNextPage}
                    className="relative bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-300 hover:text-white disabled:text-slate-500 font-semibold py-3 px-8 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-3 mx-auto overflow-hidden group border border-slate-600/50 hover:border-slate-500/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-500/0 via-slate-500/10 to-slate-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {isFetchingNextPage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="relative">Loading more raffles...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative">📜</span>
                        <span className="relative">Load More Raffles ({pageCount} pages loaded)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
      </div>
      </div>
      </div>
    </>
  );
}