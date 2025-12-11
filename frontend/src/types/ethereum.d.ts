declare global {
  interface Window {
    ethereum?: {
      chainId?: string;
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export {};