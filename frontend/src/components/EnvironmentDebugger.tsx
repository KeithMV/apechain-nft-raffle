import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { getRaffleFactoryAddress, getContracts } from '../config/addresses';
import { getNetworkConfig } from '../config/networks';

interface EnvironmentDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnvironmentDebugger({ isOpen, onClose }: EnvironmentDebuggerProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      collectDebugInfo();
    }
  }, [isOpen, chainId, address]);

  const collectDebugInfo = async () => {
    setTesting(true);
    
    try {
      const networkConfig = getNetworkConfig(chainId);
      const contracts = getContracts(chainId);
      const factoryAddress = getRaffleFactoryAddress(chainId, true);
      
      // Test RPC connectivity
      let rpcTest: any;
      try {
        const blockNumber = await publicClient?.getBlockNumber();
        rpcTest = { success: true, blockNumber: blockNumber?.toString() };
      } catch (error) {
        rpcTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
      
      // Test contract existence
      let contractTest: any;
      try {
        const code = await publicClient?.getBytecode({ address: factoryAddress as `0x${string}` });
        contractTest = { 
          success: !!code && code !== '0x', 
          hasCode: !!code && code !== '0x',
          codeLength: code?.length || 0
        };
      } catch (error) {
        contractTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
      
      setDebugInfo({
        environment: {
          REACT_APP_ENV: process.env.REACT_APP_ENV,
          REACT_APP_NETWORK: process.env.REACT_APP_NETWORK,
          REACT_APP_CHAIN_ID: process.env.REACT_APP_CHAIN_ID,
          REACT_APP_APECHAIN_RPC_URL: process.env.REACT_APP_APECHAIN_RPC_URL,
          REACT_APP_CONTRACT_ADDRESS: process.env.REACT_APP_CONTRACT_ADDRESS,
          REACT_APP_APP_URL: process.env.REACT_APP_APP_URL,
          REACT_APP_ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING,
          NODE_ENV: process.env.NODE_ENV
        },
        wallet: {
          connected: isConnected,
          address: address,
          chainId: chainId
        },
        network: {
          configured: networkConfig,
          expectedChainId: 33139,
          chainIdMatch: chainId === 33139
        },
        contracts: {
          configured: contracts,
          factoryAddress,
          factoryV4Available: !!contracts.RAFFLE_FACTORY_V4
        },
        tests: {
          rpc: rpcTest,
          contract: contractTest
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
    
    setTesting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Staging Environment Debugger</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {testing ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Collecting debug information...</p>
          </div>
        ) : debugInfo ? (
          <div className="space-y-6">
            {/* Environment Variables */}
            <div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">Environment Variables</h3>
              <div className="bg-slate-900 p-4 rounded-lg">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {JSON.stringify(debugInfo.environment, null, 2)}
                </pre>
              </div>
            </div>

            {/* Wallet Status */}
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Wallet Status</h3>
              <div className="bg-slate-900 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Connected:</span>
                    <span className={`ml-2 ${debugInfo.wallet.connected ? 'text-green-400' : 'text-red-400'}`}>
                      {debugInfo.wallet.connected ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Address:</span>
                    <span className="ml-2 text-white font-mono text-xs">
                      {debugInfo.wallet.address || 'Not connected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Chain ID:</span>
                    <span className={`ml-2 ${debugInfo.network.chainIdMatch ? 'text-green-400' : 'text-red-400'}`}>
                      {debugInfo.wallet.chainId} {debugInfo.network.chainIdMatch ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Network Configuration</h3>
              <div className="bg-slate-900 p-4 rounded-lg">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {JSON.stringify(debugInfo.network, null, 2)}
                </pre>
              </div>
            </div>

            {/* Contract Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Contract Configuration</h3>
              <div className="bg-slate-900 p-4 rounded-lg">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {JSON.stringify(debugInfo.contracts, null, 2)}
                </pre>
              </div>
            </div>

            {/* Test Results */}
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3">Connectivity Tests</h3>
              <div className="bg-slate-900 p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">RPC Connection Test</h4>
                  <div className={`p-3 rounded ${debugInfo.tests.rpc?.success ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
                    <div className="flex items-center gap-2">
                      <span>{debugInfo.tests.rpc?.success ? '✓' : '✗'}</span>
                      <span className="text-white">
                        {debugInfo.tests.rpc?.success ? 
                          `Connected - Block: ${debugInfo.tests.rpc.blockNumber}` : 
                          'Connection Failed'
                        }
                      </span>
                    </div>
                    {debugInfo.tests.rpc?.error && (
                      <div className="text-red-400 text-sm mt-2">
                        Error: {debugInfo.tests.rpc.error}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Contract Existence Test</h4>
                  <div className={`p-3 rounded ${debugInfo.tests.contract?.success ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
                    <div className="flex items-center gap-2">
                      <span>{debugInfo.tests.contract?.success ? '✓' : '✗'}</span>
                      <span className="text-white">
                        {debugInfo.tests.contract?.success ? 
                          `Contract Found - Code Length: ${debugInfo.tests.contract.codeLength}` : 
                          'Contract Not Found'
                        }
                      </span>
                    </div>
                    {debugInfo.tests.contract?.error && (
                      <div className="text-red-400 text-sm mt-2">
                        Error: {debugInfo.tests.contract.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No debug information available</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={collectDebugInfo}
            disabled={testing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {testing ? 'Testing...' : 'Refresh Debug Info'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}