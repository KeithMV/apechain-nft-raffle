/**
 * Performance Debug Panel
 * Quick way to see what's causing slowness
 */

import React, { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { polygonProfiler } from '../utils/polygonProfiler';
import { setDebugLevel, getPerformanceSummary } from '../utils/debugManager';

export const PerformanceDebugPanel: React.FC = () => {
  const chainId = useChainId();
  const [analysis, setAnalysis] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnalysis(polygonProfiler.getAnalysis());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded text-xs z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">🔍 Performance Debug</h3>
        <button onClick={() => setIsVisible(false)} className="text-red-400">✕</button>
      </div>
      
      <div className="mb-2">
        <strong>Current Chain:</strong> {chainId} {chainId === 137 ? '(Polygon)' : chainId === 33139 ? '(ApeChain)' : ''}
      </div>

      <div className="mb-2">
        <button 
          onClick={() => setDebugLevel('verbose')} 
          className="bg-blue-600 px-2 py-1 rounded mr-2 text-xs"
        >
          Enable Logs
        </button>
        <button 
          onClick={() => setDebugLevel('error')} 
          className="bg-gray-600 px-2 py-1 rounded mr-2 text-xs"
        >
          Quiet Logs
        </button>
        <button 
          onClick={() => polygonProfiler.printAnalysis()} 
          className="bg-green-600 px-2 py-1 rounded text-xs"
        >
          Print Analysis
        </button>
      </div>

      {analysis?.polygon && (
        <div className="mb-2 p-2 bg-orange-900/50 rounded">
          <div className="font-bold text-orange-300">🔶 Polygon</div>
          <div>Avg: {analysis.polygon.avgDuration}ms</div>
          <div>Slow ops: {analysis.polygon.slowOperations}</div>
          {analysis.polygon.slowestOperations.slice(0, 3).map((op: any, i: number) => (
            <div key={i} className="text-red-300">
              {op.operation}: {op.avgDuration}ms
            </div>
          ))}
        </div>
      )}

      {analysis?.apechain && (
        <div className="mb-2 p-2 bg-green-900/50 rounded">
          <div className="font-bold text-green-300">⚡ ApeChain</div>
          <div>Avg: {analysis.apechain.avgDuration}ms</div>
          <div>Slow ops: {analysis.apechain.slowOperations}</div>
        </div>
      )}

      {analysis?.comparison && (
        <div className="p-2 bg-red-900/50 rounded">
          <div className="font-bold text-red-300">⚖️ Comparison</div>
          <div>Polygon is {analysis.comparison.slowdownFactor}x slower</div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDebugPanel;