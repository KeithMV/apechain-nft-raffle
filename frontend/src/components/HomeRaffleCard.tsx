/**
 * Home Raffle Card Component
 * Displays raffle information in a card format for the home page
 */

import React from 'react';
import BasicNFTImage from './BasicNFTImage';

export interface HomeRaffleCardProps {
  id: number;
  nftName: string;
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  ticketsSold: number;
  maxTickets: number;
  timeRemaining: string;
  creator: string;
}

const HomeRaffleCard: React.FC<HomeRaffleCardProps> = ({
  nftName,
  nftContract,
  tokenId,
  ticketPrice,
  ticketsSold,
  maxTickets,
  timeRemaining,
  creator
}) => {
  const progress = (ticketsSold / maxTickets) * 100;
  
  return (
    <div className="card">
      <div className="mb-4">
        <BasicNFTImage 
          contractAddress={nftContract}
          tokenId={tokenId}
          className="w-full h-48 rounded-lg"
          size="lg"
        />
      </div>
      
      <div className="card-header">
        <h3 className="card-title">{nftName}</h3>
        <p className="card-subtitle">by {creator.slice(0, 6)}...{creator.slice(-4)}</p>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-muted">Ticket Price</p>
          <p className="text-lg font-semibold text-primary">{ticketPrice} APE</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">Time Left</p>
          <p className="text-lg font-semibold text-accent">{timeRemaining}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted">Progress</span>
          <span className="font-medium">{ticketsSold}/{maxTickets} tickets</span>
        </div>
        <div className="w-full bg-neutral-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex gap-4">
        <button className="btn-primary flex-1">
          Buy Tickets
        </button>
        <button className="btn-secondary">
          View Details
        </button>
      </div>
    </div>
  );
};

export default HomeRaffleCard;