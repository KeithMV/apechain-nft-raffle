import React, { useState } from 'react';
import { appToast } from '../utils/toast';

interface CopyAddressProps {
  address: string;
  label?: string;
  className?: string;
}

export default function CopyAddress({ address, label, className = '' }: CopyAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      appToast.copy.success(label || 'Address');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      appToast.copy.error();
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <p className="text-pink-300 text-xs font-mono tracking-wide break-all flex-1 mr-2">
        {address}
      </p>
      <button
        onClick={handleCopy}
        className="relative flex-shrink-0 p-2 bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 hover:border-pink-400/50 rounded-lg transition-all duration-300 ml-auto group overflow-hidden shadow-lg shadow-pink-500/10 hover:shadow-pink-500/25"
        title={`Copy ${label || 'address'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/10 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        {copied ? (
          <span className="relative text-green-400 text-xs font-mono">✓</span>
        ) : (
          <span className="relative text-pink-300 text-xs font-mono">📋</span>
        )}
      </button>
    </div>
  );
}