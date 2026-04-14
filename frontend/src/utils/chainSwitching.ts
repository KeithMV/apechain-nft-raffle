import { useSwitchChain } from 'wagmi';
import { apeChain, polygon } from '../config/wagmi';

export function useApeChainSwitching() {
  const { switchChain, isPending } = useSwitchChain();

  const switchToApeChain = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await switchChain({ chainId: apeChain.id });
      return { success: true };
    } catch (error: unknown) {
      // Handle specific wallet errors
      if (error && typeof error === 'object' && 'cause' in error) {
        const walletError = error.cause as any;
        
        if (walletError?.code === 4001) {
          return { success: false, error: 'User rejected the network switch request' };
        }
        if (walletError?.code === -32002) {
          return { success: false, error: 'Network switch request already pending' };
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to switch to ApeChain:', errorMessage);
      return { success: false, error: `Failed to switch to ApeChain: ${errorMessage}` };
    }
  };

  return {
    switchToApeChain,
    isSwitching: isPending,
  };
}