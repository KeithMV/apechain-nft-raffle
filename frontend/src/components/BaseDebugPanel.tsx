import React from 'react';
import { useChainId, useAccount } from 'wagmi';
import { getRaffleFactoryAddress, getContracts, getNetworkConfig } from '../config/addresses';
import { useVersionInfo } from '../hooks/useRaffleContractV4';

export const BaseDebugPanel: React.FC = () => {
  const chainId = useChainId();
  const { address } = useAccount();
  const { currentVersion, v4Available } = useVersionInfo();
  
  const networkConfig = getNetworkConfig(chainId);
  const contracts = getContracts(chainId);
  const factoryAddress = getRaffleFactoryAddress(chainId, true);
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔍 Base Debug Panel</h3>
      
      <div className="space-y-1">
        <div><strong>Chain ID:</strong> {chainId}</div>
        <div><strong>Network:</strong> {networkConfig.name}</div>
        <div><strong>Connected Address:</strong> {address}</div>
        <div><strong>Version:</strong> {currentVersion}</div>
        <div><strong>V4 Available:</strong> {v4Available ? '✅' : '❌'}</div>
        
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div><strong>Factory Address:</strong></div>
          <div className="break-all">{factoryAddress}</div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div><strong>Contract Config:</strong></div>
          <div>Factory: {contracts.RAFFLE_FACTORY}</div>
          <div>Factory V4: {contracts.RAFFLE_FACTORY_V4}</div>
          <div>Template: {contracts.RAFFLE_TEMPLATE}</div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div><strong>Expected Base Values:</strong></div>
          <div>Chain: 8453</div>
          <div>Factory: 0xeBB962e8949e67301B4d2c4727EBC689E22516f8</div>
        </div>
      </div>
    </div>
  );
};

export default BaseDebugPanel;