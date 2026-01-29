import React from 'react';
import { useChainId } from 'wagmi';
import { config as envConfig } from '../config/environment';
import { addApeChainTestnet } from '../utils/addTestnet';

export const NetworkMismatchBanner = () => {
  const chainId = useChainId();
  
  // Only show in staging when connected to wrong network
  if (envConfig.environment !== 'staging') return null;
  if (chainId === 33111) return null; // Already on correct testnet
  
  const handleAddNetwork = async () => {
    try {
      await addApeChainTestnet();
    } catch (error) {
      console.error('Failed to add network:', error);
    }
  };

  return (
    <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4 mb-4 mx-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-yellow-300 font-semibold text-sm">Wrong Network Detected</h3>
          <p className="text-yellow-200 text-xs mt-1">
            Staging requires ApeChain Testnet. Current: {chainId}
          </p>
        </div>
        <button
          onClick={handleAddNetwork}
          className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold text-sm hover:bg-yellow-400 transition-colors"
        >
          Add Testnet
        </button>
      </div>
    </div>
  );
};