/**
 * @deprecated Use useWalletConnection hook instead for full wallet functionality
 * This hook is kept for backward compatibility
 */

import { useWalletConnection } from './useWalletConnection';
import { useChainId } from 'wagmi';
import { apeChain } from '../config/wagmi';

export function useWallet() {
  const { address, isConnected, isWrongNetwork } = useWalletConnection();
  const chainId = useChainId();
  
  const isReady = isConnected && !isWrongNetwork;
  
  return {
    address,
    isConnected,
    isWrongNetwork,
    isReady,
    chainId,
  };
}