import React, { useEffect, useState } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';

export const MobileDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { open } = useWeb3Modal();

  useEffect(() => {
    setDebugInfo({
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      ethereum: !!window.ethereum,
      web3Modal: !!open,
      nodeEnv: process.env.NODE_ENV,
      reactAppEnv: process.env.REACT_APP_ENV,
    });
  }, [open]);

  const testWeb3Modal = async () => {
    try {
      console.log('Testing Web3Modal open...');
      open();
      console.log('Web3Modal opened successfully');
    } catch (err) {
      console.error('Web3Modal error:', err);
      alert(`Web3Modal Error: ${err}`);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Mobile Debug</h3>
      <div className="space-y-1">
        <div>Mobile: {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'YES' : 'NO'}</div>
        <div>Ethereum: {debugInfo.ethereum ? 'YES' : 'NO'}</div>
        <div>Web3Modal: {debugInfo.web3Modal ? 'YES' : 'NO'}</div>
        <div>Host: {debugInfo.hostname}</div>
        <div>NODE_ENV: {debugInfo.nodeEnv}</div>
      </div>
      <button 
        onClick={testWeb3Modal}
        className="mt-2 px-2 py-1 bg-blue-500 rounded text-xs"
      >
        Test Web3Modal
      </button>
    </div>
  );
};