import { Connector } from 'wagmi';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
  WRONG_NETWORK = 'wrong_network'
}

export interface ConnectionError {
  code: string;
  message: string;
  userMessage: string;
}

class WalletConnectionService {
  private static instance: WalletConnectionService;
  
  static getInstance(): WalletConnectionService {
    if (!WalletConnectionService.instance) {
      WalletConnectionService.instance = new WalletConnectionService();
    }
    return WalletConnectionService.instance;
  }

  logConnectionAttempt(connectorName: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Connection activating: ${connectorName}`);
    }
  }

  logConnectionSuccess(connectorName: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Connection activated: ${connectorName}`);
    }
  }

  logConnectionError(error: Error, connectorName: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Connection failed: ${connectorName}`, error);
    }
  }

  formatConnectionError(error: Error): ConnectionError {
    if (error.message.includes('User rejected')) {
      return {
        code: 'USER_REJECTED',
        message: error.message,
        userMessage: 'Connection cancelled by user'
      };
    }
    
    if (error.message.includes('No provider')) {
      return {
        code: 'NO_PROVIDER',
        message: error.message,
        userMessage: 'Wallet not found. Please install MetaMask or use WalletConnect.'
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: 'Connection failed. Please try again.'
    };
  }

  getConnectionState(isConnected: boolean, isPending: boolean, chainId?: number, targetChainId?: number): ConnectionState {
    if (isPending) return ConnectionState.CONNECTING;
    if (!isConnected) return ConnectionState.DISCONNECTED;
    if (chainId && targetChainId && chainId !== targetChainId) return ConnectionState.WRONG_NETWORK;
    return ConnectionState.CONNECTED;
  }
}

export const walletConnectionService = WalletConnectionService.getInstance();