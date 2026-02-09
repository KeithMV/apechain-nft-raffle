import React, { useEffect } from 'react';
import { config as envConfig } from '../config/environment';
import { apeChain } from '../config/wagmi';

export const WalletConfigDebug: React.FC = () => {
  useEffect(() => {
    console.log('=== WALLET CONFIG COMPARISON ===');
    console.log('Environment:', envConfig.environment);
    console.log('App URL:', envConfig.appUrl);
    console.log('Chain Name:', apeChain.name);
    console.log('Chain ID:', apeChain.id);
    console.log('Project ID:', process.env.REACT_APP_WALLETCONNECT_PROJECT_ID);
    console.log('Current URL:', window.location.href);
    console.log('Hostname:', window.location.hostname);
    console.log('================================');
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '8px', 
      fontSize: '10px',
      zIndex: 9999
    }}>
      ENV: {envConfig.environment} | URL: {envConfig.appUrl} | Chain: {apeChain.name}
    </div>
  );
};