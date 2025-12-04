import { Connector } from 'wagmi';
import { metaMaskConnector, walletConnectConnector } from '../config/wagmi';

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
    // Connection logging disabled in production
  }

  isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && window.ethereum?.isMetaMask;
  }

  logConnectionSuccess(connectorName: string): void {
    // Success logging disabled in production
  }

  logConnectionError(error: Error, connectorName: string): void {
    // Error logging disabled in production
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