import React, { useEffect } from 'react';
import { config as envConfig } from '../config/environment';
import { apeChain } from '../config/wagmi';

export const WalletConfigDebug: React.FC = () => {
  useEffect(() => {
    console.log('=== WEB3MODAL BUILD-TIME DEBUG ===');
    console.log('Runtime Environment:', envConfig.environment);
    console.log('Runtime App URL:', envConfig.appUrl);
    console.log('');
    console.log('BUILD-TIME Environment Variables (baked into Web3Modal):');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('REACT_APP_ENV:', process.env.REACT_APP_ENV);
    console.log('REACT_APP_ENVIRONMENT:', process.env.REACT_APP_ENVIRONMENT);
    console.log('REACT_APP_WALLETCONNECT_PROJECT_ID:', process.env.REACT_APP_WALLETCONNECT_PROJECT_ID);
    console.log('REACT_APP_APP_URL:', process.env.REACT_APP_APP_URL);
    console.log('REACT_APP_APP_NAME:', process.env.REACT_APP_APP_NAME);
    console.log('');
    console.log('Web3Modal was configured with these values at BUILD TIME');
    console.log('If staging modal looks different, these build-time vars are wrong');
    console.log('=====================================');
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      background: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: '8px', 
      fontSize: '10px',
      zIndex: 9999,
      maxWidth: '600px'
    }}>
      <div>Runtime: {envConfig.environment} | Build: {process.env.REACT_APP_ENV}</div>
      <div>Runtime URL: {envConfig.appUrl}</div>
      <div>Build URL: {process.env.REACT_APP_APP_URL}</div>
      <div>Project ID: {process.env.REACT_APP_WALLETCONNECT_PROJECT_ID}</div>
    </div>
  );
};