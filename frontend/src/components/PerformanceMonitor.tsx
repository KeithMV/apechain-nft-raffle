/**
 * Performance Monitor Component
 * Displays real-time performance metrics for development and optimization
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor, getMemoryInfo } from '../utils/performance';

interface PerformanceMonitorProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function PerformanceMonitor({ 
  isVisible = false, 
  position = 'bottom-right' 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [memoryInfo, setMemoryInfo] = useState<any>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const allStats = performanceMonitor.getAllStats();
      const memory = getMemoryInfo();
      setMetrics(allStats);
      setMemoryInfo(memory);
    };

    // Update immediately
    updateMetrics();

    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const formatMs = (ms: number) => `${ms.toFixed(1)}ms`;
  const formatMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 bg-black/90 backdrop-blur-sm border border-gray-600 rounded-lg shadow-lg font-mono text-xs`}>
      <div 
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-green-400 font-semibold">⚡ Performance</span>
        <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-600 p-3 space-y-2 max-h-96 overflow-y-auto">
          {/* Memory Info */}
          {memoryInfo.usedJSHeapSize && (
            <div className="space-y-1">
              <div className="text-blue-400 font-semibold">Memory Usage</div>
              <div className="text-gray-300 pl-2">
                <div>Used: {formatMB(memoryInfo.usedJSHeapSize)}</div>
                <div>Total: {formatMB(memoryInfo.totalJSHeapSize)}</div>
                <div>Usage: {memoryInfo.usedPercent}%</div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {Object.keys(metrics).length > 0 && (
            <div className="space-y-1">
              <div className="text-yellow-400 font-semibold">Operation Times</div>
              {Object.entries(metrics).map(([label, stats]: [string, any]) => (
                <div key={label} className="text-gray-300 pl-2">
                  <div className="text-white">{label}</div>
                  <div className="pl-2 text-xs">
                    <div>Avg: {formatMs(stats.avg)}</div>
                    <div>Min: {formatMs(stats.min)}</div>
                    <div>Max: {formatMs(stats.max)}</div>
                    {stats.p95 && <div>P95: {formatMs(stats.p95)}</div>}
                    <div>Count: {stats.count}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clear Button */}
          <button
            onClick={() => {
              performanceMonitor.clear();
              setMetrics({});
            }}
            className="w-full mt-2 px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-colors"
          >
            Clear Metrics
          </button>
        </div>
      )}
    </div>
  );
}