import React from 'react';
import { useChainId, useAccount } from 'wagmi';
import { getRaffleFactoryAddress, getContracts } from '../config/addresses';

export const QuickDebug: React.FC = () => {
  const chainId = useChainId();
  const { address } = useAccount();
  const contracts = getContracts(chainId);
  const factoryAddress = getRaffleFactoryAddress(chainId, true);
  
  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs max-w-sm z-50 border border-gray-600">
      <div className="font-bold mb-2">🔍 Network Debug</div>
      <div><strong>Chain ID:</strong> {chainId}</div>
      <div><strong>Network:</strong> {chainId === 8453 ? 'Base' : chainId === 33139 ? 'ApeChain' : 'Other'}</div>
      <div><strong>Wallet:</strong> {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Not connected'}</div>
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div><strong>Factory:</strong></div>
        <div className="break-all">{factoryAddress}</div>
      </div>
      <div className="mt-1">
        <div><strong>Expected Base:</strong></div>
        <div className="break-all">0xDE107f1463d97134122b6b42137EBfEd996B0F43</div>
      </div>
      <div className="mt-1">
        <div className={factoryAddress === '0xDE107f1463d97134122b6b42137EBfEd996B0F43' ? 'text-green-400' : 'text-red-400'}>
          {factoryAddress === '0xDE107f1463d97134122b6b42137EBfEd996B0F43' ? '✅ Correct Address' : '❌ Wrong Address'}
        </div>
      </div>
    </div>
  );
};

export default QuickDebug;