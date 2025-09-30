import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { rafflePositionService, CreatedRaffle } from '../services/rafflePositionService';
import { raffleContractService } from '../services/raffleContractService';
import ApeTokenBalance from './ApeTokenBalance';
import NFTImage from './NFTImage';
import toast from 'react-hot-toast';

export default function BrowseRaffles() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [activeRaffles, setActiveRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingTickets, setBuyingTickets] = useState<string | null>(null);
  const [ticketQuantities, setTicketQuantities] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (publicClient) {
      loadActiveRaffles();
    }
  }, [publicClient]);

  const loadActiveRaffles = async () => {
    if (!publicClient) return;
    
    setLoading(true);
    try {
      const raffles = await rafflePositionService.getActiveRaffles(publicClient, 50);
      setActiveRaffles(raffles);
    } catch (error) {
      console.error('Failed to load active raffles:', error);
      toast.error('Failed to load raffles');
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

  const handleBuyTickets = async (raffle: CreatedRaffle) => {
    const quantity = ticketQuantities[raffle.raffleContract] || 1;
    const availableTickets = raffle.maxTickets - raffle.ticketsSold;
    
    if (quantity < 1 || quantity > 50) {
      toast.error('Please enter a valid quantity (1-50)');
      return;
    }
    
    if (quantity > availableTickets) {
      toast.error(`Only ${availableTickets} tickets available`);
      return;
    }

    setBuyingTickets(raffle.raffleContract);
    try {
      await raffleContractService.buyTickets({
        raffleContract: raffle.raffleContract,
        quantity,
        ticketPrice: raffle.ticketPrice
      });
      
      toast.success(`Successfully bought ${quantity} ticket${quantity > 1 ? 's' : ''}!`);
      loadActiveRaffles(); // Refresh data
      
      // Reset quantity
      setTicketQuantities(prev => ({
        ...prev,
        [raffle.raffleContract]: 1
      }));
      
    } catch (error: any) {
      console.error('Failed to buy tickets:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        const requiredAmount = (parseFloat(raffle.ticketPrice) * quantity).toFixed(3);
        toast.error('Insufficient APE balance - you need ' + requiredAmount + ' APE tokens');
      } else if (error.message?.includes('execution reverted')) {
        toast.error('Transaction failed - ensure you have enough APE tokens and try again');
      } else if (error.message?.includes('allowance')) {
        toast.error('Please approve APE spending for this contract first');
      } else {
        toast.error('Failed to buy tickets: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setBuyingTickets(null);
    }
  };

  const setTicketQuantity = (raffleContract: string, quantity: number, maxAvailable: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [raffleContract]: Math.max(1, Math.min(Math.min(50, maxAvailable), quantity))
    }));
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-slate-300">Loading active raffles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-4 sm:px-8 py-6 sm:py-8 border-b border-slate-700/50">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg sm:text-xl">🔍</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Browse Active Raffles</h2>
            <p className="text-slate-300 mt-1 text-sm sm:text-base">Buy tickets for a chance to win amazing NFTs</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8">
        {activeRaffles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-slate-400 text-2xl">🎫</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No Active Raffles</h3>
            <p className="text-slate-400">There are no active raffles at the moment. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeRaffles.map((raffle) => {
              const quantity = ticketQuantities[raffle.raffleContract] || 1;
              const totalCost = (parseFloat(raffle.ticketPrice) * quantity).toFixed(3);
              const progress = (raffle.ticketsSold / raffle.maxTickets) * 100;
              const availableTickets = raffle.maxTickets - raffle.ticketsSold;
              
              return (
                <div key={`${raffle.raffleContract}-${raffle.raffleId}`} className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-purple-400/30 transition-colors">
                  {/* NFT Image */}
                  <div className="relative">
                    <NFTImage 
                      contractAddress={raffle.nftContract}
                      tokenId={raffle.tokenId.toString()}
                      className="w-full h-48 sm:h-56"
                      showName={true}
                    />
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                      <p className="text-purple-300 font-semibold text-sm">{raffle.ticketPrice} APE</p>
                      <p className="text-slate-400 text-xs">per ticket</p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-1">
                          NFT #{raffle.tokenId}
                        </h4>
                        <p className="text-slate-400 text-sm font-mono">
                          {raffle.nftContract.slice(0, 6)}...{raffle.nftContract.slice(-4)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Tickets Available</span>
                        <span className="text-white">{availableTickets}/{raffle.maxTickets}</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-slate-400">Time Left</p>
                        <p className="text-white font-mono">{formatTimeRemaining(raffle.endTime)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Win Chance</p>
                        <p className="text-white font-mono">{raffle.ticketsSold > 0 ? (quantity / (raffle.ticketsSold + quantity) * 100).toFixed(1) : '0.0'}%</p>
                      </div>
                    </div>

                    {/* APE Token Balance */}
                    <div className="mb-4">
                      <ApeTokenBalance 
                        requiredAmount={totalCost}
                      />
                    </div>

                    {/* Buy Tickets Section */}
                    <div className="border-t border-slate-700/50 pt-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            max={Math.min(50, availableTickets)}
                            value={quantity}
                            onChange={(e) => setTicketQuantity(raffle.raffleContract, parseInt(e.target.value) || 1, availableTickets)}
                            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-400/50 focus:outline-none"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 mb-1">Total Cost</p>
                          <p className="text-white font-semibold">{totalCost} APE</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleBuyTickets(raffle)}
                        disabled={buyingTickets === raffle.raffleContract || availableTickets === 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {buyingTickets === raffle.raffleContract ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Buying...</span>
                          </>
                        ) : availableTickets === 0 ? (
                          <span>Sold Out</span>
                        ) : (
                          <>
                            <span>🎫</span>
                            <span>Buy {quantity} Ticket{quantity > 1 ? 's' : ''}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}