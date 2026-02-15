import React from 'react';
import { useNetwork } from '../contexts/NetworkContext';

export const NetworkAwareHeader: React.FC<{ title: string }> = ({ title }) => {
  const { theme, nativeCurrency, networkName, isApeChain, isPolygon } = useNetwork();
  
  return (
    <div className={`bg-gradient-to-r from-${theme.primary}-500/10 via-${theme.secondary}-500/10 to-${theme.accent}-500/10 px-4 sm:px-8 py-6 sm:py-8 border-b border-${theme.primary}-400/30`}>
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{theme.logo}</span>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent font-sans tracking-tight`}>
              {title}
            </h2>
            <div className={`px-3 py-1 bg-${theme.primary}-500/20 border border-${theme.primary}-400/30 rounded-full`}>
              <span className={`text-${theme.primary}-300 text-xs font-medium tracking-wider`}>
                {networkName} • {nativeCurrency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};