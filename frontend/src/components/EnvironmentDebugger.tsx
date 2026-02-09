import React, { useEffect } from 'react';
import { config as envConfig } from '../config/environment';

export const EnvironmentDebugger: React.FC = () => {
  useEffect(() => {
    console.log('=== ENVIRONMENT DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('Hostname:', window.location.hostname);
    console.log('Port:', window.location.port);
    console.log('Protocol:', window.location.protocol);
    console.log('');
    console.log('Environment Variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('REACT_APP_ENV:', process.env.REACT_APP_ENV);
    console.log('REACT_APP_WALLETCONNECT_PROJECT_ID:', process.env.REACT_APP_WALLETCONNECT_PROJECT_ID);
    console.log('');
    console.log('Detected Environment Config:');
    console.log('Environment:', envConfig.environment);
    console.log('App Name:', envConfig.appName);
    console.log('App URL:', envConfig.appUrl);
    console.log('Chain ID:', envConfig.chainId);
    console.log('Contract Address:', envConfig.contractAddress);
    console.log('RPC URL:', envConfig.rpcUrl);
    console.log('Logging Enabled:', envConfig.enableLogging);
    console.log('=========================');
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>ENV:</strong> {envConfig.environment}</div>
      <div><strong>URL:</strong> {envConfig.appUrl}</div>
      <div><strong>Chain:</strong> {envConfig.chainId}</div>
      <div><strong>Host:</strong> {window.location.hostname}</div>
    </div>
  );
};