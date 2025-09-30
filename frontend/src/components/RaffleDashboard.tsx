import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { rafflePositionService, UserRafflePosition, CreatedRaffle } from '../services/rafflePositionService';
import { raffleContractService } from '../services/raffleContractService';
import toast from 'react-hot-toast';

export default function RaffleDashboard() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [userPositions, setUserPositions] = useState<UserRafflePosition[]>([]);
  const [createdRaffles, setCreatedRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'participated' | 'created'>('participated');

  useEffect(() => {
    if (address && publicClient) {
      loadUserData();
    }
  }, [address, publicClient]);

  const loadUserData = async () => {
    if (!address || !publicClient) return;
    
    setLoading(true);
    try {
      const [positions, created] = await Promise.all([
        rafflePositionService.getUserRafflePositions(address, publicClient),
        rafflePositionService.getCreatedRaffles(address, publicClient)
      ]);
      
      setUserPositions(positions);
      setCreatedRaffles(created);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load raffle data');
    } finally {
      setLoading(false);
    }
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

  const handleSelectWinner = async (raffleContract: string) => {
    try {
      await raffleContractService.emergencySelectWinner(raffleContract);
      toast.success('Winner selected successfully!');
      loadUserData(); // Refresh data
    } catch (error: any) {
      console.error('Failed to select winner:', error);
      toast.error('Failed to select winner: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-slate-300">Loading your raffles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-4 sm:px-8 py-6 sm:py-8 border-b border-slate-700/50">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg sm:text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">My Raffle Dashboard</h2>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">Track your raffle participation and creations</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-8 pt-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('participated')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'participated'
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              Participated ({userPositions.length})
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'created'
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              Created ({createdRaffles.length})
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8">
          {activeTab === 'participated' ? (
            <div className="space-y-4">
              {userPositions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-slate-400 text-2xl">🎫</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">No Raffle Participation</h3>
                  <p className="text-slate-400">You haven't bought tickets for any raffles yet.</p>
                </div>
              ) : (
                userPositions.map((position) => (
                  <div key={`${position.raffleContract}-${position.raffleId}`} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-white">
                            NFT #{position.tokenId}
                          </h4>
                        </div>
                        <p className="text-slate-400 text-sm font-mono mb-3">
                          Contract: {position.nftContract.slice(0, 6)}...{position.nftContract.slice(-4)}
                        </p>
                        <div className="flex items-center space-x-3 mb-2">
                          {position.isWinner && (
                            <span className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-green-300 text-xs font-medium">
                              🏆 WINNER
                            </span>
                          )}
                          {position.completed && !position.isWinner && (
                            <span className="px-2 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-red-300 text-xs font-medium">
                              Lost
                            </span>
                          )}
                          {position.isActive && (
                            <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Your Tickets</p>
                            <p className="text-white font-mono">{position.userTickets}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Win Chance</p>
                            <p className="text-white font-mono">{position.winProbability.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Tickets Sold</p>
                            <p className="text-white font-mono">{position.ticketsSold}/{position.maxTickets}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Time Left</p>
                            <p className="text-white font-mono">{formatTimeRemaining(position.endTime)}</p>
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
              {createdRaffles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-slate-400 text-2xl">🎨</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">No Raffles Created</h3>
                  <p className="text-slate-400">You haven't created any raffles yet.</p>
                </div>
              ) : (
                createdRaffles.map((raffle) => (
                  <div key={`${raffle.raffleContract}-${raffle.raffleId}`} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-white">
                            NFT #{raffle.tokenId}
                          </h4>
                        </div>
                        <p className="text-slate-400 text-sm font-mono mb-3">
                          Contract: {raffle.nftContract.slice(0, 6)}...{raffle.nftContract.slice(-4)}
                        </p>
                        <div className="flex items-center space-x-3 mb-2">
                          {raffle.completed && (
                            <span className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-green-300 text-xs font-medium">
                              Completed
                            </span>
                          )}
                          {raffle.isActive && (
                            <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Ticket Price</p>
                            <p className="text-white font-mono">{raffle.ticketPrice} APE</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Tickets Sold</p>
                            <p className="text-white font-mono">{raffle.ticketsSold}/{raffle.maxTickets}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Revenue</p>
                            <p className="text-white font-mono">{(parseFloat(raffle.ticketPrice) * raffle.ticketsSold * 0.9).toFixed(2)} APE</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Status</p>
                            <p className="text-white font-mono">{formatTimeRemaining(raffle.endTime)}</p>
                          </div>
                        </div>
                        
                        {raffle.completed && raffle.winner && (
                          <div className="mt-3 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                            <p className="text-green-300 text-sm">
                              🏆 Winner: {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {!raffle.isActive && !raffle.completed && raffle.ticketsSold > 0 && (
                        <button
                          onClick={() => handleSelectWinner(raffle.raffleContract)}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Select Winner
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}