/**
 * Web3 Title Component
 * Animated gradient title with responsive sizing
 */

import React from 'react';

export const Web3Title: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <h1 
        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-center leading-tight font-sans tracking-tight bg-clip-text text-transparent"
        style={{
          backgroundImage: 'linear-gradient(45deg, #10b981, #8b5cf6, #06b6d4, #10b981)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 6s ease-in-out infinite'
        }}
      >
        Web3 Raffles
      </h1>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `
      }} />
    </div>
  );
};