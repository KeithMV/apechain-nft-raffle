import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import RaffleCard, { CreatedRaffle } from './RaffleCard';
import { useAllRafflesV4 } from '../hooks/useRafflePositionsV4';
import { useRaffleActions } from '../hooks/useRaffleActions';
import { throttle } from '../utils/performance';
import { useNetwork } from '../contexts/NetworkContext';



export default function BrowseRaffles() {
  const { address } = useAccount();
  const { nativeCurrency, isApeChain } = useNetwork();
  
  // Remove debug console.log for production
  // console.log('🎨 BrowseRaffles: isApeChain =', isApeChain, 'currency =', nativeCurrency);
  
  // Memoize network-aware styling to prevent recalculation
  const styles = useMemo(() => ({
    borderColor: isApeChain ? 'border-emerald-400/30' : 'border-blue-400/30',
    shadowColor: isApeChain ? 'shadow-emerald-500/20' : 'shadow-blue-500/20',
    gradientBg: isApeChain 
      ? 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10'
      : 'from-blue-500/10 via-indigo-500/10 to-purple-500/10',
    titleGradient: isApeChain
      ? 'from-emerald-400 via-teal-300 to-cyan-400'
      : 'from-blue-400 via-indigo-300 to-purple-400',
    activeButtonStyle: isApeChain
      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
      : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
  }), [isApeChain]);
  
  // State management
  const [showExpired, setShowExpired] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreRaffles, setHasMoreRaffles] = useState(true);
  
  const BATCH_SIZE = 10;
  const { raffles, loading, refetch } = useAllRafflesV4(BATCH_SIZE, currentPage * BATCH_SIZE);
  
  // Consolidated raffle actions hook
  const {
    processingRaffles,
    ticketQuantities,
    handleBuyTickets,
    handleWinnerSelection,
    setTicketQuantity
  } = useRaffleActions(refetch);

  useEffect(() => {
    if (raffles.length < BATCH_SIZE) {
      setHasMoreRaffles(false);
    }
  }, [raffles]);

  // Throttled load more to prevent rapid calls
  const loadMoreRaffles = useMemo(
    () => throttle(() => {
      if (!hasMoreRaffles || loading) return;
      setCurrentPage(prev => prev + 1);
    }, 1000),
    [hasMoreRaffles, loading]
  );




  
  // Throttled version of setTicketQuantity for performance
  const throttledSetTicketQuantity = useMemo(
    () => throttle(setTicketQuantity, 100),
    [setTicketQuantity]
  );
  
  // Optimized filtered raffles with better memoization
  const { filteredRaffles, activeCount, expiredCount } = useMemo(() => {
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
    <div className={`relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border ${styles.borderColor} rounded-3xl shadow-2xl ${styles.shadowColor} overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(-45deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      
      <div className="relative z-10">
        <div className={`bg-gradient-to-r ${styles.gradientBg} px-4 sm:px-8 py-6 sm:py-8 border-b ${styles.borderColor}`}>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex-1">
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent font-sans tracking-tight`}>NFT Raffles</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowExpired(!showExpired)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  showExpired 
                    ? styles.activeButtonStyle
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-600/50'
                }`}
              >
                {showExpired ? 'Hide Expired' : 'Show Expired'}
              </button>
            </div>
          </div>
        </div>

      <div className="p-4 sm:p-8">
        {raffles.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-4 text-sm">
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl px-4 py-2">
              <span className="text-emerald-300 font-medium">{activeCount} Active</span>
            </div>
            <button
              onClick={() => setShowExpired(!showExpired)}
              className="bg-slate-700/50 border border-slate-600/30 hover:bg-slate-600/50 hover:border-slate-500/50 rounded-xl px-4 py-2 transition-all cursor-pointer"
            >
              <span className="text-slate-400 hover:text-slate-300 font-medium">{expiredCount} Expired</span>
            </button>
          </div>
        )}
              
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
              
              {/* Load More Button */}
              {filteredRaffles.length > 0 && hasMoreRaffles && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMoreRaffles}
                    disabled={loading}
                    className="relative bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-300 hover:text-white disabled:text-slate-500 font-semibold py-3 px-8 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-3 mx-auto overflow-hidden group border border-slate-600/50 hover:border-slate-500/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-500/0 via-slate-500/10 to-slate-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="relative">Loading older raffles...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative">📜</span>
                        <span className="relative">Load More Raffles</span>
                      </>
                    )}
                  </button>
                </div>
              )}
      </div>
      </div>
    </div>
  );
}