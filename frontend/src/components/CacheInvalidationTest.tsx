/**
 * Cache Invalidation Test Component
 * Simple component to test and verify cache invalidation is working properly
 */

import React from 'react';
import { useUnifiedCacheInvalidation } from '../hooks/useUnifiedCacheInvalidation';
import { useQueryClient } from '@tanstack/react-query';

export const CacheInvalidationTest: React.FC = () => {
  const { invalidateAfterTransaction, quickInvalidate, emergencyReset } = useUnifiedCacheInvalidation();
  const queryClient = useQueryClient();

  const testBuyTickets = async () => {
    console.log('🧪 [TEST] Simulating buy tickets transaction completion');
    await invalidateAfterTransaction({
      raffleContract: '0x1234567890123456789012345678901234567890',
      userAddress: '0x0987654321098765432109876543210987654321',
      transactionType: 'buy-tickets',
      immediate: true
    });
    console.log('✅ [TEST] Buy tickets cache invalidation completed');
  };

  const testWinnerSelection = async () => {
    console.log('🧪 [TEST] Simulating winner selection transaction completion');
    await invalidateAfterTransaction({
      raffleContract: '0x1234567890123456789012345678901234567890',
      transactionType: 'select-winner',
      immediate: true
    });
    console.log('✅ [TEST] Winner selection cache invalidation completed');
  };

  const testQuickInvalidate = () => {
    console.log('🧪 [TEST] Testing quick invalidation');
    quickInvalidate('0x1234567890123456789012345678901234567890');
    console.log('✅ [TEST] Quick invalidation completed');
  };

  const testEmergencyReset = async () => {
    console.log('🧪 [TEST] Testing emergency cache reset');
    await emergencyReset();
    console.log('✅ [TEST] Emergency reset completed');
  };

  const getCacheInfo = () => {
    const queries = queryClient.getQueryCache().getAll();
    console.log('📊 [CACHE INFO] Total queries in cache:', queries.length);
    console.log('📊 [CACHE INFO] Query keys:', queries.map(q => q.queryKey));
  };

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-white font-semibold mb-3">Cache Test Panel</h3>
      <div className="space-y-2">
        <button
          onClick={testBuyTickets}
          className="block w-full bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Test Buy Tickets Cache
        </button>
        <button
          onClick={testWinnerSelection}
          className="block w-full bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          Test Winner Selection Cache
        </button>
        <button
          onClick={testQuickInvalidate}
          className="block w-full bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
        >
          Test Quick Invalidate
        </button>
        <button
          onClick={getCacheInfo}
          className="block w-full bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm"
        >
          Log Cache Info
        </button>
        <button
          onClick={testEmergencyReset}
          className="block w-full bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Emergency Reset
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        Check browser console for test results
      </p>
    </div>
  );
};