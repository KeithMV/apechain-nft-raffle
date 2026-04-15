/**
 * MOBILE DEBUGGER UTILITY
 * Comprehensive mobile debugging for staging environment
 * Helps identify differences between Chrome dev tools and real mobile devices
 */

interface MobileDebugInfo {
  timestamp: string;
  device: {
    userAgent: string;
    platform: string;
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isSafari: boolean;
    isChrome: boolean;
    screenSize: string;
    viewport: string;
    pixelRatio: number;
    touchSupport: boolean;
    orientation: string;
  };
  network: {
    onLine: boolean;
    connectionType: string;
    effectiveType: string;
    downlink?: number;
    rtt?: number;
  };
  web3: {
    hasEthereum: boolean;
    hasMetaMask: boolean;
    hasCoinbase: boolean;
    hasWalletConnect: boolean;
    injectedProviders: string[];
  };
  performance: {
    memoryUsage?: any;
    timing: any;
    navigation: any;
  };
  errors: string[];
}

class MobileDebugger {
  private debugInfo: MobileDebugInfo;
  private errorLog: string[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.REACT_APP_ENV === 'staging' || process.env.REACT_APP_ENABLE_LOGGING === 'true';
    this.debugInfo = this.collectDebugInfo();
    
    if (this.isEnabled) {
      this.setupErrorCapture();
      this.setupPerformanceMonitoring();
      this.logInitialInfo();
    }
  }

  private collectDebugInfo(): MobileDebugInfo {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    
    // Network information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    // Web3 detection
    const ethereum = (window as any).ethereum;
    const injectedProviders = [];
    
    if (ethereum) {
      if (ethereum.isMetaMask) injectedProviders.push('MetaMask');
      if (ethereum.isCoinbaseWallet) injectedProviders.push('Coinbase');
      if (ethereum.isWalletConnect) injectedProviders.push('WalletConnect');
      if (ethereum.isTrust) injectedProviders.push('Trust');
      if (ethereum.isRabby) injectedProviders.push('Rabby');
    }

    return {
      timestamp: new Date().toISOString(),
      device: {
        userAgent,
        platform: navigator.platform,
        isMobile: isIOS || isAndroid,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        screenSize: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        pixelRatio: window.devicePixelRatio,
        touchSupport: 'ontouchstart' in window,
        orientation: screen.orientation?.type || 'unknown',
      },
      network: {
        onLine: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      },
      web3: {
        hasEthereum: !!ethereum,
        hasMetaMask: !!(ethereum?.isMetaMask),
        hasCoinbase: !!(ethereum?.isCoinbaseWallet),
        hasWalletConnect: !!(ethereum?.isWalletConnect),
        injectedProviders,
      },
      performance: {
        memoryUsage: (performance as any).memory,
        timing: performance.timing,
        navigation: performance.navigation,
      },
      errors: [...this.errorLog],
    };
  }

  private setupErrorCapture() {
    // Capture JavaScript errors
    window.addEventListener('error', (event) => {
      const error = `JS Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
      this.errorLog.push(error);
      this.log('🚨 JavaScript Error:', error);
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = `Unhandled Promise: ${event.reason}`;
      this.errorLog.push(error);
      this.log('🚨 Unhandled Promise Rejection:', error);
    });

    // Capture Web3 specific errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Web3') || message.includes('wallet') || message.includes('ethereum')) {
        this.errorLog.push(`Web3 Error: ${message}`);
        this.log('🚨 Web3 Error:', message);
      }
      originalConsoleError.apply(console, args);
    };
  }

  private setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        this.log('📊 Page Load Performance:', {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart,
        });
      }, 1000);
    });

    // Monitor memory usage (if available)
    if ((performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.log('⚠️ High Memory Usage:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private logInitialInfo() {
    this.log('📱 Mobile Debug Info:', this.debugInfo);
    
    // Store in localStorage for comparison
    const key = `mobile-debug-${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(this.debugInfo));
    
    // Keep only last 10 entries
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('mobile-debug-'));
    if (allKeys.length > 10) {
      allKeys.sort().slice(0, -10).forEach(k => localStorage.removeItem(k));
    }
  }

  public log(message: string, data?: any) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(`📱 [MOBILE-DEBUG] ${message}`, data || '');
    
    // Store in localStorage for remote debugging
    const logs = JSON.parse(localStorage.getItem('mobile-debug-logs') || '[]');
    logs.push({ timestamp, message, data });
    
    // Keep only last 100 log entries
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('mobile-debug-logs', JSON.stringify(logs));
  }

  public getDebugInfo(): MobileDebugInfo {
    return this.collectDebugInfo();
  }

  public exportDebugData(): string {
    const currentInfo = this.collectDebugInfo();
    const logs = JSON.parse(localStorage.getItem('mobile-debug-logs') || '[]');
    const allDebugSessions = Object.keys(localStorage)
      .filter(k => k.startsWith('mobile-debug-'))
      .map(k => JSON.parse(localStorage.getItem(k) || '{}'));

    return JSON.stringify({
      currentSession: currentInfo,
      logs,
      allSessions: allDebugSessions,
      exportTime: new Date().toISOString(),
    }, null, 2);
  }

  public testWalletConnection() {
    this.log('🔍 Testing Wallet Connection...');
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      this.log('❌ No ethereum provider found');
      return;
    }

    this.log('✅ Ethereum provider found:', {
      isMetaMask: ethereum.isMetaMask,
      isCoinbase: ethereum.isCoinbaseWallet,
      isWalletConnect: ethereum.isWalletConnect,
      chainId: ethereum.chainId,
      selectedAddress: ethereum.selectedAddress,
    });

    // Test connection
    ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        this.log('👛 Wallet accounts:', accounts);
      })
      .catch((error: any) => {
        this.log('❌ Wallet connection error:', error);
      });
  }

  public testNetworkConnection() {
    this.log('🌐 Testing Network Connection...');
    
    // Test RPC endpoints
    const rpcUrls = [
      'https://apechain.calderachain.xyz/http',
      'https://polygon-mainnet.g.alchemy.com/v2/' + process.env.REACT_APP_ALCHEMY_API_KEY,
    ];

    rpcUrls.forEach((url, index) => {
      if (!url.includes('undefined')) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
        })
        .then(response => response.json())
        .then(data => {
          this.log(`✅ RPC ${index + 1} working:`, { url: url.split('/').slice(0, 3).join('/'), blockNumber: data.result });
        })
        .catch(error => {
          this.log(`❌ RPC ${index + 1} failed:`, { url: url.split('/').slice(0, 3).join('/'), error: error.message });
        });
      }
    });
  }
}

// Global instance
export const mobileDebugger = new MobileDebugger();

// Expose to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).mobileDebugger = mobileDebugger;
  (window as any).exportMobileDebug = () => {
    const data = mobileDebugger.exportDebugData();
    console.log('📱 Mobile Debug Export:', data);
    
    // Create downloadable file
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return data;
  };
}