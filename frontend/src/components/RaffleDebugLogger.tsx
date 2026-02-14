import React, { useEffect } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { getRaffleFactoryAddress } from '../config/addresses';

export const RaffleDebugLogger: React.FC<{ 
  nftContract?: string;
  tokenId?: string;
  ticketPrice?: string;
  maxTickets?: number;
  duration?: number;
}> = ({ nftContract, tokenId, ticketPrice, maxTickets, duration }) => {
  const chainId = useChainId();
  const { address } = useAccount();
  
  useEffect(() => {
    console.log('🔍 RAFFLE DEBUG INFO:');
    console.log('Chain ID:', chainId);
    console.log('User Address:', address);
    console.log('Factory Address:', getRaffleFactoryAddress(chainId, true));
    console.log('NFT Contract:', nftContract);
    console.log('Token ID:', tokenId);
    console.log('Ticket Price:', ticketPrice);
    console.log('Max Tickets:', maxTickets);
    console.log('Duration:', duration);
    console.log('Expected Base Chain ID: 8453');
    console.log('Is Base Network:', chainId === 8453);
  }, [chainId, address, nftContract, tokenId, ticketPrice, maxTickets, duration]);

  return null; // Invisible component
};