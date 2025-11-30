import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import NFTImage from './NFTImage';
import toast from 'react-hot-toast';
import { useUserRafflePositions, useCreatedRaffles } from '../hooks/useRafflePositions';
import { useCancelRaffle } from '../hooks/useCancelRaffle';
import { useEmergencySelectWinner } from '../hooks/useWinnerSelection';

interface UserRafflePosition {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  userTickets: number;
  ticketsSold: number;
  maxTickets: number;
  endTime: number;
  completed: boolean;
  isActive: boolean;
  isWinner: boolean;
  winProbability: number;
}

interface CreatedRaffle {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  creator: string;
  ticketPrice: string;
  maxTickets: number;
  ticketsSold: number;
  endTime: number;
  winner?: string;
  completed: boolean;
  isActive: boolean;
}

export default function RaffleDashboard() {
  const { address } = useAccount();
  
  const [activeTab, setActiveTab] = useState<'participated' | 'created'>('participated');
  const [showExpired, setShowExpired] = useState(true);
  const [page, setPage] = useState(0);
  
  const { positions: userPositions, loading: positionsLoading, refetch: refetchPositions } = useUserRafflePositions(address);
  const { raffles: createdRaffles, loading: rafflesLoading, refetch: refetchCreatedRaffles } = useCreatedRaffles(address, page);
  
  const [cancellingRaffle, setCancellingRaffle] = useState<string | null>(null);
  const { cancelRaffle, isPending: isCancelling, isSuccess: cancelSuccess } = useCancelRaffle();



  // Refresh when raffle is cancelled
  React.useEffect(() => {
    if (cancelSuccess) {
      refetchPositions();
      refetchCreatedRaffles();
    }
  }, [cancelSuccess, refetchPositions, refetchCreatedRaffles]);
  
  const loading = positionsLoading || rafflesLoading;
  const [hasMoreRaffles, setHasMoreRaffles] = useState(true);

  useEffect(() => {
    if (createdRaffles.length === 0) {
      setHasMoreRaffles(false);
    }
  }, [createdRaffles]);

  const loadMoreRaffles = () => {
    setPage(prev => prev + 1);
  };

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now() / 1000;
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const { selectWinner, isPending: isSelectingWinner, isConfirming: isConfirmingWinner, isSuccess: winnerSelected } = useEmergencySelectWinner();
  const [selectingWinnerFor, setSelectingWinnerFor] = useState<string | null>(null);

  const handleSelectWinner = async (raffleContract: string) => {
    try {
      setSelectingWinnerFor(raffleContract);
      await selectWinner(raffleContract);
      toast.success('Winner selection initiated! Please wait for confirmation.');
    } catch (error: any) {
      console.error('Failed to select winner:', error);
      toast.error('Failed to select winner: ' + error.message);
      setSelectingWinnerFor(null);
    }
  };

  // Reset selecting state and refresh data when transaction completes
  React.useEffect(() => {
    if (winnerSelected && selectingWinnerFor) {
      toast.success('Winner selected successfully!');
      setSelectingWinnerFor(null);
      // Refresh both user positions and created raffles
      refetchPositions();
      refetchCreatedRaffles();
    }
  }, [winnerSelected, selectingWinnerFor, refetchPositions, refetchCreatedRaffles]);



  const handleCancelRaffle = async (raffleContract: string) => {
    setCancellingRaffle(raffleContract);
    await cancelRaffle(raffleContract);
    setCancellingRaffle(null);
  };

  if (loading) {
    return (
      <div className="relative bg-gray-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-2xl blur-sm animate-pulse"></div>
        <div className="relative flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-emerald-200 font-mono tracking-wide">Loading raffle data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gray-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse"></div>
        
        <div className="relative bg-gradient-to-r from-emerald-900/20 via-green-900/20 to-teal-900/20 px-4 sm:px-8 py-6 sm:py-8 border-b border-emerald-500/30">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-xl blur-sm animate-pulse"></div>
              <span className="relative text-white text-lg sm:text-xl">⚡</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent font-mono tracking-wider">My Raffle Dashboard</h2>
              <p className="text-emerald-200 mt-1 text-sm sm:text-base font-mono tracking-wide">View your raffle activity and created raffles</p>
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
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 shadow-lg shadow-emerald-500/25'
                  : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-400/30'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative">Participated ({userPositions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group font-mono tracking-wider ${
                activeTab === 'created'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 shadow-lg shadow-emerald-500/25'
                  : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-400/30'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative">Created ({createdRaffles.length})</span>
            </button>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-sm text-emerald-300 font-mono">
                <input
                  type="checkbox"
                  checked={showExpired}
                  onChange={(e) => setShowExpired(e.target.checked)}
                  className="rounded border-emerald-400/50 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Show Expired</span>
              </label>
            </div>
          </div>
        </div>

        <div className="relative p-4 sm:p-8 z-10">
          {activeTab === 'participated' ? (
            <div className="space-y-4">
              {(() => {
                const filteredPositions = showExpired ? userPositions : userPositions.filter(p => p.isActive || p.completed);
                return filteredPositions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative w-16 h-16 bg-black/80 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-sm animate-pulse"></div>
                      <span className="relative text-cyan-400 text-2xl">⚡</span>
                    </div>
                    <h3 className="text-lg font-semibold text-cyan-300 mb-2 font-mono tracking-wider">No Raffle Participation</h3>
                    <p className="text-cyan-400/70 font-mono">{showExpired ? "You haven't participated in any raffles yet" : "No active or completed raffles to show"}</p>
                  </div>
                ) : (
                  filteredPositions.map((position) => (
                  <div key={`${position.raffleContract}-${position.raffleId}`} className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-xl blur-sm animate-pulse"></div>
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-64 h-64 sm:h-auto">
                        <NFTImage 
                          contractAddress={position.nftContract}
                          tokenId={position.tokenId.toString()}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="relative flex-1 p-6 z-10">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-pink-300 font-mono tracking-wider">
                            NFT #{position.tokenId}
                          </h4>
                        </div>
                        <p className="text-pink-400/70 text-sm font-mono mb-3 tracking-wide">
                          {position.nftContract.slice(0, 6)}...{position.nftContract.slice(-4)}
                        </p>
                        <div className="flex items-center space-x-3 mb-2">
                          {position.isWinner && (
                            <span className="px-2 py-1 bg-pink-500/20 border border-pink-400/30 rounded-full text-pink-300 text-xs font-medium font-mono tracking-wider">
                              ⚡ Winner
                            </span>
                          )}
                          {position.completed && !position.isWinner && (
                            <span className="px-2 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-red-300 text-xs font-medium font-mono tracking-wider">
                              Lost
                            </span>
                          )}
                          {position.isActive && (
                            <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-medium font-mono tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-pink-400/70 font-mono tracking-wide">Your Tickets</p>
                            <p className="text-pink-300 font-mono tracking-wider">{position.userTickets}</p>
                          </div>
                          <div>
                            <p className="text-pink-400/70 font-mono tracking-wide">Win Probability</p>
                            <p className="text-pink-300 font-mono tracking-wider">{position.winProbability.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-pink-400/70 font-mono tracking-wide">Tickets Sold</p>
                            <p className="text-pink-300 font-mono tracking-wider">{position.ticketsSold}/{position.maxTickets}</p>
                          </div>
                          <div>
                            <p className="text-pink-400/70 font-mono tracking-wide">Time Remaining</p>
                            <p className="text-pink-300 font-mono tracking-wider">{formatTimeRemaining(position.endTime)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                );
              })()}
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const filteredRaffles = showExpired ? createdRaffles : createdRaffles.filter(r => r.isActive || (Date.now() / 1000 - r.endTime < 86400));
                return filteredRaffles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative w-16 h-16 bg-black/80 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-sm animate-pulse"></div>
                      <span className="relative text-cyan-400 text-2xl">⚡</span>
                    </div>
                    <h3 className="text-lg font-semibold text-cyan-300 mb-2 font-mono tracking-wider">No Raffles Created</h3>
                    <p className="text-cyan-400/70 font-mono">{showExpired ? "You haven't created any raffles yet" : "No active or recent raffles to show"}</p>
                  </div>
                ) : (
                  filteredRaffles.map((raffle) => (
                  <div key={`${raffle.raffleContract}-${raffle.raffleId}`} className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-xl blur-sm animate-pulse"></div>
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-64 h-64 sm:h-auto">
                        <NFTImage 
                          contractAddress={raffle.nftContract}
                          tokenId={raffle.tokenId.toString()}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="relative flex-1 p-6 z-10">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-pink-300 font-mono tracking-wider">
                                NFT #{raffle.tokenId}
                              </h4>
                            </div>
                            <p className="text-pink-400/70 text-sm font-mono mb-3 tracking-wide">
                              {raffle.nftContract.slice(0, 6)}...{raffle.nftContract.slice(-4)}
                            </p>
                        <div className="flex items-center space-x-3 mb-2">
                          {raffle.completed && (
                            <span className="px-2 py-1 bg-pink-500/20 border border-pink-400/30 rounded-full text-pink-300 text-xs font-medium font-mono tracking-wider">
                              Completed
                            </span>
                          )}
                          {raffle.isActive && (
                            <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-medium font-mono tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-pink-400/70 font-mono tracking-wide">Ticket Price</p>
                            <p className="text-pink-300 font-mono tracking-wider">{raffle.ticketPrice} APE</p>
                          </div>
                          <div>
                            <p className="text-pink-400/70 font-mono tracking-wide">Tickets Sold</p>
                            <p className="text-pink-300 font-mono tracking-wider">{raffle.ticketsSold}/{raffle.maxTickets}</p>
                          </div>
                          <div>
                            <p className="text-pink-400/70 font-mono tracking-wide">Your Revenue</p>
                            <p className="text-pink-300 font-mono tracking-wider">{(parseFloat(raffle.ticketPrice) * raffle.ticketsSold * 0.9).toFixed(2)} APE</p>
                          </div>
                          <div>
                            <p className="text-pink-400/70 font-mono tracking-wide">Status</p>
                            <p className="text-pink-300 font-mono tracking-wider">{formatTimeRemaining(raffle.endTime)}</p>
                          </div>
                        </div>
                        
                            {raffle.completed && raffle.winner && (
                              <div className="mt-3 p-3 bg-pink-500/10 border border-pink-400/20 rounded-lg backdrop-blur-sm">
                                <p className="text-pink-300 text-sm font-mono tracking-wide">
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
                                  disabled={isSelectingWinner && selectingWinnerFor === raffle.raffleContract}
                                  className="relative bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 disabled:from-gray-600 disabled:to-gray-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/40 transform hover:-translate-y-0.5 font-mono tracking-wider overflow-hidden group"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                  <span className="relative">
                                    {isSelectingWinner && selectingWinnerFor === raffle.raffleContract ? (
                                      <span className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Selecting...</span>
                                      </span>
                                    ) : (
                                      'Select Winner'
                                    )}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCancelRaffle(raffle.raffleContract)}
                                  disabled={isCancelling && cancellingRaffle === raffle.raffleContract}
                                  className="relative bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 transform hover:-translate-y-0.5 font-mono tracking-wider overflow-hidden group"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                  <span className="relative">
                                    {isCancelling && cancellingRaffle === raffle.raffleContract ? (
                                      <span className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Cancelling...</span>
                                      </span>
                                    ) : (
                                      'Cancel Raffle'
                                    )}
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                );
              })()}
              
              {/* Load More Button for Created Raffles */}
              {activeTab === 'created' && hasMoreRaffles && createdRaffles.length > 0 && (
                <div className="text-center pt-6">
                  <button
                    onClick={loadMoreRaffles}
                    disabled={loading}
                    className="relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 font-mono tracking-wider overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
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