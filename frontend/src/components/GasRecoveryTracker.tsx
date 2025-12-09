import React, { useState, useEffect } from 'react';

export default function GasRecoveryTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');
  const [minutesSince, setMinutesSince] = useState(0);
  const [gasStatus, setGasStatus] = useState<'normal' | 'high' | 'failed'>('failed');

  const checkGasEstimation = async () => {
    try {
      const response = await fetch('https://apechain.calderachain.xyz/http', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateGas',
          params: [{
            from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
            to: '0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff',
            data: '0x4b8bcb940000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000038d7ea4c68000000000000000000000000000000000000000000000000000000000000000012c00000000000000000000000000000000000000000000000000000000000000000a5465737420526166666c650000000000000000000000000000000000000000'
          }]
        })
      });
      
      const result = await response.json();
      const gasHex = result.result;
      
      if (gasHex && gasHex !== 'undefined') {
        const gasDecimal = parseInt(gasHex, 16);
        const costUSD = (gasDecimal * 25000000000 / 1e18) * 3000;
        
        if (costUSD < 1) {
          setGasStatus('normal');
          setIsTracking(false);
        } else {
          setGasStatus('high');
        }
      } else {
        setGasStatus('failed');
      }
      
      setLastCheck(new Date().toLocaleTimeString());
    } catch (error) {
      setGasStatus('failed');
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        checkGasEstimation();
        setMinutesSince(prev => prev + 0.5);
      }, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  const startTracking = () => {
    setIsTracking(true);
    setMinutesSince(0);
    checkGasEstimation();
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  if (!isTracking && gasStatus !== 'normal') {
    return (
      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-blue-300 font-medium text-sm">🔍 Gas Recovery Tracker</div>
            <div className="text-blue-200 text-xs">Monitor when gas estimation returns to normal</div>
          </div>
          <button
            onClick={startTracking}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
          >
            Start Tracking
          </button>
        </div>
      </div>
    );
  }

  if (isTracking) {
    return (
      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-yellow-300 font-medium text-sm flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></div>
              Tracking Gas Recovery
            </div>
            <div className="text-yellow-200 text-xs">
              Status: {gasStatus === 'failed' ? '❌ RPC Failed' : gasStatus === 'high' ? '⚠️ High Gas' : '✅ Normal'}
              {' • '}
              {minutesSince.toFixed(1)} min since start
              {lastCheck && ` • Last check: ${lastCheck}`}
            </div>
          </div>
          <button
            onClick={stopTracking}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded transition-colors"
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  if (gasStatus === 'normal') {
    return (
      <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="text-green-300 font-medium text-sm">✅ Gas Estimation Recovered!</div>
        <div className="text-green-200 text-xs">
          Recovery time: {minutesSince.toFixed(1)} minutes • You can create another raffle now
        </div>
      </div>
    );
  }

  return null;
}