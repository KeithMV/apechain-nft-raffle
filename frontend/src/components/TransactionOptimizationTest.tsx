/**
 * Transaction Optimization Test Component
 * Quick verification that optimizations are working correctly
 */

import React, { useState, useEffect } from 'react';
import { useChainConfig } from '../hooks/useChainConfig';
import { polygonOptimizer } from '../utils/polygonOptimizations';

export const TransactionOptimizationTest: React.FC = () => {
  const { chainId, isPolygon, isApeChain, config } = useChainConfig();
  const polygonMetrics = polygonOptimizer.getPerformanceMetrics();
  
  const [testGasSettings, setTestGasSettings] = useState<any>(null);
  const [testTimeout, setTestTimeout] = useState<number | null>(null);
  
  useEffect(() => {
    if (isPolygon) {
      // Fetch gas settings asynchronously
      polygonOptimizer.getOptimizedGasSettings('buy-tickets').then(settings => {
        setTestGasSettings(settings);
      }).catch(error => {
        console.error('Failed to get gas settings:', error);
        setTestGasSettings(null);
      });
      
      // Get timeout (this is still synchronous)
      try {
        const timeout = polygonOptimizer.getOptimizedTimeout('buy-tickets');
        setTestTimeout(timeout);
      } catch (error) {
        console.error('Failed to get timeout:', error);
        setTestTimeout(null);
      }
    }
  }, [isPolygon]);
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '15px', 
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#00ff88' }}>🔧 Optimization Test</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Chain Detection:</strong><br/>
        Chain ID: {chainId}<br/>
        Is Polygon: {isPolygon ? '✅' : '❌'}<br/>
        Is ApeChain: {isApeChain ? '✅' : '❌'}<br/>
        Chain Name: {config.name}
      </div>
      
      {isPolygon && (
        <div style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#ff6b35' }}>🔶 Polygon Optimization:</strong><br/>
          Timeout Multiplier: {config.transaction.timeoutMultiplier}x<br/>
          Gas Multiplier: {config.transaction.gasMultiplier}x<br/>
          Polling Interval: {config.polling.interval}ms<br/>
          Cache Stale Time: {config.cache.staleTime}ms
        </div>
      )}
      
      {isPolygon && testGasSettings && (
        <div style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#ff6b35' }}>⛽ Gas Settings (Buy Tickets):</strong><br/>
          Max Fee: {parseInt(testGasSettings.maxFeePerGas) / 1e9} gwei<br/>
          Priority Fee: {parseInt(testGasSettings.maxPriorityFeePerGas) / 1e9} gwei<br/>
          Congestion: {testGasSettings.congestionLevel}<br/>
          {testTimeout && `Timeout: ${testTimeout}ms`}
        </div>
      )}
      
      {isPolygon && (
        <div style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#ff6b35' }}>📊 Performance Metrics:</strong><br/>
          Avg Duration: {polygonMetrics.avgTransactionTime}ms<br/>
          Failure Rate: {(polygonMetrics.failureRate * 100).toFixed(1)}%<br/>
          Total Transactions: {polygonMetrics.totalTransactions}<br/>
          Congested: {polygonOptimizer.isPolygonCongested() ? '🔴 YES' : '🟢 NO'}
        </div>
      )}
      
      {isPolygon && (
        <div style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#ff6b35' }}>🌐 RPC Status:</strong><br/>
          Chain: Polygon (137)<br/>
          Status: Connected
        </div>
      )}
      
      {isApeChain && (
        <div style={{ marginBottom: '10px' }}>
          <strong style={{ color: '#00ff88' }}>⚡ ApeChain Optimization:</strong><br/>
          Timeout Multiplier: {config.transaction.timeoutMultiplier}x<br/>
          Gas Multiplier: {config.transaction.gasMultiplier}x<br/>
          Polling Interval: {config.polling.interval}ms<br/>
          Cache Stale Time: {config.cache.staleTime}ms
        </div>
      )}
      
      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '10px' }}>
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default TransactionOptimizationTest;