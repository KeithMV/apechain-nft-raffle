export const addApeChainToMetaMask = async () => {
  if (typeof window.ethereum !== 'undefined') {
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
    } catch (error) {
      console.error('Failed to add ApeChain to MetaMask:', error);
    }
  }
};