/**
 * CENTRALIZED TOAST MANAGER
 * Single source of truth for all toast notifications
 * Prevents duplications and ensures consistent UX
 */

import toast, { ToastOptions } from 'react-hot-toast';

// Toast ID tracking to prevent duplicates
const activeToasts = new Set<string>();
const toastTimers = new Map<string, NodeJS.Timeout>();

// Default configurations
const defaultConfig: ToastOptions = {
  duration: 4000,
  position: 'top-center',
  style: {
    background: 'rgba(15, 23, 42, 0.95)',
    color: '#f1f5f9',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '12px',
    backdropFilter: 'blur(12px)',
    fontSize: '14px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    maxWidth: '400px',
  },
};

// Specialized configurations
const configs = {
  success: {
    ...defaultConfig,
    duration: 4000,
    style: {
      ...defaultConfig.style,
      border: '1px solid rgba(34, 197, 94, 0.3)',
    },
  },
  error: {
    ...defaultConfig,
    duration: 5000,
    style: {
      ...defaultConfig.style,
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
  },
  loading: {
    ...defaultConfig,
    duration: Infinity,
    style: {
      ...defaultConfig.style,
      border: '1px solid rgba(59, 130, 246, 0.3)',
    },
  },
  warning: {
    ...defaultConfig,
    duration: 4500,
    style: {
      ...defaultConfig.style,
      border: '1px solid rgba(245, 158, 11, 0.3)',
    },
  },
};

// Deduplication helper
function createToastKey(type: string, message: string): string {
  return `${type}:${message.slice(0, 50)}`;
}

function preventDuplicate(key: string, duration: number): boolean {
  if (activeToasts.has(key)) {
    return false; // Duplicate detected
  }
  
  activeToasts.add(key);
  
  // Clear the key after duration + buffer
  const timer = setTimeout(() => {
    activeToasts.delete(key);
    toastTimers.delete(key);
  }, duration + 1000);
  
  toastTimers.set(key, timer);
  return true;
}

// Centralized toast manager
export const toastManager = {
  /**
   * Success toast with deduplication
   */
  success: (message: string, options?: Partial<ToastOptions>) => {
    const key = createToastKey('success', message);
    if (!preventDuplicate(key, configs.success.duration!)) return;
    
    return toast.success(message, {
      ...configs.success,
      ...options,
      icon: options?.icon || '✅',
    });
  },

  /**
   * Error toast with deduplication
   */
  error: (message: string, options?: Partial<ToastOptions>) => {
    const key = createToastKey('error', message);
    if (!preventDuplicate(key, configs.error.duration!)) return;
    
    return toast.error(message, {
      ...configs.error,
      ...options,
      icon: options?.icon || '❌',
    });
  },

  /**
   * Loading toast with automatic cleanup
   */
  loading: (message: string, options?: Partial<ToastOptions>) => {
    const key = createToastKey('loading', message);
    
    // Dismiss any existing loading toast with same message
    if (activeToasts.has(key)) {
      toastManager.dismiss(key);
    }
    
    activeToasts.add(key);
    
    const toastId = toast.loading(message, {
      ...configs.loading,
      ...options,
    });
    
    // Store toast ID for cleanup
    toastTimers.set(key, toastId as any);
    
    return toastId;
  },

  /**
   * Warning toast with deduplication
   */
  warning: (message: string, options?: Partial<ToastOptions>) => {
    const key = createToastKey('warning', message);
    if (!preventDuplicate(key, configs.warning.duration!)) return;
    
    return toast(message, {
      ...configs.warning,
      ...options,
      icon: options?.icon || '⚠️',
    });
  },

  /**
   * Info toast with deduplication
   */
  info: (message: string, options?: Partial<ToastOptions>) => {
    const key = createToastKey('info', message);
    if (!preventDuplicate(key, defaultConfig.duration!)) return;
    
    return toast(message, {
      ...defaultConfig,
      ...options,
      icon: options?.icon || 'ℹ️',
    });
  },

  /**
   * Dismiss specific toast
   */
  dismiss: (keyOrId: string) => {
    // Try as key first
    if (activeToasts.has(keyOrId)) {
      const timer = toastTimers.get(keyOrId);
      if (timer) {
        clearTimeout(timer as NodeJS.Timeout);
        toastTimers.delete(keyOrId);
      }
      activeToasts.delete(keyOrId);
    }
    
    // Try as toast ID
    toast.dismiss(keyOrId);
  },

  /**
   * Clear all toasts
   */
  clear: () => {
    activeToasts.clear();
    toastTimers.forEach(timer => clearTimeout(timer as NodeJS.Timeout));
    toastTimers.clear();
    toast.remove();
  },

  // Specialized toast categories
  transaction: {
    loading: (operation: string, options?: Partial<ToastOptions>) => {
      return toastManager.loading(`🔄 ${operation}...`, options);
    },

    success: (operation: string, options?: Partial<ToastOptions>) => {
      return toastManager.success(`🎉 ${operation} successful!`, {
        icon: '🎉',
        ...options,
      });
    },

    error: (operation: string, error?: string, options?: Partial<ToastOptions>) => {
      const message = error ? `${operation} failed: ${error}` : `${operation} failed`;
      return toastManager.error(message, {
        icon: '💥',
        ...options,
      });
    },

    replaceWithSuccess: (toastId: string, operation: string, options?: Partial<ToastOptions>) => {
      return toast.success(`🎉 ${operation} successful!`, {
        ...configs.success,
        ...options,
        id: toastId,
        icon: '🎉',
      });
    },

    replaceWithError: (toastId: string, operation: string, error?: string, options?: Partial<ToastOptions>) => {
      const message = error ? `${operation} failed: ${error}` : `${operation} failed`;
      return toast.error(message, {
        ...configs.error,
        ...options,
        id: toastId,
        icon: '💥',
      });
    },
  },

  wallet: {
    connectionLost: () => toastManager.error('Connection lost. Please reconnect your wallet.'),
    connectionFailed: () => toastManager.error('Connection failed. Please try refreshing the page.'),
    connectionCancelled: () => toastManager.error('Connection cancelled.'),
    networkIssue: () => toastManager.error('Network connection issue. Please check your internet and try again.'),
    insufficientFunds: (isPolygon: boolean) => 
      toastManager.error(isPolygon ? 'Insufficient POL for transaction fees' : 'Insufficient funds for transaction.'),
    userRejected: () => toastManager.error('Transaction cancelled by user.'),
    networkBusy: () => toastManager.error('Network busy. Please try again in a moment.'),
  },

  network: {
    congestion: (network: string, level: string) => {
      const icons = { low: '🟢', medium: '🟡', high: '🔴', extreme: '🚨' };
      return toastManager.warning(
        `${icons[level as keyof typeof icons] || '⚠️'} ${network} network congestion: ${level}`,
        { duration: 6000 }
      );
    },

    gasWarning: (gasPrice: string, cost: string) => {
      return toastManager.warning(`⛽ High gas fees: ${gasPrice} (~${cost})`, { duration: 8000 });
    },
  },

  copy: {
    success: (item: string = 'Address') => {
      return toastManager.success(`${item} copied!`, {
        duration: 2000,
        position: 'bottom-center',
        icon: '📋',
      });
    },

    error: () => {
      return toastManager.error('Failed to copy', {
        duration: 3000,
        position: 'bottom-center',
      });
    },
  },
};

// Export for backward compatibility
export { toast };
export default toastManager;