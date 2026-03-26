/**
 * Performance Dashboard Component
 * Displays real-time performance metrics, RPC health, and optimization status
 * Helps users understand system performance and identify issues
 */

import React, { useState, useEffect } from 'react';
import { useChainConfig } from '../config/ChainConfigProvider';
import { useRPCHealthMonitor } from '../hooks/useRPCHealthMonitor';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isOpen, onClose }) => {
  const { chainId, chainName, isApeChain } = useChainConfig();
  const { healthStatus, getBestEndpoint, performHealthCheck } = useRPCHealthMonitor(chainId);
  const { generateReport, getPerformanceSummary, currentStats } = usePerformanceMonitor();
  
  const [report, setReport] = useState(generateReport());
  const [summary, setSummary] = useState(getPerformanceSummary());
  
  // Update data periodically
  useEffect(() => {
    if (!isOpen) return;
    
    const updateData = () => {
      setReport(generateReport());
      setSummary(getPerformanceSummary());
    };
    
    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [isOpen, generateReport, getPerformanceSummary]);
  
  if (!isOpen) return null;
  
  const healthyEndpoints = healthStatus?.endpoints.filter(ep => ep.isHealthy) || [];
  const unhealthyEndpoints = healthStatus?.endpoints.filter(ep => !ep.isHealthy) || [];
  
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return isApeChain ? 'text-emerald-400' : 'text-blue-400';
      case 'good': return 'text-green-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  const getHealthBg = (health: string) => {
    switch (health) {
      case 'excellent': return isApeChain ? 'bg-emerald-500/20' : 'bg-blue-500/20';
      case 'good': return 'bg-green-500/20';
      case 'fair': return 'bg-yellow-500/20';
      case 'poor': return 'bg-red-500/20';
      default: return 'bg-gray-500/20';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isApeChain ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
            <h2 className="text-xl font-bold text-white">Performance Dashboard - {chainName}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Overall Health Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl ${getHealthBg(summary.health)} border border-gray-600`}>
              <div className="text-sm text-gray-400 mb-1">Overall Health</div>
              <div className={`text-lg font-bold capitalize ${getHealthColor(summary.health)}`}>
                {summary.health}
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Total Operations</div>
              <div className="text-lg font-bold text-white">
                {summary.totalOperations.toLocaleString()}
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Success Rate</div>
              <div className={`text-lg font-bold ${
                summary.averageSuccessRate >= 95 ? 'text-green-400' : 
                summary.averageSuccessRate >= 90 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {summary.averageSuccessRate.toFixed(1)}%
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Avg Duration</div>
              <div className="text-lg font-bold text-white">
                {Math.round(summary.averageDuration)}ms
              </div>
            </div>
          </div>
          
          {/* RPC Health Status */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">RPC Endpoint Health</h3>
              <button
                onClick={performHealthCheck}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  isApeChain 
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                }`}
              >
                Refresh
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Active Endpoint */}
              <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">Active Endpoint</div>
                    <div className="text-green-400 font-mono text-sm">{getBestEndpoint()}</div>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Healthy Endpoints */}
              {healthyEndpoints.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Healthy Endpoints ({healthyEndpoints.length})</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {healthyEndpoints.map((endpoint, index) => (
                      <div key={index} className="p-2 rounded-lg bg-gray-700 border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-xs text-gray-300 truncate">
                            {endpoint.url.replace('https://', '')}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">{endpoint.responseTime}ms</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Unhealthy Endpoints */}
              {unhealthyEndpoints.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Unhealthy Endpoints ({unhealthyEndpoints.length})</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {unhealthyEndpoints.map((endpoint, index) => (
                      <div key={index} className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-xs text-gray-300 truncate">
                            {endpoint.url.replace('https://', '')}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-red-400">{endpoint.failureCount} failures</span>
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Performance Statistics */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Operation Performance</h3>
            
            {currentStats.length > 0 ? (
              <div className="space-y-3">
                {currentStats.map((stat, index) => {
                  const isGood = stat.successRate >= 95 && stat.averageDuration < 10000;
                  const isFair = stat.successRate >= 90 && stat.averageDuration < 20000;
                  
                  return (
                    <div key={index} className="p-4 rounded-lg bg-gray-700 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-white capitalize">
                          {stat.operation.replace('-', ' ')}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          isGood ? 'bg-green-500/20 text-green-400' :
                          isFair ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {isGood ? 'Good' : isFair ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Operations</div>
                          <div className="text-white font-medium">{stat.totalOperations}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Success Rate</div>
                          <div className={`font-medium ${
                            stat.successRate >= 95 ? 'text-green-400' :
                            stat.successRate >= 90 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {stat.successRate.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Avg Duration</div>
                          <div className="text-white font-medium">{Math.round(stat.averageDuration)}ms</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Range</div>
                          <div className="text-gray-300 font-medium">
                            {Math.round(stat.minDuration)}-{Math.round(stat.maxDuration)}ms
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📈</div>
                <div>No performance data available yet</div>
                <div className="text-sm">Start using the application to see metrics</div>
              </div>
            )}
          </div>
          
          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Optimization Recommendations</h3>
              <div className="space-y-2">
                {report.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-300">{recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;