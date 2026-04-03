import React from 'react';
import BasicNFTImage from './BasicNFTImage';
import CopyAddress from './CopyAddress';
import { DashboardStyles } from '../hooks/useDashboardStyles';

export interface CreatedRaffle {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  ticketsSold: number;
  maxTickets: number;
  endTime: number;
  winner?: string;
  completed: boolean;
  isActive: boolean;
}

export interface CreatedRaffleCardProps {
  raffle: CreatedRaffle;
  styles: DashboardStyles;
  isApeChain: boolean;
  nativeCurrency: string;
  formatTimeRemaining: (endTime: number) => string;
  handleSelectWinner: (raffleContract: string) => void;
  handleCancelRaffle: (raffleContract: string) => void;
  selectingWinnerFor: string | null;
  cancellingRaffle: string | null;
}

const CreatedRaffleCard: React.FC<CreatedRaffleCardProps> = ({
  raffle,
  styles,
  isApeChain,
  nativeCurrency,
  formatTimeRemaining,
  handleSelectWinner,
  handleCancelRaffle,
  selectingWinnerFor,
  cancellingRaffle
}) => {
  return (
    <div className={`relative bg-black/80 backdrop-blur-xl border ${styles.cardBorderColor} rounded-xl overflow-hidden shadow-lg ${styles.cardShadowColor}`}>
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
            
            {/* Action Buttons - Fixed Logic */}
            <div className="space-y-2">
              {(() => {
                const now = Date.now() / 1000;
                const hasEnded = now > raffle.endTime;
                const hasTickets = raffle.ticketsSold > 0;
                
                // Show Select Winner button if: raffle ended, has tickets, not completed
                if (hasEnded && hasTickets && !raffle.completed) {
                  return (
                    <button
                      onClick={() => handleSelectWinner(raffle.raffleContract)}
                      disabled={selectingWinnerFor === raffle.raffleContract}
                      className={`relative bg-gradient-to-r ${isApeChain ? 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400' : 'from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'} disabled:from-gray-600 disabled:to-gray-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 font-mono tracking-wider overflow-hidden group`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${isApeChain ? 'from-emerald-400/20 to-emerald-300/20' : 'from-blue-400/20 to-blue-300/20'} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                      <span className="relative">
                        {selectingWinnerFor === raffle.raffleContract ? (
                          <span className="flex items-center space-x-2">
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Selecting...</span>
                          </span>
                        ) : (
                          '🏆 Select Winner'
                        )}
                      </span>
                    </button>
                  );
                }
                
                // Show Cancel button if: raffle ended, no tickets sold, not completed
                if (hasEnded && !hasTickets && !raffle.completed) {
                  return (
                    <button
                      onClick={() => handleCancelRaffle(raffle.raffleContract)}
                      disabled={cancellingRaffle === raffle.raffleContract}
                      className="relative bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-600 disabled:to-gray-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 font-mono tracking-wider overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-300/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <span className="relative">
                        {cancellingRaffle === raffle.raffleContract ? (
                          <span className="flex items-center space-x-2">
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Cancelling...</span>
                          </span>
                        ) : (
                          '❌ Cancel Raffle'
                        )}
                      </span>
                    </button>
                  );
                }
                
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatedRaffleCard;