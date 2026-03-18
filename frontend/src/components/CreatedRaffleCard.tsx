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
  );
};

export default CreatedRaffleCard;