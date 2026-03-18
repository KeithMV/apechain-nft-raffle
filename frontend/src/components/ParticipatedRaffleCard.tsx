import React from 'react';
import BasicNFTImage from './BasicNFTImage';
import CopyAddress from './CopyAddress';
import { DashboardStyles } from '../hooks/useDashboardStyles';

export interface UserRafflePosition {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  userTickets: number;
  ticketsSold: number;
  maxTickets: number;
  endTime: number;
  isWinner: boolean;
  completed: boolean;
  isActive: boolean;
}

export interface ParticipatedRaffleCardProps {
  position: UserRafflePosition;
  styles: DashboardStyles;
  isApeChain: boolean;
  formatTimeRemaining: (endTime: number) => string;
}

const ParticipatedRaffleCard: React.FC<ParticipatedRaffleCardProps> = ({
  position,
  styles,
  isApeChain,
  formatTimeRemaining
}) => {
  return (
    <div className={`relative bg-black/80 backdrop-blur-xl border ${styles.cardBorderColor} rounded-xl overflow-hidden shadow-lg ${styles.cardShadowColor}`}>
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
  );
};

export default ParticipatedRaffleCard;