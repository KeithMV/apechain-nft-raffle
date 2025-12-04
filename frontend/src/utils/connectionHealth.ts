export interface ConnectionHealth {
  isOnline: boolean;
  lastCheck: number;
  retryCount: number;
}

class ConnectionHealthMonitor {
  private health: ConnectionHealth = {
    isOnline: navigator.onLine,
    lastCheck: Date.now(),
    retryCount: 0
  };

  private listeners: ((health: ConnectionHealth) => void)[] = [];

  constructor() {
    // Monitor online/offline status
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Periodic health check
    setInterval(this.checkHealth, 30000); // Check every 30 seconds
  }

  private handleOnline = () => {
    this.health.isOnline = true;
    this.health.retryCount = 0;
    this.health.lastCheck = Date.now();
    this.notifyListeners();
  };

  private handleOffline = () => {
    this.health.isOnline = false;
    this.health.lastCheck = Date.now();
    this.notifyListeners();
  };

  private checkHealth = async () => {
    try {
      // Simple connectivity check
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const wasOffline = !this.health.isOnline;
      this.health.isOnline = response.ok;
      this.health.lastCheck = Date.now();
      
      if (wasOffline && this.health.isOnline) {
        this.health.retryCount = 0;
      }
      
      this.notifyListeners();
    } catch {
      this.health.isOnline = false;
      this.health.retryCount++;
      this.health.lastCheck = Date.now();
      this.notifyListeners();
    }
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.health));
  }

  public subscribe(listener: (health: ConnectionHealth) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getHealth(): ConnectionHealth {
    return { ...this.health };
  }

  public isHealthy(): boolean {
    return this.health.isOnline && this.health.retryCount < 3;
  }
}

export const connectionHealthMonitor = new ConnectionHealthMonitor();

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if offline
      if (!connectionHealthMonitor.isHealthy()) {
        throw new Error('Connection unhealthy, skipping retry');
      }
      
      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError!;
};