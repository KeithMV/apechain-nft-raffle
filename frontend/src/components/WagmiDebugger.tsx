import React, { useEffect } from 'react';
import { config as envConfig } from '../config/environment';
import { config as wagmiConfig, apeChain, baseChain } from '../config/wagmi';

export const WagmiDebugger: React.FC = () => {
  useEffect(() => {
    console.log('=== WAGMI CONFIG DEBUG ===');
    console.log('Environment Config:');
    console.log('- Environment:', envConfig.environment);
    console.log('- App Name:', envConfig.appName);
    console.log('- App URL:', envConfig.appUrl);
    console.log('- Chain ID:', envConfig.chainId);
    console.log('- RPC URL:', envConfig.rpcUrl);
    console.log('- Contract Address:', envConfig.contractAddress);
    console.log('');
    console.log('ApeChain Config:');
    console.log('- ID:', apeChain.id);
    console.log('- Name:', apeChain.name);
    console.log('- RPC URLs:', apeChain.rpcUrls.default.http);
    console.log('- Testnet:', apeChain.testnet);
    console.log('');
    console.log('Wagmi Config:');
    console.log('- Chains:', wagmiConfig.chains.map(c => ({ id: c.id, name: c.name })));
    console.log('- Project ID:', wagmiConfig.projectId);
    console.log('- SSR:', wagmiConfig.ssr);
    console.log('- Sync Connected Chain:', wagmiConfig.syncConnectedChain);
    console.log('');
    console.log('Metadata:');
    console.log('- Name:', wagmiConfig.metadata?.name);
    console.log('- Description:', wagmiConfig.metadata?.description);
    console.log('- URL:', wagmiConfig.metadata?.url);
    console.log('- Icons:', wagmiConfig.metadata?.icons);
    console.log('');
    console.log('Environment Variables:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- REACT_APP_ENV:', process.env.REACT_APP_ENV);
    console.log('- REACT_APP_WALLETCONNECT_PROJECT_ID:', process.env.REACT_APP_WALLETCONNECT_PROJECT_ID);
    console.log('- REACT_APP_APECHAIN_RPC_URL:', process.env.REACT_APP_APECHAIN_RPC_URL);
    console.log('- REACT_APP_CONTRACT_ADDRESS:', process.env.REACT_APP_CONTRACT_ADDRESS);
    console.log('=========================');
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '50px', 
      right: 0, 
      background: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: '10px', 
      fontSize: '11px',
      zIndex: 9999,
      maxWidth: '400px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <div><strong>WAGMI DEBUG</strong></div>
      <div>ENV: {envConfig.environment}</div>
      <div>Chain: {apeChain.name} ({apeChain.id})</div>
      <div>URL: {envConfig.appUrl}</div>
      <div>Metadata URL: {wagmiConfig.metadata?.url}</div>
      <div>Project ID: {wagmiConfig.projectId}</div>
      <div>Sync Chain: {wagmiConfig.syncConnectedChain ? 'true' : 'false'}</div>
    </div>
  );
};