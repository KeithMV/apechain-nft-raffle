import { config as envConfig } from '../config/environment';

export const addApeChainTestnet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not detected');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x8117', // 33111 in hex
        chainName: 'ApeChain Testnet',
        nativeCurrency: {
          name: 'ApeCoin',
          symbol: 'APE',
          decimals: 18,
        },
        rpcUrls: ['https://curtis.rpc.caldera.xyz/http'],
        blockExplorerUrls: ['https://curtis.explorer.caldera.xyz'],
      }],
    });
  } catch (error) {
    console.error('Failed to add ApeChain Testnet:', error);
    throw error;
  }
};

export const AddNetworkButton = () => {
  if (envConfig.environment !== 'staging') return null;

  const handleAddNetwork = async () => {
    try {
      await addApeChainTestnet();
    } catch (error) {
      console.error('Failed to add network:', error);
    }
  };

  return (
    <button
      onClick={handleAddNetwork}
      className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 rounded text-xs hover:bg-yellow-500/30 transition-colors"
    >
      Add Testnet to MetaMask
    </button>
  );
};