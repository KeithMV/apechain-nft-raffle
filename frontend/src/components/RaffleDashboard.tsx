import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import ParticipatedRaffleCard from './ParticipatedRaffleCard';
import CreatedRaffleCard from './CreatedRaffleCard';
import { toastManager } from '../utils/toastManager';
import { useParticipatedRaffles, useCreatedRaffles } from '../hooks/useRaffleData';
import { useOptimizedCancelRaffle } from '../hooks/useOptimizedTransactionManager';
import { useWinnerSelection } from '../hooks/useWinnerSelection';
import { useNetwork } from '../contexts/NetworkContext';
import { useDashboardStyles } from '../hooks/useDashboardStyles';
// Phase 10: Performance monitoring for dashboard operations
import { measureSync, debounce } from '../utils/performance';

// Interfaces moved to hooks file to avoid duplication

export default function RaffleDashboard() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { nativeCurrency, isApeChain } = useNetwork();
  
  // Extract all styling logic to custom hook
  const styles = useDashboardStyles(isApeChain);
  
  const [activeTab, setActiveTab] = useState<'participated' | 'created'>('participated');
  const [showExpired, setShowExpired] = useState(true);
  
  // PHASE 2: Use unified hooks with automatic wallet state handling
  const { raffles: userPositions, loading: positionsLoading, refetch: refetchPositions } = useParticipatedRaffles();
  const {
    raffles: createdRaffles,
    loading: rafflesLoading,
    refetch: refetchCreatedRaffles,
    fetchNextPage: fetchNextCreatedPage,
    hasNextPage: hasNextCreatedPage,
    isFetchingNextPage: isFetchingNextCreatedPage
  } = useCreatedRaffles(undefined, { infinite: true });
  
  // Calculate page count from raffles length - Fix typing issue
  const createdPageCount = Math.ceil((Array.isArray(createdRaffles) ? createdRaffles.length : 0) / 15);
  
  // 🚨 CRITICAL FIX: Only show counts when BOTH hooks are fully loaded
  const bothHooksLoaded = !positionsLoading && !rafflesLoading;
  const displayPositionsCount = bothHooksLoaded ? (Array.isArray(userPositions) ? userPositions.length : 0) : '...';
  const displayCreatedCount = bothHooksLoaded ? (Array.isArray(createdRaffles) ? createdRaffles.length : 0) : '...';
  
  // 🔍 DEBUG: Log the actual data to understand what's happening
  useEffect(() => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      chainId,
      address,
      isConnected,
      isConnecting,
      positionsLoading,
      rafflesLoading,
      userPositionsLength: Array.isArray(userPositions) ? userPositions.length : 0,
      createdRafflesLength: Array.isArray(createdRaffles) ? createdRaffles.length : 0,
      // Add wallet connection debug info
      walletDebug: {
        hasAddress: !!address,
        addressLength: address?.length || 0,
        connectionState: isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected'
      },
      userPositionsData: Array.isArray(userPositions) ? userPositions.map(p => ({
        raffleId: p.raffleId,
        raffleContract: p.raffleContract
      })) : [],
      createdRafflesData: Array.isArray(createdRaffles) ? createdRaffles.map(r => ({
        raffleId: r.raffleId,
        raffleContract: r.raffleContract
      })) : []
    };
    
    console.log('🔍 [DASHBOARD-FULL-DEBUG]', JSON.stringify(debugInfo, null, 2));
    
    // Also log a simple summary
    console.log(`📊 [DASHBOARD-SUMMARY] Chain: ${chainId}, Connected: ${isConnected}, Positions: ${Array.isArray(userPositions) ? userPositions.length : 0}, Created: ${Array.isArray(createdRaffles) ? createdRaffles.length : 0}`);
    
    // Store in localStorage for comparison (sanitized)
    const key = `dashboard-debug-${Date.now()}`;
    try {
      // Sanitize: JSON.stringify prevents code injection, only store safe debug data
      const sanitizedDebug = JSON.stringify(debugInfo);
      localStorage.setItem(key, sanitizedDebug);
    } catch (e) {
      // Ignore localStorage errors (quota exceeded, etc.)
      console.warn('Could not save debug info to localStorage:', e);
    }
    
    // Keep only last 5 entries
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('dashboard-debug-'));
    if (allKeys.length > 5) {
      allKeys.sort().slice(0, -5).forEach(k => localStorage.removeItem(k));
    }
    
  }, [chainId, address, isConnected, isConnecting, positionsLoading, rafflesLoading, userPositions, createdRaffles]);
  
  // Expose comparison function to window (sanitized)
  useEffect(() => {
    (window as any).compareDashboardStates = () => {
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith('dashboard-debug-')).sort();
      const states = allKeys.map(k => {
        try {
          // Safe: JSON.parse on data we control, with fallback
          return JSON.parse(localStorage.getItem(k) || '{}');
        } catch (e) {
          console.warn('Failed to parse localStorage debug data:', e);
          return {};
        }
      });
      
      console.log('📊 [DASHBOARD-COMPARISON]', {
        totalStates: states.length,
        states: states.map((s, i) => ({
          index: i,
          timestamp: s.timestamp,
          positionsCount: s.userPositionsLength,
          createdCount: s.createdRafflesLength,
          loading: { positions: s.positionsLoading, raffles: s.rafflesLoading }
        }))
      });
      
      return states;
    };
  }, []);
  
  const cancelRaffleHook = useOptimizedCancelRaffle();
  const { emergencyReveal, isSuccess: winnerSelected, error: winnerError } = useWinnerSelection();
  const [selectingWinnerFor, setSelectingWinnerFor] = useState<string | null>(null);
  const [cancellingRaffle, setCancellingRaffle] = useState<string | null>(null);
  
  // Force refresh when network changes - simplified without cache clearing
  const prevChainIdRef = useRef<number | undefined>(undefined);
  
  useEffect(() => {
    // Only run if chainId actually changed
    if (prevChainIdRef.current !== undefined && prevChainIdRef.current !== chainId) {
      console.log('🔄 Network changed, refreshing dashboard data for chainId:', chainId);
      // Direct refetch - unified hooks handle cache invalidation automatically
      refetchPositions();
      refetchCreatedRaffles();
    }
    prevChainIdRef.current = chainId;
  }, [chainId, refetchPositions, refetchCreatedRaffles]);
  
  // Auto-refresh when raffle is cancelled
  useEffect(() => {
    if (cancelRaffleHook.isSuccess && cancellingRaffle) {
      const toastId = `cancel-${cancellingRaffle}`;
      
      console.log('✅ [CANCEL] Raffle cancelled successfully, updating UI immediately');
      
      // Dismiss the loading toast and show success
      toastManager.transaction.replaceWithSuccess(toastId, 'Raffle cancellation', {
        duration: 5000,
        icon: '💫',
      });
      
      setCancellingRaffle(null);
      
      // Immediate refetch for instant UI update
      refetchPositions();
      refetchCreatedRaffles();
    }
  }, [cancelRaffleHook.isSuccess, cancellingRaffle, refetchPositions, refetchCreatedRaffles]);

  // PHASE 3 FIX: Removed periodic refetch during transactions
  // This was causing Browse page to refetch unnecessarily (342 RPC calls)
  // Winner selection now uses single refetch after 5 seconds (see below)
  


  // Handle winner selection errors - FIXED: Only show error if not successful
  useEffect(() => {
    if (winnerError && selectingWinnerFor && !winnerSelected) {
      const toastId = `winner-${selectingWinnerFor}`;
      
      console.log('❌ [WINNER-ERROR] Showing error toast for failed winner selection');
      toastManager.transaction.replaceWithError(toastId, 'Winner selection');
      
      setSelectingWinnerFor(null);
    }
  }, [winnerError, selectingWinnerFor, winnerSelected]);
  
  // Handle cancel raffle errors
  useEffect(() => {
    if (cancelRaffleHook.error && cancellingRaffle) {
      const toastId = `cancel-${cancellingRaffle}`;
      
      toastManager.transaction.replaceWithError(toastId, 'Raffle cancellation');
      
      setCancellingRaffle(null);
    }
  }, [cancelRaffleHook.error, cancellingRaffle]);
  
  const loading = positionsLoading || rafflesLoading;

  // Throttled load more function for created raffles
  const loadMoreCreatedRaffles = useMemo(
    () => debounce(() => {
      if (!hasNextCreatedPage || isFetchingNextCreatedPage) {
        console.log('🚫 [DASHBOARD-LOAD-MORE] Cannot load more:', { hasNextCreatedPage, isFetchingNextCreatedPage });
        return;
      }
      console.log(`📄 [DASHBOARD-LOAD-MORE] Loading page ${createdPageCount + 1} for created raffles...`);
      fetchNextCreatedPage();
    }, 1000),
    [hasNextCreatedPage, isFetchingNextCreatedPage, fetchNextCreatedPage, createdPageCount]
  );

  // Memoized filtered data for performance with monitoring
  const filteredPositions = useMemo(() => {
    return measureSync('dashboard-position-filtering', () => {
      const positionsArray = Array.isArray(userPositions) ? userPositions : [];
      return showExpired ? positionsArray : positionsArray.filter(p => p.isActive || p.completed);
    });
  }, [showExpired, userPositions]);

  const filteredRaffles = useMemo(() => {
    return measureSync('dashboard-raffle-filtering', () => {
      // Ensure createdRaffles is an array and has proper typing
      const raffleArray = Array.isArray(createdRaffles) ? createdRaffles : [];
      
      // DEBUG: Check for duplicates in created raffles
      console.log('🎯 [DASHBOARD-CREATED] Filtering created raffles:', {
        totalRaffles: raffleArray.length,
        showExpired,
        raffleIds: raffleArray.map(r => `${r.raffleContract?.slice(0,6)}-${r.raffleId}`),
        hasDuplicates: raffleArray.length !== new Set(raffleArray.map(r => `${r.raffleContract}-${r.raffleId}`)).size
      });
      
      const filtered = showExpired ? raffleArray : raffleArray.filter(r => 
        r && typeof r === 'object' && 'isActive' in r && 'endTime' in r &&
        (r.isActive || (Date.now() / 1000 - (r.endTime as number) < 86400))
      );
      
      console.log('🎯 [DASHBOARD-CREATED] After filtering:', {
        filteredCount: filtered.length,
        filteredIds: filtered.map(r => `${r.raffleContract?.slice(0,6)}-${r.raffleId}`)
      });
      
      return filtered;
    });
  }, [showExpired, createdRaffles]);



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
    
    console.log('🏆 [WINNER] Starting winner selection for raffle:', raffleContract?.replace(/[\r\n]/g, ' '), 'on chain:', chainId);
    
    // Show loading toast with unique ID
    const toastId = `winner-${raffleContract}`;
    toastManager.transaction.loading('Selecting winner', { id: toastId });
    
    try {
      await emergencyReveal(raffleContract);
      console.log('✅ [WINNER] Winner selection initiated successfully');
    } catch (error) {
      console.error('❌ [WINNER] Winner selection failed:', error);
      
      // Dismiss loading toast and show error
      toastManager.transaction.replaceWithError(toastId, 'Winner selection');
      
      setSelectingWinnerFor(null);
    }
  }, [emergencyReveal, chainId]);

  const handleCancelRaffle = useCallback(async (raffleContract: string) => {
    setCancellingRaffle(raffleContract);
    
    console.log('💫 [CANCEL] Starting raffle cancellation for:', raffleContract);
    
    // Show loading toast with unique ID
    const toastId = `cancel-${raffleContract}`;
    toastManager.transaction.loading('Cancelling raffle', { id: toastId });
    
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
      
      // Dismiss loading toast and show error
      toastManager.transaction.replaceWithError(toastId, 'Raffle cancellation');
      
      setCancellingRaffle(null);
    }
  }, [cancelRaffleHook]);

  // PHASE 3 OPTIMIZATION: Single refetch after winner selection
  // Blockchain confirmations take ~3-5 seconds, so one check after 5s is sufficient
  // Before: 3 refetches (0s, 3s, 8s) = 270 RPC calls total
  // After: 1 refetch (5s) = 90 RPC calls total
  // Savings: 67% reduction in post-transaction RPC calls
  useEffect(() => {
    if (winnerSelected && selectingWinnerFor) {
      const toastId = `winner-${selectingWinnerFor}`;
      
      console.log('✅ [WINNER] Winner selected successfully, scheduling single refetch');
      
      // Dismiss the loading toast and show success
      toastManager.transaction.replaceWithSuccess(toastId, 'Winner selection', {
        duration: 5000,
        icon: '🏆',
      });
      
      // Clear the selecting state immediately
      setSelectingWinnerFor(null);
      
      // Single refetch after 5 seconds (blockchain confirmation time)
      setTimeout(() => {
        console.log('🔄 [WINNER] Refetching data after blockchain confirmation');
        refetchPositions();
        refetchCreatedRaffles();
      }, 5000);
    }
  }, [winnerSelected, selectingWinnerFor, refetchPositions, refetchCreatedRaffles]);

  // PHASE 2: Simplified loading - hooks handle wallet connection states
  if (loading && (Array.isArray(userPositions) ? userPositions.length : 0) === 0 && (Array.isArray(createdRaffles) ? createdRaffles.length : 0) === 0) {
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
              <span className="relative">Participated ({displayPositionsCount})</span>
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
              <span className="relative">Created ({displayCreatedCount})</span>
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
                filteredPositions.map((position, index: number) => {
                  // Transform RaffleData to UserRafflePosition
                  const transformedPosition = {
                    raffleId: position.raffleId,
                    raffleContract: position.raffleContract,
                    nftContract: position.nftContract,
                    tokenId: position.tokenId,
                    userTickets: position.userTickets || 0,
                    ticketsSold: position.ticketsSold,
                    maxTickets: position.maxTickets,
                    endTime: position.endTime,
                    isWinner: position.isWinner || false,
                    completed: position.completed,
                    isActive: position.isActive,
                  };
                  
                  return (
                    <ParticipatedRaffleCard
                      key={`${position.raffleContract}-${position.raffleId}-${index}`}
                      position={transformedPosition}
                      styles={styles}
                      isApeChain={isApeChain}
                      formatTimeRemaining={formatTimeRemaining}
                    />
                  );
                })
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
                  filteredRaffles.map((raffle: any, index: number) => (
                    <CreatedRaffleCard
                      key={`${raffle.raffleContract}-${raffle.raffleId}-${index}`}
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
              
              {/* Load More Button for Created Raffles - Updated for Infinite Queries */}
              {activeTab === 'created' && hasNextCreatedPage && (Array.isArray(createdRaffles) ? createdRaffles.length : 0) > 0 && (
                <div className="text-center pt-6">
                  <button
                    onClick={loadMoreCreatedRaffles}
                    disabled={isFetchingNextCreatedPage}
                    className={`relative bg-gradient-to-r ${styles.loadMoreButtonGradient} ${styles.loadMoreButtonHover} disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg ${styles.loadMoreButtonShadow} ${styles.loadMoreButtonShadowHover} transform hover:-translate-y-0.5 font-mono tracking-wider overflow-hidden group`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${styles.shimmerGradient} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                    {isFetchingNextCreatedPage ? (
                      <span className="relative flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading more...</span>
                      </span>
                    ) : (
                      <span className="relative">Load More Raffles ({createdPageCount} pages loaded)</span>
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