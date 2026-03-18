import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import BasicNFTImage from './BasicNFTImage';
import CopyAddress from './CopyAddress';
import toast from 'react-hot-toast';
import { useUserRafflePositionsV4, useCreatedRafflesV4, useClearRaffleCacheV4 } from '../hooks/useRafflePositionsV4';
import { useCancelRaffle } from '../hooks/useCancelRaffle';
import { useWinnerSelection } from '../hooks/useWinnerSelection';
import { useNetwork } from '../contexts/NetworkContext';
import { useDashboardStyles } from '../hooks/useDashboardStyles';

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
  
  const { cancelRaffle, isPending: isCancelling, isSuccess: cancelSuccess } = useCancelRaffle();
  const { emergencyReveal, isPending: isSelectingWinner, revealSuccess: winnerSelected } = useWinnerSelection();
  const [selectingWinnerFor, setSelectingWinnerFor] = useState<string | null>(null);
  const [cancellingRaffle, setCancellingRaffle] = useState<string | null>(null);
  
  // Force refresh when network changes
  useEffect(() => {
    console.log('🔄 Network changed, clearing cache and refreshing dashboard data for chainId:', chainId);
    clearCache(); // Clear cache first
    setTimeout(() => {
      refetchPositions();
      refetchCreatedRaffles();
    }, 100); // Small delay to ensure cache is cleared
    setPage(0); // Reset pagination
  }, [chainId, refetchPositions, refetchCreatedRaffles, clearCache]);
  
  // Auto-refresh when raffle is cancelled
  useEffect(() => {
    if (cancelSuccess) {
      setCancellingRaffle(null);
      refetchPositions();
      refetchCreatedRaffles();
    }
  }, [cancelSuccess, refetchPositions, refetchCreatedRaffles]);

  // Periodic refresh when transactions are pending (for mobile compatibility)
  useEffect(() => {
    if (selectingWinnerFor || cancellingRaffle) {
      const interval = setInterval(() => {
        refetchPositions();
        refetchCreatedRaffles();
      }, 3000); // Refresh every 3 seconds when processing
      
      return () => clearInterval(interval);
    }
  }, [selectingWinnerFor, cancellingRaffle, refetchPositions, refetchCreatedRaffles]);
  
  const loading = positionsLoading || rafflesLoading;
  const [hasMoreRaffles, setHasMoreRaffles] = useState(true);

  // Memoized filtered data for performance
  const filteredPositions = useMemo(() => {
    return showExpired ? userPositions : userPositions.filter(p => p.isActive || p.completed);
  }, [showExpired, userPositions]);

  const filteredRaffles = useMemo(() => {
    return showExpired ? createdRaffles : createdRaffles.filter(r => r.isActive || (Date.now() / 1000 - r.endTime < 86400));
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
    setSelectingWinnerFor(raffleContract);
    try {
      await emergencyReveal(raffleContract);
      // Toast is handled by useWinnerSelection hook - don't add another one
    } catch (error) {
      setSelectingWinnerFor(null);
    }
  }, [emergencyReveal]);

  const handleCancelRaffle = useCallback(async (raffleContract: string) => {
    setCancellingRaffle(raffleContract);
    try {
      await cancelRaffle(raffleContract);
      toast.success('Raffle cancelled successfully!');
    } catch (error) {
      setCancellingRaffle(null);
      // Error already handled in hook
    }
  }, [cancelRaffle]);

  // Reset button state and refresh data when winner is selected
  useEffect(() => {
    if (winnerSelected) {
      setSelectingWinnerFor(null);
      // Immediate refetch for better UX
      refetchPositions();
      refetchCreatedRaffles();
    }
  }, [winnerSelected, refetchPositions, refetchCreatedRaffles]);

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
                <div key={`${position.raffleContract}-${position.raffleId}`} className={`relative bg-black/80 backdrop-blur-xl border ${styles.cardBorderColor} rounded-xl overflow-hidden shadow-lg ${styles.cardShadowColor}`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${styles.cardBgGradient} rounded-xl blur-sm`}></div>
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-80 h-64 sm:h-80">
                      <BasicNFTImage 
                        contractAddress={position.nftContract}
                        tokenId={position.tokenId.toString()}
                        className="w-full h-full"
                        size="lg"
                      />
                    </div>
                    <div className="relative flex-1 p-6 z-10">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className={`text-lg font-semibold ${styles.textPrimary} font-mono tracking-wider`}>
                          NFT #{position.tokenId}
                        </h4>
                      </div>
                      <div className="mb-3">
                        <p className={`${styles.textSecondary} text-xs font-mono tracking-wide mb-1`}>NFT Contract:</p>
                        <CopyAddress address={position.nftContract} label="NFT Contract" className="mb-2" />
                        <p className={`${styles.textSecondary} text-xs font-mono tracking-wide mb-1`}>Raffle Contract:</p>
                        <CopyAddress address={position.raffleContract} label="Raffle Contract" />
                      </div>
                      <div className="flex items-center space-x-3 mb-2">
                        {position.isWinner && (
                          <span className={`px-2 py-1 ${isApeChain ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' : 'bg-blue-500/20 border-blue-400/30 text-blue-300'} rounded-full text-xs font-medium font-mono tracking-wider`}>
                            ⚡ Winner
                          </span>
                        )}
                        {position.completed && !position.isWinner && (
                          <span className="px-2 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-red-300 text-xs font-medium font-mono tracking-wider">
                            Lost
                          </span>
                        )}
                        {position.isActive && (
                          <span className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-green-300 text-xs font-medium font-mono tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className={`${styles.textSecondary} font-mono tracking-wide`}>Your Tickets</p>
                          <p className={`${styles.textPrimary} font-mono tracking-wider`}>{position.userTickets}</p>
                        </div>
                        <div>
                          <p className={`${styles.textSecondary} font-mono tracking-wide`}>Tickets Sold</p>
                          <p className={`${styles.textPrimary} font-mono tracking-wider`}>{position.ticketsSold}/{position.maxTickets}</p>
                        </div>
                        <div>
                          <p className={`${styles.textSecondary} font-mono tracking-wide`}>Time Remaining</p>
                          <p className={`${styles.textPrimary} font-mono tracking-wider`}>{formatTimeRemaining(position.endTime)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                  <div key={`${raffle.raffleContract}-${raffle.raffleId}`} className={`relative bg-black/80 backdrop-blur-xl border ${styles.cardBorderColor} rounded-xl overflow-hidden shadow-lg ${styles.cardShadowColor}`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${styles.cardBgGradient} rounded-xl blur-sm`}></div>
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-80 h-64 sm:h-80">
                        <BasicNFTImage 
                          contractAddress={raffle.nftContract}
                          tokenId={raffle.tokenId.toString()}
                          className="w-full h-full"
                          size="lg"
                        />
                      </div>
                      <div className="relative flex-1 p-6 z-10">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className={`text-lg font-semibold ${styles.textPrimary} font-mono tracking-wider`}>
                                NFT #{raffle.tokenId}
                              </h4>
                            </div>
                            <div className="mb-3">
                              <p className={`${styles.textSecondary} text-xs font-mono tracking-wide mb-1`}>NFT Contract:</p>
                              <CopyAddress address={raffle.nftContract} label="NFT Contract" className="mb-2" />
                              <p className={`${styles.textSecondary} text-xs font-mono tracking-wide mb-1`}>Raffle Contract:</p>
                              <CopyAddress address={raffle.raffleContract} label="Raffle Contract" />
                            </div>
                        <div className="flex items-center space-x-3 mb-2">
                          {raffle.completed && (
                            <span className={`px-2 py-1 ${isApeChain ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' : 'bg-blue-500/20 border-blue-400/30 text-blue-300'} rounded-full text-xs font-medium font-mono tracking-wider`}>
                              Completed
                            </span>
                          )}
                          {raffle.isActive && (
                            <span className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-green-300 text-xs font-medium font-mono tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className={`${styles.textSecondary} font-mono tracking-wide`}>Ticket Price</p>
                            <p className={`${styles.textPrimary} font-mono tracking-wider`}>{raffle.ticketPrice} {nativeCurrency}</p>
                          </div>
                          <div>
                            <p className={`${styles.textSecondary} font-mono tracking-wide`}>Tickets Sold</p>
                            <p className={`${styles.textPrimary} font-mono tracking-wider`}>{raffle.ticketsSold}/{raffle.maxTickets}</p>
                          </div>
                          <div>
                            <p className={`${styles.textSecondary} font-mono tracking-wide`}>Your Revenue</p>
                            <p className={`${styles.textPrimary} font-mono tracking-wider`}>{(parseFloat(raffle.ticketPrice) * raffle.ticketsSold * 0.95).toFixed(2)} {nativeCurrency}</p>
                          </div>
                          <div>
                            <p className={`${styles.textSecondary} font-mono tracking-wide`}>Status</p>
                            <p className={`${styles.textPrimary} font-mono tracking-wider`}>{formatTimeRemaining(raffle.endTime)}</p>
                          </div>
                        </div>
                        
                            {raffle.completed && raffle.winner && (
                              <div className={`mt-3 p-3 ${isApeChain ? 'bg-emerald-500/10 border-emerald-400/20' : 'bg-blue-500/10 border-blue-400/20'} rounded-lg backdrop-blur-sm`}>
                                <p className={`${styles.textPrimary} text-sm font-mono tracking-wide`}>
                                  ⚡ Winner: {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {!raffle.isActive && !raffle.completed && (
                            <div className="space-y-2">
                              {raffle.ticketsSold > 0 ? (
                                <button
                                  onClick={() => handleSelectWinner(raffle.raffleContract)}
                                  disabled={selectingWinnerFor === raffle.raffleContract}
                                  className="bg-pink-600 hover:bg-pink-500 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold text-sm"
                                >
                                  {selectingWinnerFor === raffle.raffleContract ? 'Selecting...' : 'Select Winner'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCancelRaffle(raffle.raffleContract)}
                                  disabled={cancellingRaffle === raffle.raffleContract}
                                  className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold text-sm"
                                >
                                  {cancellingRaffle === raffle.raffleContract ? 'Cancelling...' : 'Cancel Raffle'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
  );
}