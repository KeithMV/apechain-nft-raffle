export const addApeChainToMetaMask = async (): Promise<void> => {
  // Proper type guard for ethereum object
  if (typeof window === 'undefined' || !window.ethereum || !window.ethereum.request) {
    console.warn('Ethereum provider not available');
    return;
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
    console.log('ApeChain network added successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to add ApeChain to MetaMask:', error.message);
    } else {
      console.error('Failed to add ApeChain to MetaMask:', error);
    }
  }
};