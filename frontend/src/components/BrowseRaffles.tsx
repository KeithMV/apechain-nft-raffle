import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import RaffleCard, { CreatedRaffle } from './RaffleCard';
import { useAllRaffles } from '../hooks/useRaffleData';
import { useOptimizedRaffleActions } from '../hooks/useOptimizedRaffleActions';
// Phase 10: Enhanced performance utilities
import { throttle, measureSync } from '../utils/performance';
import { useNetwork } from '../contexts/NetworkContext';
// Phase 3: Advanced UX enhancements
import { SmartLoading } from './UXEnhancements';
import { config } from '../config/environment';




export default function BrowseRaffles() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { nativeCurrency, isApeChain } = useNetwork();
  // Track page view
  useEffect(() => {
    if (config.enableLogging) {
      console.log('Browse page viewed:', { chainId });
    }
  }, [chainId]);
  
  // Remove debug console.log for production
  // console.log('🎨 BrowseRaffles: isApeChain =', isApeChain, 'currency =', nativeCurrency);
  
  const handleRaffleHover = useCallback((raffleId: string | number) => {
    console.log('Raffle hovered:', { raffleId: raffleId.toString() });
  }, []);
  
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
  const [sortBy, setSortBy] = useState<'endingSoon' | 'highValue'>('endingSoon');
  
  const BATCH_SIZE = 30; // Increased from 10 to 30 for better initial view
  const {
    raffles,
    loading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useAllRaffles({ 
    infinite: true, 
    limit: BATCH_SIZE 
  });
  
  // Calculate page count from raffles length - Fix typing issue
  const pageCount = Math.ceil((Array.isArray(raffles) ? raffles.length : 0) / BATCH_SIZE);
  
  // Listen for cache invalidation events to trigger refetch
  useEffect(() => {
    const handleCacheInvalidated = () => {
      if (config.enableLogging) {
        console.log('🔄 [BROWSE] Cache invalidated, refetching data...');
      }
      refetch();
    };
    
    window.addEventListener('cache-invalidated', handleCacheInvalidated);
    return () => window.removeEventListener('cache-invalidated', handleCacheInvalidated);
  }, [refetch]);
  
  // Auto-fetch all active raffles on mount for comprehensive sorting
  useEffect(() => {
    if (!showExpired && hasNextPage && !isFetchingNextPage && !loading) {
      if (config.enableLogging) {
        console.log('🔄 [BROWSE] Auto-loading all active raffles for sorting...');
      }
      fetchNextPage();
    }
  }, [showExpired, hasNextPage, isFetchingNextPage, loading, fetchNextPage]);
  
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
  
  // Sorting function - SIMPLIFIED: Only Ending Soon and High Value
  const sortRaffles = useCallback((rafflesToSort: CreatedRaffle[]) => {
    const sorted = [...rafflesToSort];
    switch (sortBy) {
      case 'endingSoon':
        return sorted.sort((a, b) => a.endTime - b.endTime); // Ascending (soonest first)
      case 'highValue':
        return sorted.sort((a, b) => parseFloat(b.ticketPrice) - parseFloat(a.ticketPrice)); // Highest price first
      default:
        return sorted;
    }
  }, [sortBy]);
  
  // Optimized filtered and sorted raffles
  const { filteredRaffles, activeCount, expiredCount } = useMemo(() => {
    return measureSync('raffle-filtering', () => {
      let active = 0;
      let expired = 0;
      const filtered: CreatedRaffle[] = [];
      
      // Ensure raffles is an array and has proper typing
      const raffleArray = Array.isArray(raffles) ? raffles : [];
      
      for (const raffle of raffleArray) {
        if (raffle && typeof raffle === 'object' && 'isActive' in raffle) {
          if (raffle.isActive) {
            active++;
            filtered.push(raffle as CreatedRaffle);
          } else {
            expired++;
            if (showExpired) {
              filtered.push(raffle as CreatedRaffle);
            }
          }
        }
      }
      
      // Apply sorting
      const sorted = sortRaffles(filtered);
      
      return { filteredRaffles: sorted, activeCount: active, expiredCount: expired };
    });
  }, [raffles, showExpired, sortRaffles]);

  if (loading) {
    return (
      <SmartLoading
        isLoading={true}
        operation="browse_raffles"
        context={{ chainId }}
        skeleton={
          <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border border-emerald-400/30 rounded-3xl shadow-2xl shadow-emerald-500/20 p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
                  <div className="w-full h-48 bg-slate-700 rounded-lg mb-4" />
                  <div className="h-4 bg-slate-700 rounded mb-2" />
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <div />
      </SmartLoading>
    );
  }

  return (
    <>
      <div className={`relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border ${styles.borderColor} rounded-3xl shadow-2xl ${styles.shadowColor} overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(-45deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      
      <div className="relative z-10">
        <div className={`bg-gradient-to-r ${styles.gradientBg} px-4 sm:px-8 py-6 sm:py-8 border-b ${styles.borderColor}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent font-sans tracking-tight`}>NFT Raffles</h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-slate-300 text-sm font-medium whitespace-nowrap">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'endingSoon' | 'highValue')}
                  className={`bg-slate-800/50 text-slate-200 border ${styles.borderColor} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isApeChain ? 'focus:ring-emerald-500/50' : 'focus:ring-purple-500/50'} transition-all cursor-pointer`}
                >
                  <option value="endingSoon">⏰ Ending Soon</option>
                  <option value="highValue">💎 High Value</option>
                </select>
              </div>
              
              {/* Active/Completed Tabs - SIMPLIFIED */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExpired(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    !showExpired
                      ? styles.activeButtonStyle
                      : 'bg-slate-800/30 text-slate-400 border border-slate-600/30 hover:bg-slate-800/50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setShowExpired(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showExpired
                      ? styles.activeButtonStyle
                      : 'bg-slate-800/30 text-slate-400 border border-slate-600/30 hover:bg-slate-800/50'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
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
                    <div 
                      key={`${raffle.raffleContract}-${raffle.raffleId}-${index}`}
                      onMouseEnter={() => handleRaffleHover(raffle.raffleId)}
                      className="transform transition-transform hover:scale-[1.02]"
                    >
                      <RaffleCard
                        raffle={raffle}
                        ticketQuantities={ticketQuantities}
                        setTicketQuantity={throttledSetTicketQuantity}
                        handleBuyTickets={handleBuyTickets}
                        handleWinnerSelection={handleWinnerSelection}
                        processingRaffles={processingRaffles}
                        address={address}
                        nativeCurrency={nativeCurrency}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Load More Button - Only show for completed raffles */}
              {filteredRaffles.length > 0 && hasNextPage && showExpired && (
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
                        <span className="relative">Load More Completed Raffles</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {/* Loading indicator for auto-fetch */}
              {!showExpired && isFetchingNextPage && (
                <div className="mt-8 text-center">
                  <div className="flex items-center justify-center space-x-3 text-slate-400">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading all active raffles...</span>
                  </div>
                </div>
              )}
      </div>
      </div>
      </div>
    </>
  );
}