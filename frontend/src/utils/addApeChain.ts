export const addApeChainToMetaMask = async (): Promise<{ success: boolean; error?: string }> => {
  // Proper type guard for ethereum object
  if (typeof window === 'undefined' || !window.ethereum || !window.ethereum.request) {
    const error = 'MetaMask not detected. Please install MetaMask to add ApeChain.';
    console.warn(error);
    return { success: false, error };
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x8133', // 33139 in hex
        chainName: 'ApeChain',
        nativeCurrency: {
          name: 'ApeCoin',
          symbol: 'APE',
          decimals: 18,
        },
        rpcUrls: ['https://apechain.calderachain.xyz/http'],
        blockExplorerUrls: ['https://apechain.calderaexplorer.xyz'],
      }],
    });
    return { success: true };
  } catch (error: unknown) {
    // Handle specific MetaMask error codes
    if (error && typeof error === 'object' && 'code' in error) {
      const metamaskError = error as { code: number; message?: string };
      
      switch (metamaskError.code) {
        case 4001:
          return { success: false, error: 'User rejected the request to add ApeChain' };
        case -32602:
          return { success: false, error: 'Invalid parameters for adding ApeChain' };
        case -32603:
          return { success: false, error: 'Internal error occurred while adding ApeChain' };
        default:
          const errorMsg = metamaskError.message || 'Unknown error occurred';
          console.error('Failed to add ApeChain:', errorMsg);
          return { success: false, error: `Failed to add ApeChain: ${errorMsg}` };
      }
    }
    
    // Handle generic errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Failed to add ApeChain:', errorMessage);
    return { success: false, error: `Failed to add ApeChain: ${errorMessage}` };
  }
};