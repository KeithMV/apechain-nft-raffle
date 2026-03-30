/**
 * Test Component for New Unified System
 * Quick validation that everything works
 */

import React from 'react';
import { useChainId } from 'wagmi';
import { useAllRaffles, useCreatedRaffles, useParticipatedRaffles } from '../hooks/useUnifiedRaffleData';
import { getChainConfig, isSupportedChain } from '../config/simplified-addresses';

export default function UnifiedSystemTest() {
  const chainId = useChainId();
  
  // Test configuration
  const chainConfig = getChainConfig(chainId);
  const isSupported = isSupportedChain(chainId || 0);
  
  // Test hooks
  const { raffles: allRaffles, loading: allLoading } = useAllRaffles({ limit: 5 });
  const { raffles: createdRaffles, loading: createdLoading } = useCreatedRaffles();
  const { raffles: participatedRaffles, loading: participatedLoading } = useParticipatedRaffles();
  
  return (
    <div className="bg-slate-800 border border-emerald-400/30 rounded-xl p-6 m-4">
      <h3 className="text-emerald-400 font-bold text-lg mb-4">🧪 Unified System Test</h3>
      
      {/* Configuration Test */}
      <div className="mb-4">
        <h4 className="text-emerald-300 font-semibold mb-2">Configuration</h4>
        <div className="text-sm text-slate-300 space-y-1">
          <div>Chain ID: {chainId || 'Not connected'}</div>
          <div>Chain Name: {chainConfig.name}</div>
          <div>Factory: {chainConfig.factory.slice(0, 10)}...</div>
          <div>Version: {chainConfig.version}</div>
          <div>Rate Limit: {chainConfig.rateLimit}s</div>
          <div>Supported: {isSupported ? '✅' : '❌'}</div>
        </div>
      </div>
      
      {/* Hook Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <h5 className="text-emerald-300 font-semibold mb-2">All Raffles</h5>
          <div className="text-sm text-slate-300">
            <div>Loading: {allLoading ? '⏳' : '✅'}</div>
            <div>Count: {allRaffles.length}</div>
            <div>Sample: {allRaffles[0]?.raffleId || 'None'}</div>
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-3">
          <h5 className="text-emerald-300 font-semibold mb-2">Created</h5>
          <div className="text-sm text-slate-300">
            <div>Loading: {createdLoading ? '⏳' : '✅'}</div>
            <div>Count: {createdRaffles.length}</div>
            <div>Sample: {createdRaffles[0]?.raffleId || 'None'}</div>
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-3">
          <h5 className="text-emerald-300 font-semibold mb-2">Participated</h5>
          <div className="text-sm text-slate-300">
            <div>Loading: {participatedLoading ? '⏳' : '✅'}</div>
            <div>Count: {participatedRaffles.length}</div>
            <div>Sample: {participatedRaffles[0]?.raffleId || 'None'}</div>
          </div>
        </div>
      </div>
      
      {/* Chain-Specific Settings */}
      <div className="mt-4 text-xs text-slate-400">
        <div>Chain-specific settings applied:</div>
        <div>• Batch size: {chainId === 137 ? '1 (Polygon)' : '3 (ApeChain)'}</div>
        <div>• Delay: {chainId === 137 ? '1000ms (Polygon)' : '100ms (ApeChain)'}</div>
        <div>• Retries: {chainId === 137 ? '0 (Polygon)' : '1 (ApeChain)'}</div>
        <div>• Limit: {chainId === 137 ? '5 (Polygon)' : '20 (ApeChain)'}</div>
      </div>
    </div>
  );
}