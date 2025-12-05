import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount } from 'wagmi';
import ApeTokenBalance from './ApeTokenBalance';
import NFTImage from './NFTImage';
import toast from 'react-hot-toast';
import { useAllRaffles, useClearRaffleCache } from '../hooks/useRafflePositions';
import { useBuyTickets } from '../hooks/useRaffleContract';

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

export default function BrowseRaffles() {
  const { address } = useAccount();
  
  const [buyingTickets, setBuyingTickets] = useState<string | null>(null);
  const [ticketQuantities, setTicketQuantities] = useState<{[key: string]: number}>({});
  const [showExpired, setShowExpired] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const { raffles, loading, error, refetch } = useAllRaffles(30, currentPage * 20);
  const clearCache = useClearRaffleCache();
  const [hasMoreRaffles, setHasMoreRaffles] = useState(true);



  useEffect(() => {
    if (raffles.length < 20) {
      setHasMoreRaffles(false);
    }
  }, [raffles]);

  const loadMoreRaffles = () => {
    if (!hasMoreRaffles) return;
    setCurrentPage(prev => prev + 1);
  };



  const { buyTickets, isPending: buyingPending, isSuccess: buySuccess, error: buyError } = useBuyTickets();

  const handleBuyTickets = useCallback(async (raffle: CreatedRaffle) => {
    // Prevent multiple rapid clicks
    if (buyingTickets === raffle.raffleContract || buyingPending) {
      return;
    }
    
    const quantity = ticketQuantities[raffle.raffleContract] || 1;
    const availableTickets = raffle.maxTickets - raffle.ticketsSold;
    
    console.log('🎫 Attempting to buy tickets:', {
      raffleContract: raffle.raffleContract,
      quantity,
      ticketPrice: raffle.ticketPrice,
      availableTickets,
      totalCost: (parseFloat(raffle.ticketPrice) * quantity).toString()
    });
    
    if (quantity < 1 || quantity > 100) {
      toast.error('Please enter a valid quantity (1-100)');
      return;
    }
    
    if (quantity > availableTickets) {
      toast.error(`Only ${availableTickets} tickets available`);
      return;
    }

    setBuyingTickets(raffle.raffleContract);
    try {
      console.log('🚀 Calling buyTickets function...');
      buyTickets(raffle.raffleContract, quantity, raffle.ticketPrice);
      console.log('✅ buyTickets function called successfully');
    } catch (error: any) {
      console.error('❌ Failed to buy tickets:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      toast.error('Failed to buy tickets: ' + (error.message || 'Unknown error'));
      setBuyingTickets(null);
    }
  }, [buyingTickets, buyingPending, ticketQuantities, buyTickets]);

  // Handle buy success
  useEffect(() => {
    if (buySuccess) {
      const quantity = Object.values(ticketQuantities)[0] || 1;
      toast.success(`Successfully bought ${quantity} ticket${quantity > 1 ? 's' : ''}!`);
      setBuyingTickets(null);
      setTicketQuantities({});
      // Trigger refresh after state cleanup
      setTimeout(() => refetch(), 100);
    }
  }, [buySuccess]);

  // Handle buy error
  useEffect(() => {
    if (buyError) {
      console.error('❌ Buy tickets error:', buyError);
      
      if (buyError.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else if (buyError.message?.includes('insufficient funds')) {
        toast.error('Insufficient APE balance');
      } else {
        toast.error('Failed to buy tickets: ' + buyError.message);
      }
      setBuyingTickets(null);
    }
  }, [buyError]);

  const setTicketQuantity = useCallback((raffleContract: string, quantity: number, maxAvailable: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [raffleContract]: Math.max(1, Math.min(Math.min(50, maxAvailable), quantity))
    }));
  }, []);
  
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

  // Memoize filtered raffles at component level
  const { filteredRaffles, activeCount, expiredCount } = useMemo(() => {
    const filtered = showExpired ? raffles : raffles.filter(r => r.isActive);
    const active = raffles.filter(r => r.isActive).length;
    const expired = raffles.filter(r => !r.isActive).length;
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
    <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border border-emerald-400/30 rounded-3xl shadow-2xl shadow-emerald-500/20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(-45deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      
      <div className="relative z-10">
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-4 sm:px-8 py-6 sm:py-8 border-b border-emerald-400/30">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur-sm animate-pulse"></div>
              <span className="relative text-slate-900 text-xl sm:text-2xl font-bold">🎆</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-sans tracking-tight">NFT Raffles</h2>
              <p className="text-slate-300 mt-1 text-sm sm:text-base font-medium">Discover amazing NFTs • Win incredible prizes</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  console.log('🔄 Clearing cache and refreshing...');
                  clearCache();
                  refetch();
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-600/50"
                title="Refresh and clear cache"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => setShowExpired(!showExpired)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  showExpired 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
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
                  {filteredRaffles.map((raffle) => {
                    const quantity = ticketQuantities[raffle.raffleContract] || 1;
                    const totalCost = (parseFloat(raffle.ticketPrice) * quantity).toFixed(3);
                    const progress = (raffle.ticketsSold / raffle.maxTickets) * 100;
                    const availableTickets = raffle.maxTickets - raffle.ticketsSold;
                    const isExpired = !raffle.isActive;
              
                    return (
                      <div key={`${raffle.raffleContract}-${raffle.raffleId}`} className={`relative bg-slate-800/60 border rounded-2xl overflow-hidden transition-all duration-300 group ${
                        isExpired 
                          ? 'border-slate-600/30 opacity-75' 
                          : 'border-emerald-400/20 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20'
                      }`}>
                        {!isExpired && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        )}
                        {/* NFT Image */}
                        <div className="relative">
                          <NFTImage 
                            contractAddress={raffle.nftContract}
                            tokenId={raffle.tokenId.toString()}
                            className="w-full h-80 sm:h-96"
                            showName={true}
                          />
                          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-sm border border-emerald-400/30 rounded-xl px-3 py-2">
                            <p className="text-emerald-300 font-semibold text-sm">{raffle.ticketPrice} APE</p>
                            <p className="text-slate-400 text-xs">per ticket</p>
                          </div>
                          {isExpired && (
                            <div className="absolute top-3 left-3 bg-red-900/90 backdrop-blur-sm border border-red-400/30 rounded-xl px-3 py-2">
                              <p className="text-red-300 font-semibold text-sm">EXPIRED</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="relative z-10 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-1">
                                NFT #{raffle.tokenId}
                              </h4>
                              <p className="text-slate-400 text-xs font-mono break-all">
                                {raffle.nftContract}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-slate-400">{isExpired ? 'Final Results' : 'Tickets Available'}</span>
                              <span className="text-white">{isExpired ? `${raffle.ticketsSold}/${raffle.maxTickets} sold` : `${availableTickets}/${raffle.maxTickets}`}</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-300 shadow-sm ${
                                  isExpired 
                                    ? 'bg-gradient-to-r from-slate-500 to-slate-600 shadow-slate-500/50' 
                                    : 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-emerald-400/50'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <p className="text-slate-400">{isExpired ? 'Status' : 'Time Left'}</p>
                              <p className={`font-mono ${
                                isExpired ? 'text-red-300' : 'text-white'
                              }`}>
                                {isExpired ? 'Ended' : formatTimeRemaining(raffle.endTime)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">{isExpired ? 'Winner' : 'Win Chance'}</p>
                              <p className="text-white font-mono">
                                {isExpired 
                                  ? (raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' 
                                      ? `${raffle.winner.slice(0, 6)}...${raffle.winner.slice(-4)}` 
                                      : 'No winner')
                                  : `${(quantity / raffle.maxTickets * 100).toFixed(1)}%`
                                }
                              </p>
                            </div>
                          </div>

                          {/* APE Token Balance */}
                          {!isExpired && (
                            <div className="mb-4">
                              <ApeTokenBalance 
                                requiredAmount={totalCost}
                              />
                            </div>
                          )}

                          {/* Buy Tickets Section */}
                          <div className="border-t border-slate-700/50 pt-4">
                            {isExpired ? (
                              <div className="text-center py-4">
                                <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <span className="text-red-400 text-xl">⏰</span>
                                </div>
                                <p className="text-red-400 font-mono font-semibold mb-1">RAFFLE ENDED</p>
                                <p className="text-slate-400 text-sm font-mono">
                                  {raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' 
                                    ? `Winner: ${raffle.winner.slice(0, 6)}...${raffle.winner.slice(-4)}` 
                                    : 'No tickets were sold'}
                                </p>
                              </div>
                            ) : address && raffle.creator.toLowerCase() === address.toLowerCase() ? (
                              <div className="text-center py-4">
                                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <span className="text-yellow-400 text-xl">👑</span>
                                </div>
                                <p className="text-yellow-400 font-mono font-semibold mb-1">YOUR RAFFLE</p>
                                <p className="text-slate-400 text-sm font-mono">Creators cannot buy their own tickets</p>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="flex-1">
                                    <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={Math.min(100, availableTickets)}
                                      value={quantity}
                                      onChange={(e) => setTicketQuantity(raffle.raffleContract, parseInt(e.target.value) || 1, availableTickets)}
                                      className="w-full bg-slate-800/80 border border-emerald-400/30 rounded-xl px-3 py-2 text-slate-100 text-sm font-mono focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all"
                                    />
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-slate-400 mb-1">Total Cost</p>
                                    <p className="text-white font-semibold">{totalCost} APE</p>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleBuyTickets(raffle)}
                                  disabled={buyingTickets === raffle.raffleContract || buyingPending || availableTickets === 0}
                                  className="relative w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2 overflow-hidden group shadow-lg hover:shadow-emerald-500/25"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                  {(buyingTickets === raffle.raffleContract || buyingPending) ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span className="relative">PROCESSING...</span>
                                    </>
                                  ) : availableTickets === 0 ? (
                                    <span className="relative">PROTOCOL.FULL</span>
                                  ) : (
                                    <>
                                      <span className="relative">⚡</span>
                                      <span className="relative">ACQUIRE {quantity} TICKET{quantity > 1 ? 'S' : ''}</span>
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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