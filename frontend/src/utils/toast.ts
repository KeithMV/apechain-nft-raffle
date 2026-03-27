/**
 * Centralized Toast Utilities
 * Provides consistent toast styling and behavior across the application
 */

import toast, { ToastOptions } from 'react-hot-toast';

// Default toast configurations
const defaultToastOptions: ToastOptions = {
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

// Specialized toast configurations
const toastConfigs = {
  success: {
    ...defaultToastOptions,
    duration: 4000,
    style: {
      ...defaultToastOptions.style,
      border: '1px solid rgba(34, 197, 94, 0.3)',
      background: 'rgba(15, 23, 42, 0.95)',
    },
  },
  error: {
    ...defaultToastOptions,
    duration: 5000,
    style: {
      ...defaultToastOptions.style,
      border: '1px solid rgba(239, 68, 68, 0.3)',
      background: 'rgba(15, 23, 42, 0.95)',
    },
  },
  loading: {
    ...defaultToastOptions,
    duration: Infinity,
    style: {
      ...defaultToastOptions.style,
      border: '1px solid rgba(59, 130, 246, 0.3)',
      background: 'rgba(15, 23, 42, 0.95)',
    },
  },
  warning: {
    ...defaultToastOptions,
    duration: 4500,
    style: {
      ...defaultToastOptions.style,
      border: '1px solid rgba(245, 158, 11, 0.3)',
      background: 'rgba(15, 23, 42, 0.95)',
    },
  },
};

// Centralized toast utilities
export const appToast = {
  /**
   * Show success toast
   */
  success: (message: string, options?: Partial<ToastOptions>) => {
    return toast.success(message, {
      ...toastConfigs.success,
      ...options,
      icon: options?.icon || '✅',
    });
  },

  /**
   * Show error toast
   */
  error: (message: string, options?: Partial<ToastOptions>) => {
    return toast.error(message, {
      ...toastConfigs.error,
      ...options,
      icon: options?.icon || '❌',
    });
  },

  /**
   * Show loading toast
   */
  loading: (message: string, options?: Partial<ToastOptions>) => {
    return toast.loading(message, {
      ...toastConfigs.loading,
      ...options,
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, options?: Partial<ToastOptions>) => {
    return toast(message, {
      ...toastConfigs.warning,
      ...options,
      icon: options?.icon || '⚠️',
    });
  },

  /**
   * Show info toast
   */
  info: (message: string, options?: Partial<ToastOptions>) => {
    return toast(message, {
      ...defaultToastOptions,
      ...options,
      icon: options?.icon || 'ℹ️',
    });
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },

  /**
   * Remove all toasts
   */
  remove: () => {
    return toast.remove();
  },

  /**
   * Transaction-specific toasts
   */
  transaction: {
    /**
     * Show transaction loading toast
     */
    loading: (operation: string, options?: Partial<ToastOptions>) => {
      return toast.loading(`🔄 ${operation}...`, {
        ...toastConfigs.loading,
        ...options,
      });
    },

    /**
     * Show transaction success toast
     */
    success: (operation: string, options?: Partial<ToastOptions>) => {
      return toast.success(`✅ ${operation} successful!`, {
        ...toastConfigs.success,
        ...options,
        icon: '🎉',
      });
    },

    /**
     * Show transaction error toast
     */
    error: (operation: string, error?: string, options?: Partial<ToastOptions>) => {
      const message = error ? `${operation} failed: ${error}` : `${operation} failed`;
      return toast.error(message, {
        ...toastConfigs.error,
        ...options,
        icon: '💥',
      });
    },

    /**
     * Replace a loading toast with success
     */
    replaceWithSuccess: (toastId: string, operation: string, options?: Partial<ToastOptions>) => {
      return toast.success(`🎉 ${operation} successful!`, {
        ...toastConfigs.success,
        ...options,
        id: toastId, // Replace the existing toast
      });
    },

    /**
     * Replace a loading toast with error
     */
    replaceWithError: (toastId: string, operation: string, error?: string, options?: Partial<ToastOptions>) => {
      const message = error ? `${operation} failed: ${error}` : `${operation} failed`;
      return toast.error(message, {
        ...toastConfigs.error,
        ...options,
        id: toastId, // Replace the existing toast
        icon: '💥',
      });
    },
  },

  /**
   * Network-specific toasts
   */
  network: {
    /**
     * Show network congestion warning
     */
    congestion: (network: string, level: string, options?: Partial<ToastOptions>) => {
      const icons = {
        low: '🟢',
        medium: '🟡', 
        high: '🔴',
        extreme: '🚨'
      };
      
      return toast(`${icons[level as keyof typeof icons] || '⚠️'} ${network} network congestion: ${level}`, {
        ...toastConfigs.warning,
        duration: 6000,
        ...options,
      });
    },

    /**
     * Show gas price warning
     */
    gasWarning: (gasPrice: string, cost: string, options?: Partial<ToastOptions>) => {
      return toast(`⛽ High gas fees: ${gasPrice} (~${cost})`, {
        ...toastConfigs.warning,
        duration: 8000,
        ...options,
      });
    },
  },

  /**
   * Copy-related toasts
   */
  copy: {
    success: (item: string = 'Address', options?: Partial<ToastOptions>) => {
      return toast.success(`${item} copied!`, {
        ...toastConfigs.success,
        duration: 2000,
        position: 'bottom-center',
        icon: '📋',
        ...options,
      });
    },

    error: (options?: Partial<ToastOptions>) => {
      return toast.error('Failed to copy', {
        ...toastConfigs.error,
        duration: 3000,
        position: 'bottom-center',
        ...options,
      });
    },
  },
};

// Export the original toast for backward compatibility
export { toast };
export default appToast;