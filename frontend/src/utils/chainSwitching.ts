import { useSwitchChain } from 'wagmi';
import { apeChain } from '../config/wagmi';

export function useApeChainSwitching() {
  const { switchChain, isPending } = useSwitchChain();

  const switchToApeChain = async () => {
    try {
      await switchChain({ chainId: apeChain.id });
      return true;
    } catch (error) {
      console.error('Failed to switch to ApeChain:', error);
      return false;
    }
  };

  return {
    switchToApeChain,
    isSwitching: isPending,
  };
}