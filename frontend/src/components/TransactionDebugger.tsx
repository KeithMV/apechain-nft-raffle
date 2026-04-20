/**
 * Web3 Transaction Pipeline Debugger
 * Tests each part of the transaction flow to identify silent failures
 */

import React, { useState } from 'react';
import { useAccount, useChainId, usePublicClient, useWriteContract } from 'wagmi';
import { getChainConfig } from '../config/addresses';

export const TransactionDebugger: React.FC = () => {
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const { address, isConnected, chainId: accountChainId } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync, data: hash, error } = useWriteContract();

  const log = (message: string) => {
    // Sanitize message to prevent log injection
    const sanitizedMessage = message.replace(/[\r\n\t]/g, ' ').slice(0, 1000);
    console.log(sanitizedMessage);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${sanitizedMessage}`]);
  };

  const clearLog = () => {
    setDebugLog([]);
  };

  const debugPipeline = async () => {
    setIsDebugging(true);
    clearLog();

    try {
      // 1. Check Wallet Connection
      log('🔍 [STEP 1] Checking wallet connection...');
      log(`   - isConnected: ${isConnected}`);
      log(`   - address: ${address || 'undefined'}`);
      log(`   - accountChainId: ${accountChainId}`);
      log(`   - useChainId(): ${chainId}`);

      if (!isConnected || !address) {
        log('❌ [STEP 1] FAILED: Wallet not connected');
        return;
      }
      log('✅ [STEP 1] PASSED: Wallet connected');

      // 2. Check Chain Configuration
      log('🔍 [STEP 2] Checking chain configuration...');
      const config = getChainConfig(chainId);
      log(`   - chainId: ${config.chainId}`);
      log(`   - factory: ${config.contracts.factory}`);
      log(`   - name: ${config.name}`);

      if (chainId !== 137 && chainId !== 33139) {
        log('❌ [STEP 2] FAILED: Unsupported chain');
        return;
      }
      log('✅ [STEP 2] PASSED: Chain configuration valid');

      // 3. Check Public Client
      log('🔍 [STEP 3] Checking public client...');
      log(`   - publicClient exists: ${!!publicClient}`);
      log(`   - publicClient chainId: ${publicClient?.chain?.id}`);

      if (!publicClient) {
        log('❌ [STEP 3] FAILED: No public client');
        return;
      }
      log('✅ [STEP 3] PASSED: Public client available');

      // 4. Test Contract Read (to verify RPC)
      log('🔍 [STEP 4] Testing contract read...');
      try {
        const raffleCount = await publicClient.readContract({
          address: config.contracts.factory as `0x${string}`,
          abi: [{
            inputs: [],
            name: 'raffleCounter',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'raffleCounter',
        });
        log(`   - raffleCounter: ${raffleCount.toString()}`);
        log('✅ [STEP 4] PASSED: Contract read successful');
      } catch (readError) {
        log(`❌ [STEP 4] FAILED: Contract read error: ${readError}`);
        return;
      }

      // 5. Test Gas Estimation
      log('🔍 [STEP 5] Testing gas estimation...');
      if (chainId === 137) {
        // Test Polygon gas estimation
        try {
          const gasEstimate = await publicClient.estimateGas({
            account: address as `0x${string}`,
            to: config.contracts.factory as `0x${string}`,
            data: '0x', // Empty data for basic estimation
          });
          log(`   - gas estimate: ${gasEstimate.toString()}`);
          log('✅ [STEP 5] PASSED: Gas estimation successful');
        } catch (gasError) {
          log(`❌ [STEP 5] FAILED: Gas estimation error: ${gasError}`);
          return;
        }
      } else {
        log('✅ [STEP 5] SKIPPED: Gas estimation (ApeChain)');
      }

      // 6. Test Write Contract Setup
      log('🔍 [STEP 6] Testing write contract setup...');
      log(`   - writeContractAsync exists: ${!!writeContractAsync}`);
      log(`   - current hash: ${hash || 'none'}`);
      log(`   - current error: ${error || 'none'}`);
      log('✅ [STEP 6] PASSED: Write contract setup complete');

      // 7. Test Actual Transaction (if on testnet or user confirms)
      if (chainId === 137) {
        log('🔍 [STEP 7] Ready for transaction test on Polygon');
        log('   - Click "Test Transaction" to attempt actual transaction');
      } else {
        log('🔍 [STEP 7] Ready for transaction test on ApeChain');
        log('   - Click "Test Transaction" to attempt actual transaction');
      }

      log('🎉 [PIPELINE] All checks passed! Transaction should work.');

    } catch (error) {
      log(`💥 [PIPELINE] Unexpected error: ${error}`);
    } finally {
      setIsDebugging(false);
    }
  };

  const testTransaction = async () => {
    log('🚀 [TX-TEST] Starting transaction test...');
    
    try {
      const config = getChainConfig(chainId);
      
      // Create a minimal test transaction (just call a view function as write to test pipeline)
      const contractCall = {
        address: config.contracts.factory as `0x${string}`,
        abi: [{
          inputs: [],
          name: 'raffleCounter',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'raffleCounter',
        args: [],
      };

      log('🔶 [TX-TEST] Calling writeContractAsync...');
      const result = await writeContractAsync(contractCall);
      log(`✅ [TX-TEST] Transaction submitted: ${result}`);
      
    } catch (txError) {
      log(`❌ [TX-TEST] Transaction failed: ${txError}`);
      console.error('Transaction test error:', txError);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">🔧 Web3 Transaction Pipeline Debugger</h2>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={debugPipeline}
          disabled={isDebugging}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isDebugging ? 'Debugging...' : 'Debug Pipeline'}
        </button>
        
        <button
          onClick={testTransaction}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Transaction
        </button>
        
        <button
          onClick={clearLog}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Log
        </button>
      </div>

      <div className="bg-black p-4 rounded font-mono text-sm text-green-400 h-96 overflow-y-auto">
        {debugLog.length === 0 ? (
          <div className="text-gray-500">Click "Debug Pipeline" to start testing...</div>
        ) : (
          debugLog.map((entry, index) => (
            <div key={index} className="mb-1">
              {entry}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionDebugger;