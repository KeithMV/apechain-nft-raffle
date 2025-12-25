/**
 * V4 Status Component - Shows version and rate limit info
 */

import React from 'react';
import { useVersionInfo } from '../hooks/useRaffleContractV4';

interface V4StatusProps {
  className?: string;
  showDetails?: boolean;
}

export function V4Status({ className = '', showDetails = false }: V4StatusProps) {
  const { v4Available, currentVersion, rateLimitText } = useVersionInfo();
  
  if (!showDetails && currentVersion === 'v3') {
    return null; // Don't show anything for V3 unless details requested
  }
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {currentVersion === 'v4' && (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-mono">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
          V4 Fast Mode
        </div>
      )}
      
      {showDetails && (
        <div className="text-xs text-gray-400 font-mono">
          Rate limit: {rateLimitText}
        </div>
      )}
      
      {!v4Available && showDetails && (
        <div className="text-xs text-yellow-400 font-mono">
          V4 not deployed
        </div>
      )}
    </div>
  );
}

/**
 * Rate Limit Info Component
 */
export function RateLimitInfo() {
  const { currentVersion, rateLimitText, rateLimit } = useVersionInfo();
  
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">
          Raffle Creation Rate Limit
        </div>
        <V4Status />
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        {currentVersion === 'v4' ? (
          <span className="text-green-400">
            ⚡ Fast creation: Wait only {rateLimitText} between raffles
          </span>
        ) : (
          <span>
            Wait {rateLimitText} between raffle creations
          </span>
        )}
      </div>
      
      {currentVersion === 'v4' && (
        <div className="mt-1 text-xs text-green-400/70">
          V4 upgrade: 30x faster than V3!
        </div>
      )}
    </div>
  );
}