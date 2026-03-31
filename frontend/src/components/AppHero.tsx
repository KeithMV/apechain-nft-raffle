/**
 * App Hero Component
 * Landing page hero section with platform description and contract links
 */

import React from 'react';

interface ContractButtonProps {
  address: string;
  explorerUrl: string;
  networkName: string;
  colorScheme: 'emerald' | 'purple';
}

const ContractButton: React.FC<ContractButtonProps> = ({ 
  address, 
  explorerUrl, 
  networkName, 
  colorScheme 
}) => {
  const handleClick = () => {
    window.open(`${explorerUrl}/address/${address}`, '_blank', 'noopener,noreferrer');
  };

  const colorClasses = colorScheme === 'emerald' 
    ? {
        gradient: 'from-emerald-500/20 to-teal-500/20',
        border: 'border-emerald-400/30',
        text: 'text-emerald-300',
        hoverGradient: 'hover:from-emerald-500/30 hover:to-teal-500/30',
        hoverBorder: 'hover:border-emerald-400/50',
        shadow: 'shadow-emerald-500/10 hover:shadow-emerald-500/20',
        indicator: 'bg-emerald-400 shadow-emerald-400/50',
        codeText: 'text-emerald-200 group-hover:text-emerald-100'
      }
    : {
        gradient: 'from-purple-500/20 to-violet-500/20',
        border: 'border-purple-400/30',
        text: 'text-purple-300',
        hoverGradient: 'hover:from-purple-500/30 hover:to-violet-500/30',
        hoverBorder: 'hover:border-purple-400/50',
        shadow: 'shadow-purple-500/10 hover:shadow-purple-500/20',
        indicator: 'bg-purple-400 shadow-purple-400/50',
        codeText: 'text-purple-200 group-hover:text-purple-100'
      };

  return (
    <button
      onClick={handleClick}
      className={`group relative px-6 py-4 bg-gradient-to-r ${colorClasses.gradient} border ${colorClasses.border} ${colorClasses.text} rounded-xl ${colorClasses.hoverGradient} ${colorClasses.hoverBorder} transition-all duration-300 shadow-lg ${colorClasses.shadow} hover:scale-105 active:scale-95 backdrop-blur-sm w-full max-w-sm`}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 ${colorClasses.indicator} rounded-full shadow-lg`}></div>
          <span className="font-semibold text-base sm:text-lg">{networkName} Contract</span>
        </div>
        <code className={`text-sm sm:text-base font-mono ${colorClasses.codeText} transition-colors break-all text-center px-2`}>
          {address}
        </code>
      </div>
    </button>
  );
};

export const AppHero: React.FC = () => {
  return (
    <div className="relative text-white py-16 sm:py-24 lg:py-32 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Platform Description */}
        <p className="text-2xl sm:text-3xl lg:text-4xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          A NFT raffle platform. Connect wallet and have fun.
        </p>
        
        {/* Contract Description */}
        <div className="mb-6 sm:mb-8">
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            These are the smart contracts that power our platform.
          </p>
        </div>
        
        {/* Contract Address Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-12">
          <ContractButton
            address="0x1627E7e63b63878E61f91D336385a59B1747934a"
            explorerUrl="https://apescan.io"
            networkName="ApeChain"
            colorScheme="emerald"
          />
          
          <ContractButton
            address="0xC9Bd344f5E31481F202E400C33210Bd1AB542b42"
            explorerUrl="https://polygonscan.com"
            networkName="Polygon"
            colorScheme="purple"
          />
        </div>
      </div>
    </div>
  );
};