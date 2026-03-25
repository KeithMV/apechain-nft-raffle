import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import ParticipatedRaffleCard from './ParticipatedRaffleCard';
import CreatedRaffleCard from './CreatedRaffleCard';
import toast from 'react-hot-toast';
import { useUserRafflePositionsV4, useCreatedRafflesV4, useClearRaffleCacheV4 } from '../hooks/useRafflePositionsV4';
import { useOptimizedCancelRaffle } from '../hooks/useOptimizedTransactionManager';
import { useWinnerSelection } from '../hooks/useWinnerSelection';
import { useNetwork } from '../contexts/NetworkContext';
import { useDashboardStyles } from '../hooks/useDashboardStyles';
// Phase 10: Performance monitoring for dashboard operations
import { performanceMonitor, measureSync, debounce } from '../utils/performance';

// Interfaces moved to hooks file to avoid duplication

export default function RaffleDashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { nativeCurrency, isApeChain } = useNetwork();
  
  // Extract all styling logic to custom hook
  const styles = useDashboardStyles(isApeChain);
  
  const [activeTab, setActiveTab] = useState<'participated' | 'created'>('participated');
  const [showExpired, setShowExpired] = useState(true);
  const [page, setPage] = useState(0);
  
  const { positions: userPositions, loading: positionsLoading, refetch: refetchPositions } = useUserRafflePositionsV4(address);
  const { raffles: createdRaffles, loading: rafflesLoading, refetch: refetchCreatedRaffles } = useCreatedRafflesV4(address, page);
  const clearCache = useClearRaffleCacheV4();
  
  const cancelRaffleHook = useOptimizedCancelRaffle();
  const { emergencyReveal, isPending: isSelectingWinner, isSuccess: winnerSelected, hash: winnerHash, error: winnerError } = useWinnerSelection();
  const [selectingWinnerFor, setSelectingWinnerFor] = useState<string | null>(null);
  const [cancellingRaffle, setCancellingRaffle] = useState<string | null>(null);
  
  // Force refresh when network changes - use useRef to track previous chainId
  const prevChainIdRef = useRef<number | undefined>(undefined);
  
  useEffect(() => {
    // Only run if chainId actually changed
    if (prevChainIdRef.current !== undefined && prevChainIdRef.current !== chainId) {
      console.log('🔄 Network changed, clearing cache and refreshing dashboard data for chainId:', chainId);
      clearCache(); // Clear cache first
      setTimeout(() => {
        refetchPositions();
        refetchCreatedRaffles();
      }, 100); // Small delay to ensure cache is cleared
      setPage(0); // Reset pagination
    }
    prevChainIdRef.current = chainId;
  }, [chainId, clearCache, refetchPositions, refetchCreatedRaffles]);
  
  // Auto-refresh when raffle is cancelled
  useEffect(() => {
    if (cancelRaffleHook.isSuccess) {
      console.log('✅ [CANCEL] Raffle cancelled successfully, updating UI immediately');
      setCancellingRaffle(null);
      
      // Immediate refetch for instant UI update
      refetchPositions();
      refetchCreatedRaffles();
    }
  }, [cancelRaffleHook.isSuccess, cancellingRaffle, refetchPositions, refetchCreatedRaffles]);

  // Faster refresh when transactions are pending (optimized for winner selection)
  useEffect(() => {
    if (selectingWinnerFor || cancellingRaffle) {
      // More frequent updates for winner selection
      const refreshInterval = selectingWinnerFor ? 1500 : 3000; // 1.5s for winner selection, 3s for cancel
      
      const interval = setInterval(() => {
        console.log('🔄 [REFRESH] Periodic refresh during transaction processing');
        refetchPositions();
        refetchCreatedRaffles();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [selectingWinnerFor, cancellingRaffle, refetchPositions, refetchCreatedRaffles]);
  


  // Handle winner selection errors
  useEffect(() => {
    if (winnerError && selectingWinnerFor) {
      toast.error('Winner selection failed', {
        id: `winner-${selectingWinnerFor}`,
      });
      setSelectingWinnerFor(null);
    }
  }, [winnerError, selectingWinnerFor]);
  
  // Handle cancel raffle errors
  useEffect(() => {
    if (cancelRaffleHook.error && cancellingRaffle) {
      toast.error('Raffle cancellation failed', {
        id: `cancel-${cancellingRaffle}`,
      });
      setCancellingRaffle(null);
    }
  }, [cancelRaffleHook.error, cancellingRaffle]);
  
  const loading = positionsLoading || rafflesLoading;
  const [hasMoreRaffles, setHasMoreRaffles] = useState(true);

  // Memoized filtered data for performance with monitoring
  const filteredPositions = useMemo(() => {
    return measureSync('dashboard-position-filtering', () => {
      return showExpired ? userPositions : userPositions.filter(p => p.isActive || p.completed);
    });
  }, [showExpired, userPositions]);

  const filteredRaffles = useMemo(() => {
    return measureSync('dashboard-raffle-filtering', () => {
      return showExpired ? createdRaffles : createdRaffles.filter(r => r.isActive || (Date.now() / 1000 - r.endTime < 86400));
    });
  }, [showExpired, createdRaffles]);

  useEffect(() => {
    if (createdRaffles.length === 0) {
      setHasMoreRaffles(false);
    }
  }, [createdRaffles]);

  const loadMoreRaffles = () => {
    setPage(prev => prev + 1);
  };

  const formatTimeRemaining = useCallback((endTime: number) => {
    const now = Date.now() / 1000;
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  const handleSelectWinner = useCallback(async (raffleContract: string) => {
    // SECURITY: Validate and sanitize input
    if (!raffleContract || typeof raffleContract !== 'string') {
      console.error('Invalid raffle contract address');
      return;
    }
    
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(raffleContract)) {
      console.error('Invalid Ethereum address format');
      return;
    }
    
    setSelectingWinnerFor(raffleContract);
    
    console.log('🏆 [WINNER] Starting winner selection for raffle:', raffleContract);
    
    // Show simple loading toast
    toast.loading('🎯 Selecting winner...', {
      id: `winner-${raffleContract}`,
      duration: Infinity, // Keep until we dismiss it
    });
    
    try {
      await emergencyReveal(raffleContract);
      console.log('✅ [WINNER] Winner selection initiated successfully');
    } catch (error) {
      console.error('❌ [WINNER] Winner selection failed:', error);
      toast.error('Failed to select winner', {
        id: `winner-${raffleContract}`,
      });
      setSelectingWinnerFor(null);
    }
  }, [emergencyReveal]);

  const handleCancelRaffle = useCallback(async (raffleContract: string) => {
    setCancellingRaffle(raffleContract);
    
    console.log('💫 [CANCEL] Starting raffle cancellation for:', raffleContract);
    
    // Show simple loading toast
    toast.loading('💫 Cancelling raffle...', {
      id: `cancel-${raffleContract}`,
      duration: Infinity, // Keep until we dismiss it
    });
    
    try {
      await cancelRaffleHook.executeTransaction({
        address: raffleContract as `0x${string}`,
        abi: [{
          name: 'cancelRaffle',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [],
          outputs: []
        }],
        functionName: 'cancelRaffle',
      });
      console.log('✅ [CANCEL] Raffle cancellation initiated successfully');
    } catch (error) {
      console.error('❌ [CANCEL] Raffle cancellation failed:', error);
      toast.error('Failed to cancel raffle', {
        id: `cancel-${raffleContract}`,
      });
      setCancellingRaffle(null);
    }
  }, [cancelRaffleHook.executeTransaction]);

  // Immediate refresh when winner is selected - optimized for speed
  useEffect(() => {
    if (winnerSelected && selectingWinnerFor) {
      console.log('✅ [WINNER] Winner selected successfully, updating UI immediately');
      
      // Clear the selecting state immediately
      setSelectingWinnerFor(null);
      
      // Immediate refetch for instant UI update
      refetchPositions();
      refetchCreatedRaffles();
    }
  }, [winnerSelected, selectingWinnerFor, refetchPositions, refetchCreatedRaffles]);

  // Only show full loading screen if no cached data available
  if (loading && userPositions.length === 0 && createdRaffles.length === 0) {
    return (
      <div className={`relative bg-gray-900/95 backdrop-blur-xl border ${styles.containerBorderColor} rounded-2xl shadow-2xl ${styles.containerShadowColor} p-8`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${styles.cardBgGradient} rounded-2xl blur-sm`}></div>
        <div className="relative flex items-center justify-center py-12">
          <div className={`w-8 h-8 border-2 ${isApeChain ? 'border-emerald-400' : 'border-blue-400'} border-t-transparent rounded-full animate-spin mr-3`}></div>
          <span className={`${isApeChain ? 'text-emerald-200' : 'text-blue-200'} font-mono tracking-wide`}>Loading raffle data...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className={`relative bg-gray-900/95 backdrop-blur-xl border ${styles.containerBorderColor} rounded-2xl shadow-2xl ${styles.containerShadowColor} overflow-hidden`}>
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[size:20px_20px]" style={{
          backgroundImage: `linear-gradient(${styles.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${styles.gridColor} 1px, transparent 1px)`
        }}></div>
        
        <div className={`relative bg-gradient-to-r ${styles.headerBgGradient} px-4 sm:px-8 py-6 sm:py-8 border-b ${styles.headerBorderColor}`}>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent font-mono tracking-wider`}>My Raffle Dashboard</h2>
                {loading && (
                  <div className={`w-4 h-4 border-2 ${isApeChain ? 'border-emerald-400' : 'border-blue-400'} border-t-transparent rounded-full animate-spin`}></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="relative px-4 sm:px-8 pt-6 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('participated')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group font-mono tracking-wider ${
                activeTab === 'participated'
                  ? styles.tabActiveStyle
                  : `${styles.tabHoverStyle} border border-transparent`
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${styles.shimmerGradient} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
              <span className="relative">Participated ({userPositions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group font-mono tracking-wider ${
                activeTab === 'created'
                  ? styles.tabActiveStyle
                  : `${styles.tabHoverStyle} border border-transparent`
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${styles.shimmerGradient} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
              <span className="relative">Created ({createdRaffles.length})</span>
            </button>
            </div>
            <div className="flex items-center space-x-3">
              <label className={`flex items-center space-x-2 text-sm ${styles.textPrimary} font-mono`}>
                <input
                  type="checkbox"
                  checked={showExpired}
                  onChange={(e) => setShowExpired(e.target.checked)}
                  className={`rounded ${isApeChain ? 'border-emerald-400/50 bg-slate-800 text-emerald-500 focus:ring-emerald-500' : 'border-blue-400/50 bg-slate-800 text-blue-500 focus:ring-blue-500'}`}
                />
                <span>Show Expired</span>
              </label>
            </div>
          </div>
        </div>

        <div className="relative p-4 sm:p-8 z-10">
          {activeTab === 'participated' ? (
            <div className="space-y-4">
              {filteredPositions.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`relative w-16 h-16 bg-black/80 border ${styles.cardBorderColor} rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${styles.cardBgGradient} rounded-2xl blur-sm`}></div>
                    <span className={`relative ${styles.textPrimary} text-2xl`}>⚡</span>
                  </div>
                  <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-2 font-mono tracking-wider`}>No Raffle Participation</h3>
                  <p className={`${styles.textSecondary} font-mono`}>{showExpired ? "You haven't participated in any raffles yet" : "No active or completed raffles to show"}</p>
                </div>
              ) : (
                filteredPositions.map((position) => (
                  <ParticipatedRaffleCard
                    key={`${position.raffleContract}-${position.raffleId}`}
                    position={position}
                    styles={styles}
                    isApeChain={isApeChain}
                    formatTimeRemaining={formatTimeRemaining}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRaffles.length === 0 ? (
                    <div className="text-center py-12">
                      <div className={`relative w-16 h-16 bg-black/80 border ${styles.cardBorderColor} rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm`}>
                        <div className={`absolute inset-0 bg-gradient-to-r ${styles.cardBgGradient} rounded-2xl blur-sm`}></div>
                        <span className={`relative ${styles.textPrimary} text-2xl`}>⚡</span>
                      </div>
                      <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-2 font-mono tracking-wider`}>No Raffles Created</h3>
                      <p className={`${styles.textSecondary} font-mono`}>{showExpired ? "You haven't created any raffles yet" : "No active or recent raffles to show"}</p>
                    </div>
                ) : (
                  filteredRaffles.map((raffle) => (
                    <CreatedRaffleCard
                      key={`${raffle.raffleContract}-${raffle.raffleId}`}
                      raffle={raffle}
                      styles={styles}
                      isApeChain={isApeChain}
                      nativeCurrency={nativeCurrency}
                      formatTimeRemaining={formatTimeRemaining}
                      handleSelectWinner={handleSelectWinner}
                      handleCancelRaffle={handleCancelRaffle}
                      selectingWinnerFor={selectingWinnerFor}
                      cancellingRaffle={cancellingRaffle}
                    />
                  ))
                )}
              
              {/* Load More Button for Created Raffles */}
              {activeTab === 'created' && hasMoreRaffles && createdRaffles.length > 0 && (
                <div className="text-center pt-6">
                  <button
                    onClick={loadMoreRaffles}
                    disabled={loading}
                    className={`relative bg-gradient-to-r ${styles.loadMoreButtonGradient} ${styles.loadMoreButtonHover} disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg ${styles.loadMoreButtonShadow} ${styles.loadMoreButtonShadowHover} transform hover:-translate-y-0.5 font-mono tracking-wider overflow-hidden group`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${styles.shimmerGradient} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                    {loading ? (
                      <span className="relative flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </span>
                    ) : (
                      <span className="relative">Load More Raffles</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}