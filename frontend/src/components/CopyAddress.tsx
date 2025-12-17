import React, { useState } from 'react';
import toast from 'react-hot-toast';

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
      toast.success(`${label || 'Address'} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <p className="text-pink-300 text-xs font-mono tracking-wide break-all flex-1">
        {address}
      </p>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-1 hover:bg-pink-500/20 rounded transition-colors"
        title={`Copy ${label || 'address'}`}
      >
        {copied ? (
          <span className="text-green-400 text-xs">✓</span>
        ) : (
          <span className="text-pink-400 text-xs">📋</span>
        )}
      </button>
    </div>
  );
}