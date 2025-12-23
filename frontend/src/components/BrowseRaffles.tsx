import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount } from 'wagmi';
import ApeTokenBalance from './ApeTokenBalance';
import BasicNFTImage from './BasicNFTImage';
import toast from 'react-hot-toast';
import { useAllRaffles } from '../hooks/useRafflePositions';
import { useBuyTickets } from '../hooks/useRaffleContract';
import { useWinnerSelection } from '../hooks/useWinnerSelection';
import { throttle, useVirtualScrolling } from '../utils/performance';

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

// Memoized raffle card component for performance
const RaffleCard = React.memo(({ raffle, index, ticketQuantities, setTicketQuantity, handleBuyTickets, handleWinnerSelection, processingRaffles, formatTimeRemaining, address }: {
  raffle: CreatedRaffle;
  index: number;
  ticketQuantities: {[key: string]: number};
  setTicketQuantity: (contract: string, quantity: number, maxAvailable: number) => void;
  handleBuyTickets: (raffle: CreatedRaffle) => void;
  handleWinnerSelection: (raffle: CreatedRaffle) => void;
  processingRaffles: Set<string>;
  formatTimeRemaining: (endTime: number) => string;
  address?: string;
}) => {
  const quantity = ticketQuantities[raffle.raffleContract] || 1;
  const totalCost = (parseFloat(raffle.ticketPrice) * quantity).toFixed(3);
  const progress = (raffle.ticketsSold / raffle.maxTickets) * 100;
  const availableTickets = raffle.maxTickets - raffle.ticketsSold;
  const isExpired = !raffle.isActive || raffle.completed;

  return (
    <div key={`${raffle.raffleContract}-${raffle.raffleId}`} className={`relative bg-black/80 backdrop-blur-xl border rounded-xl overflow-hidden transition-all duration-300 group shadow-lg ${
      isExpired 
        ? 'border-slate-600/30 opacity-75' 
        : 'border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20'
    }`}>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-xl blur-sm animate-pulse"></div>
      {!isExpired && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
      {/* NFT Image */}
      <div className="relative">
        <BasicNFTImage 
          contractAddress={raffle.nftContract}
          tokenId={raffle.tokenId.toString()}
          className="w-full h-80 sm:h-96"
          showName={true}
          size="lg"
        />
        <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-sm border border-cyan-400/30 rounded-xl px-3 py-2">
          <p className="text-cyan-300 font-semibold text-sm">{raffle.ticketPrice} APE</p>
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
            <h4 className="text-lg font-semibold text-pink-300 mb-1 font-mono tracking-wider">
              NFT #{raffle.tokenId}
            </h4>
            <p className="text-pink-400/70 text-xs font-mono break-all">
              {raffle.nftContract}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-pink-400/70 font-mono tracking-wide">{isExpired ? 'Final Results' : 'Tickets Available'}</span>
            <span className="text-pink-300 font-mono tracking-wider">{isExpired ? `${raffle.ticketsSold}/${raffle.maxTickets} sold` : `${availableTickets}/${raffle.maxTickets}`}</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 shadow-sm ${
                isExpired 
                  ? 'bg-gradient-to-r from-slate-500 to-slate-600 shadow-slate-500/50' 
                  : 'bg-gradient-to-r from-emerald-400 to-green-400 shadow-emerald-400/50'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-pink-400/70 font-mono tracking-wide">{isExpired ? 'Status' : 'Time Left'}</p>
            <p className={`font-mono tracking-wider ${
              isExpired ? 'text-red-300' : 'text-pink-300'
            }`}>
              {isExpired ? 'Ended' : formatTimeRemaining(raffle.endTime)}
            </p>
          </div>
          <div>
            <p className="text-pink-400/70 font-mono tracking-wide">{isExpired ? 'Winner' : 'Tickets Sold'}</p>
            <p className="text-pink-300 font-mono tracking-wider">
              {isExpired 
                ? (raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' 
                    ? `${raffle.winner.slice(0, 6)}...${raffle.winner.slice(-4)}` 
                    : 'No winner')
                : `${raffle.ticketsSold}/${raffle.maxTickets}`
              }
            </p>
          </div>
        </div>



        {/* Buy Tickets Section */}
        <div className="border-t border-slate-700/50 pt-4">
          {isExpired ? (
            <div className="text-center py-4">
              {raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' ? (
                <>
                  <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-400 text-xl">🏆</span>
                  </div>
                  <p className="text-green-400 font-mono font-semibold mb-1">WINNER SELECTED</p>
                  <p className="text-slate-400 text-sm font-mono">
                    Winner: {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}
                  </p>
                </>
              ) : raffle.ticketsSold > 0 && address && raffle.creator.toLowerCase() === address.toLowerCase() ? (
                <>
                  <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-yellow-400 text-xl">🎲</span>
                  </div>
                  <p className="text-yellow-400 font-mono font-semibold mb-2">SELECT WINNER</p>
                  <button
                    onClick={() => handleWinnerSelection(raffle)}
                    disabled={processingRaffles.has(raffle.raffleContract)}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed text-sm"
                  >
                    {processingRaffles.has(raffle.raffleContract) ? 'Processing...' : 'Start Winner Selection'}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-red-400 text-xl">⏰</span>
                  </div>
                  <p className="text-red-400 font-mono font-semibold mb-1">RAFFLE ENDED</p>
                  <p className="text-slate-400 text-sm font-mono">No tickets were sold</p>
                </>
              )}
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
                  <label className="block text-xs text-pink-400/70 font-mono tracking-wide mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={Math.min(100, availableTickets)}
                    value={quantity}
                    onChange={(e) => setTicketQuantity(raffle.raffleContract, parseInt(e.target.value) || 1, availableTickets)}
                    className="w-full bg-slate-800/80 border border-cyan-400/30 rounded-xl px-3 py-2 text-pink-300 text-sm font-mono focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all"
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs text-pink-400/70 font-mono tracking-wide mb-1">Total Cost</p>
                  <p className="text-pink-300 font-semibold font-mono tracking-wider">{totalCost} APE</p>
                </div>
              </div>
              
              <button
                onClick={() => handleBuyTickets(raffle)}
                disabled={processingRaffles.has(raffle.raffleContract) || availableTickets === 0}
                className="relative w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2 overflow-hidden group shadow-lg hover:shadow-emerald-500/25 font-mono tracking-wider"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {processingRaffles.has(raffle.raffleContract) ? (
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
});

export default function BrowseRaffles() {
  const { address } = useAccount();
  
  const [ticketQuantities, setTicketQuantities] = useState<{[key: string]: number}>({});
  const [showExpired, setShowExpired] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [processingRaffles, setProcessingRaffles] = useState<Set<string>>(new Set());
  
  const BATCH_SIZE = 10;
  const { raffles, loading, refetch } = useAllRaffles(BATCH_SIZE, currentPage * BATCH_SIZE);

  const [hasMoreRaffles, setHasMoreRaffles] = useState(true);

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



  const { buyTickets, isSuccess: buySuccess, error: buyError } = useBuyTickets();
  const { startWinnerSelection, revealWinner, emergencyReveal, isPending: selectionPending, revealSuccess } = useWinnerSelection();

  // Auto-refresh when winner selection completes
  useEffect(() => {
    if (revealSuccess) {
      // Clear processing state and refetch data
      setProcessingRaffles(new Set());
      refetch();
    }
  }, [revealSuccess, refetch]);

  // Periodic refresh when transactions are pending (for mobile compatibility)
  useEffect(() => {
    if (processingRaffles.size > 0) {
      const interval = setInterval(() => {
        refetch();
      }, 3000); // Refresh every 3 seconds when processing
      
      return () => clearInterval(interval);
    }
  }, [processingRaffles.size, refetch]);

  const handleBuyTickets = async (raffle: CreatedRaffle) => {
    if (processingRaffles.has(raffle.raffleContract)) return;
    
    const quantity = ticketQuantities[raffle.raffleContract] || 1;
    const availableTickets = raffle.maxTickets - raffle.ticketsSold;
    
    if (quantity > availableTickets) {
      toast.error(`Only ${availableTickets} tickets available`);
      return;
    }
    
    setProcessingRaffles(prev => new Set(prev).add(raffle.raffleContract));
    
    try {
      await buyTickets(raffle.raffleContract, quantity, raffle.ticketPrice);
      // Success handling is done in the useEffect for buySuccess
    } catch (error) {
      console.error('Failed to buy tickets:', error);
      toast.error('Failed to purchase tickets. Please try again.');
      // Always clear processing state on error
      setProcessingRaffles(prev => {
        const newSet = new Set(prev);
        newSet.delete(raffle.raffleContract);
        return newSet;
      });
    }
  };

  const handleWinnerSelection = async (raffle: CreatedRaffle) => {
    if (processingRaffles.has(raffle.raffleContract)) return;
    
    setProcessingRaffles(prev => new Set(prev).add(raffle.raffleContract));
    
    try {
      await startWinnerSelection(raffle.raffleContract);
      // Hook handles cache invalidation automatically
      setProcessingRaffles(prev => {
        const newSet = new Set(prev);
        newSet.delete(raffle.raffleContract);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to start winner selection:', error);
      toast.error('Failed to start winner selection. Please try again.');
      setProcessingRaffles(prev => {
        const newSet = new Set(prev);
        newSet.delete(raffle.raffleContract);
        return newSet;
      });
    }
  };

  // Handle buy success
  useEffect(() => {
    if (buySuccess) {
      setTicketQuantities({});
      setProcessingRaffles(new Set());
      // Hook handles cache invalidation automatically
    }
  }, [buySuccess]);

  // Handle buy error
  useEffect(() => {
    if (buyError) {
      // Clear processing state on error
      setProcessingRaffles(new Set());
      
      if (buyError.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else {
        toast.error('Failed to buy tickets');
      }
    }
  }, [buyError]);

  // Optimized ticket quantity setter with throttling
  const setTicketQuantity = useCallback(
    throttle((raffleContract: string, quantity: number, maxAvailable: number) => {
      setTicketQuantities(prev => ({
        ...prev,
        [raffleContract]: Math.max(1, Math.min(25, maxAvailable, quantity))
      }));
    }, 100),
    []
  );
  
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
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-600/50"
                title="Refresh"
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
                  {filteredRaffles.map((raffle, index) => (
                    <RaffleCard
                      key={`${raffle.raffleContract}-${raffle.raffleId}`}
                      raffle={raffle}
                      index={index}
                      ticketQuantities={ticketQuantities}
                      setTicketQuantity={setTicketQuantity}
                      handleBuyTickets={handleBuyTickets}
                      handleWinnerSelection={handleWinnerSelection}
                      processingRaffles={processingRaffles}
                      formatTimeRemaining={formatTimeRemaining}
                      address={address}
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