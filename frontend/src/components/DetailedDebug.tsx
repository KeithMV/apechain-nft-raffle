import React, { useState } from 'react';
import { useChainId } from 'wagmi';
import { getRaffleFactoryAddress, getContracts } from '../config/addresses';
import { RAFFLE_FACTORY_ABI, BASE_RAFFLE_SYSTEM_ABI } from '../config/contracts';

export const DetailedDebug: React.FC = () => {
  const chainId = useChainId();
  const [testParams, setTestParams] = useState({
    nftContract: '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260',
    tokenId: '1064',
    ticketPrice: '0.001',
    maxTickets: '10',
    duration: '3600'
  });

  const contracts = getContracts(chainId);
  const factoryAddress = getRaffleFactoryAddress(chainId, true);
  const isBase = chainId === 8453 || chainId === 84532;
  const selectedABI = isBase ? BASE_RAFFLE_SYSTEM_ABI : RAFFLE_FACTORY_ABI;
  
  // Find createRaffle function in ABI
  const createRaffleFunction = selectedABI.find(f => f.name === 'createRaffle');
  
  const testContractCall = async () => {
    try {
      console.log('🔍 Testing contract call with exact parameters...');
      console.log('Chain ID:', chainId);
      console.log('Factory Address:', factoryAddress);
      console.log('Is Base:', isBase);
      console.log('ABI Function:', createRaffleFunction);
      
      if (isBase) {
        console.log('Base Parameters (optimized types):');
        console.log('- nftContract:', testParams.nftContract, '(address)');
        console.log('- tokenId:', parseInt(testParams.tokenId), '(uint32)');
        console.log('- ticketPrice:', testParams.ticketPrice, 'ETH (uint96)');
        console.log('- maxTickets:', parseInt(testParams.maxTickets), '(uint16)');
        console.log('- duration:', parseInt(testParams.duration), '(uint24)');
      } else {
        console.log('ApeChain Parameters (standard types):');
        console.log('- nftContract:', testParams.nftContract, '(address)');
        console.log('- tokenId:', testParams.tokenId, '(uint256)');
        console.log('- ticketPrice:', testParams.ticketPrice, 'ETH (uint256)');
        console.log('- maxTickets:', testParams.maxTickets, '(uint256)');
        console.log('- duration:', testParams.duration, '(uint256)');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black/95 text-white p-4 rounded-lg text-xs max-w-lg z-50 border border-gray-600 max-h-96 overflow-y-auto">
      <div className="font-bold mb-3">🔍 Detailed Debug Trace</div>
      
      <div className="space-y-2 mb-4">
        <div><strong>Chain ID:</strong> {chainId}</div>
        <div><strong>Is Base:</strong> {isBase ? 'Yes' : 'No'}</div>
        <div><strong>Factory:</strong> <span className="break-all">{factoryAddress}</span></div>
        <div><strong>ABI Selected:</strong> {isBase ? 'BASE_RAFFLE_SYSTEM_ABI' : 'RAFFLE_FACTORY_ABI'}</div>
        <div><strong>Function Found:</strong> {createRaffleFunction ? 'Yes' : 'No'}</div>
      </div>

      {createRaffleFunction && (
        <div className="mb-4">
          <div className="font-semibold mb-2">Function Signature:</div>
          <div className="bg-gray-800 p-2 rounded text-xs break-all">
            {createRaffleFunction.inputs?.map((input, i) => (
              <div key={i}>{input.name}: {input.type}</div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="font-semibold mb-2">Test Parameters:</div>
        <div className="space-y-1">
          <input 
            value={testParams.nftContract} 
            onChange={(e) => setTestParams(p => ({...p, nftContract: e.target.value}))}
            className="w-full bg-gray-800 text-white p-1 rounded text-xs"
            placeholder="NFT Contract"
          />
          <input 
            value={testParams.tokenId} 
            onChange={(e) => setTestParams(p => ({...p, tokenId: e.target.value}))}
            className="w-full bg-gray-800 text-white p-1 rounded text-xs"
            placeholder="Token ID"
          />
          <input 
            value={testParams.ticketPrice} 
            onChange={(e) => setTestParams(p => ({...p, ticketPrice: e.target.value}))}
            className="w-full bg-gray-800 text-white p-1 rounded text-xs"
            placeholder="Ticket Price"
          />
        </div>
      </div>

      <button 
        onClick={testContractCall}
        className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs font-semibold"
      >
        Test Contract Call
      </button>
    </div>
  );
};

export default DetailedDebug;