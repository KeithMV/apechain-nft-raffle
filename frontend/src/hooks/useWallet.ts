import { useAccount, useChainId } from 'wagmi';
import { apeChain } from '../config/wagmi';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const isWrongNetwork = isConnected && chainId !== apeChain.id;
  const isReady = isConnected && !isWrongNetwork;
  
  return {
    address,
    isConnected,
    isWrongNetwork,
    isReady,
    chainId,
  };
}