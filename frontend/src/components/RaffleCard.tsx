import React, { useMemo, useCallback } from 'react';
import BasicNFTImage from './BasicNFTImage';
import { LiveCountdown } from './LiveCountdown';
import { getRaffleUrgency, getSoldOutBadge } from '../utils/raffleUrgency';

export interface CreatedRaffle {
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
  version: 'v3' | 'v4';
}

export interface RaffleCardProps {
  raffle: CreatedRaffle;
  ticketQuantities: {[key: string]: number};
  setTicketQuantity: (contract: string, quantity: number, maxAvailable: number) => void;
  handleBuyTickets: (raffle: CreatedRaffle) => void;
  handleWinnerSelection: (raffle: CreatedRaffle) => void;
  processingRaffles: Set<string>;
  address?: string;
  nativeCurrency: string;
}

const RaffleCard = React.memo<RaffleCardProps>(({ 
  raffle, 
  ticketQuantities, 
  setTicketQuantity, 
  handleBuyTickets, 
  handleWinnerSelection, 
  processingRaffles, 
  address, 
  nativeCurrency 
}) => {
  // Memoize expensive calculations
  const { quantity, totalCost, progress, availableTickets, isExpired, urgencyInfo, soldOutBadge } = useMemo(() => {
    const qty = ticketQuantities[raffle.raffleContract] || 1;
    const cost = (parseFloat(raffle.ticketPrice) * qty).toFixed(3);
    const prog = (raffle.ticketsSold / raffle.maxTickets) * 100;
    const available = raffle.maxTickets - raffle.ticketsSold;
    const expired = !raffle.isActive || raffle.completed;
    const urgency = getRaffleUrgency(raffle.endTime);
    const soldOut = getSoldOutBadge(raffle.ticketsSold, raffle.maxTickets);
    
    return {
      quantity: qty,
      totalCost: cost,
      progress: prog,
      availableTickets: available,
      isExpired: expired,
      urgencyInfo: urgency,
      soldOutBadge: soldOut
    };
  }, [raffle.raffleContract, raffle.ticketPrice, raffle.ticketsSold, raffle.maxTickets, raffle.isActive, raffle.completed, raffle.endTime, ticketQuantities]);

  // Memoize input change handler
  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTicketQuantity(raffle.raffleContract, parseInt(e.target.value) || 1, availableTickets);
  }, [raffle.raffleContract, availableTickets, setTicketQuantity]);

  // Memoize winner display logic
  const winnerDisplay = useMemo(() => {
    if (!raffle.winner || raffle.winner === '0x0000000000000000000000000000000000000000') {
      return 'No winner';
    }
    return `${raffle.winner.slice(0, 6)}...${raffle.winner.slice(-4)}`;
  }, [raffle.winner]);

  // Memoize creator check
  const isCreator = useMemo(() => {
    return address && raffle.creator.toLowerCase() === address.toLowerCase();
  }, [address, raffle.creator]);

  // Memoize processing state
  const isProcessing = useMemo(() => {
    return processingRaffles.has(raffle.raffleContract);
  }, [processingRaffles, raffle.raffleContract]);

  return (
    <div className={`relative bg-black/80 backdrop-blur-xl border rounded-xl overflow-hidden transition-all duration-300 group shadow-lg ${
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
          <p className="text-cyan-300 font-semibold text-sm">{raffle.ticketPrice} {nativeCurrency}</p>
          <p className="text-slate-400 text-xs">per ticket</p>
        </div>
        {isExpired && (
          <div className="absolute top-3 left-3 bg-red-900/90 backdrop-blur-sm border border-red-400/30 rounded-xl px-3 py-2">
            <p className="text-red-300 font-semibold text-sm">EXPIRED</p>
          </div>
        )}
        {!isExpired && urgencyInfo.urgencyLevel !== 'low' && (
          <div className={`absolute top-3 left-3 ${urgencyInfo.color} backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg`}>
            <p className="font-bold text-xs sm:text-sm whitespace-nowrap">{urgencyInfo.badge}</p>
          </div>
        )}
        {!isExpired && soldOutBadge && (
          <div className={`absolute bottom-3 left-3 ${soldOutBadge.color} backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg`}>
            <p className="font-bold text-xs sm:text-sm whitespace-nowrap">{soldOutBadge.badge}</p>
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
            {isExpired ? (
              <p className="text-red-300 font-mono tracking-wider">Ended</p>
            ) : (
              <LiveCountdown 
                endTime={raffle.endTime} 
                isActive={raffle.isActive} 
                className="tracking-wider"
              />
            )}
          </div>
          <div>
            <p className="text-pink-400/70 font-mono tracking-wide">{isExpired ? 'Winner' : 'Tickets Sold'}</p>
            <p className="text-pink-300 font-mono tracking-wider">
              {isExpired 
                ? winnerDisplay
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
                  </div>
                  <p className="text-green-400 font-mono font-semibold mb-1">WINNER SELECTED</p>
                  <p className="text-slate-400 text-sm font-mono">
                    Winner: {winnerDisplay}
                  </p>
                </>
              ) : raffle.ticketsSold > 0 && isCreator ? (
                <>
                  <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  </div>
                  <p className="text-yellow-400 font-mono font-semibold mb-2">SELECT WINNER</p>
                  <button
                    onClick={() => handleWinnerSelection(raffle)}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed text-sm"
                  >
                    {isProcessing ? 'Processing...' : 'Start Winner Selection'}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  </div>
                  <p className="text-red-400 font-mono font-semibold mb-1">RAFFLE ENDED</p>
                  <p className="text-slate-400 text-sm font-mono">No tickets were sold</p>
                </>
              )}
            </div>
          ) : isCreator ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
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
                    onChange={handleQuantityChange}
                    className="w-full bg-slate-800/80 border border-cyan-400/30 rounded-xl px-3 py-2 text-pink-300 text-sm font-mono focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all"
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs text-pink-400/70 font-mono tracking-wide mb-1">Total Cost</p>
                  <p className="text-pink-300 font-semibold font-mono tracking-wider">{totalCost} {nativeCurrency}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleBuyTickets(raffle)}
                disabled={isProcessing || availableTickets === 0}
                className="relative w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2 overflow-hidden group shadow-lg hover:shadow-emerald-500/25 font-mono tracking-wider"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="relative">PROCESSING...</span>
                  </>
                ) : availableTickets === 0 ? (
                  <span className="relative">PROTOCOL.FULL</span>
                ) : (
                  <>
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

RaffleCard.displayName = 'RaffleCard';

export default RaffleCard;