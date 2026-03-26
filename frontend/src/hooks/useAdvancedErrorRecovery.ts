import { useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChainId } from 'wagmi';
import { useChainConfig } from './useChainConfig';
import { useRPCHealthMonitor } from './useRPCHealthMonitor';

interface ErrorPattern {
  type: string;
  frequency: number;
  lastOccurrence: number;
  context: string[];
}

interface RecoveryStrategy {
  maxRetries: number;
  backoffMultiplier: number;
  fallbackAction: () => Promise<void>;
  shouldRetry: (error: Error, attempt: number) => boolean;
}

export const useAdvancedErrorRecovery = () => {
  const queryClient = useQueryClient();
  const chainId = useChainId();
  const chainConfig = useChainConfig();
  const { getBestEndpoint, reportFailure } = useRPCHealthMonitor(chainId);
  const errorPatternsRef = useRef<Map<string, ErrorPattern>>(new Map());
  const recoveryAttemptsRef = useRef<Map<string, number>>(new Map());

  // Analyze error patterns to predict and prevent failures
  const analyzeError = useCallback((error: Error, context: string) => {
    const errorKey = `${error.name}-${error.message.slice(0, 50)}`;
    const patterns = errorPatternsRef.current;
    
    const existing = patterns.get(errorKey) || {
      type: error.name,
      frequency: 0,
      lastOccurrence: 0,
      context: []
    };
    
    existing.frequency += 1;
    existing.lastOccurrence = Date.now();
    if (!existing.context.includes(context)) {
      existing.context.push(context);
    }
    
    patterns.set(errorKey, existing);
    
    // Clean old patterns (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, pattern] of patterns.entries()) {
      if (pattern.lastOccurrence < oneHourAgo) {
        patterns.delete(key);
      }
    }
  }, []);

  // Get recovery strategy based on error type and context
  const getRecoveryStrategy = useCallback((error: Error, context: string): RecoveryStrategy => {
    const errorKey = `${error.name}-${error.message.slice(0, 50)}`;
    const pattern = errorPatternsRef.current.get(errorKey);
    
    // Network/RPC errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout')) {
      return {
        maxRetries: 3,
        backoffMultiplier: 2,
        fallbackAction: async () => {
          reportFailure('current-endpoint');
          queryClient.invalidateQueries({ queryKey: [context, chainId] });
        },
        shouldRetry: (err, attempt) => attempt < 3 && !err.message.includes('user rejected')
      };
    }
    
    // Transaction errors
    if (error.message.includes('transaction') || error.message.includes('gas')) {
      return {
        maxRetries: 2,
        backoffMultiplier: 1.5,
        fallbackAction: async () => {
          // Refresh gas estimates and retry with higher gas
          queryClient.invalidateQueries({ queryKey: ['gas-estimate', chainId] });
        },
        shouldRetry: (err, attempt) => attempt < 2 && !err.message.includes('insufficient funds')
      };
    }
    
    // Cache/data errors
    if (error.message.includes('cache') || error.message.includes('stale')) {
      return {
        maxRetries: 1,
        backoffMultiplier: 1,
        fallbackAction: async () => {
          queryClient.clear();
          queryClient.invalidateQueries();
        },
        shouldRetry: () => true
      };
    }
    
    // Frequent errors get more aggressive recovery
    if (pattern && pattern.frequency > 3) {
      return {
        maxRetries: 1,
        backoffMultiplier: 1,
        fallbackAction: async () => {
          // Force refresh all related data
          queryClient.invalidateQueries({ queryKey: [context] });
          await new Promise(resolve => setTimeout(resolve, 1000));
        },
        shouldRetry: () => false
      };
    }
    
    // Default strategy
    return {
      maxRetries: 2,
      backoffMultiplier: 1.5,
      fallbackAction: async () => {
        queryClient.invalidateQueries({ queryKey: [context, chainId] });
      },
      shouldRetry: (err, attempt) => attempt < 2
    };
  }, [chainId, queryClient, reportFailure]);

  // Execute operation with intelligent retry and recovery
  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string,
    customStrategy?: Partial<RecoveryStrategy>
  ): Promise<T> => {
    const attemptKey = `${context}-${Date.now()}`;
    let lastError: Error;
    
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await operation();
        
        // Clear recovery attempts on success
        recoveryAttemptsRef.current.delete(attemptKey);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        analyzeError(lastError, context);
        
        const strategy = { ...getRecoveryStrategy(lastError, context), ...customStrategy };
        
        if (!strategy.shouldRetry(lastError, attempt)) {
          break;
        }
        
        // Execute fallback action
        try {
          await strategy.fallbackAction();
        } catch (fallbackError) {
          console.warn('Fallback action failed:', fallbackError);
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(strategy.backoffMultiplier, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        recoveryAttemptsRef.current.set(attemptKey, attempt + 1);
      }
    }
    
    // All retries failed
    recoveryAttemptsRef.current.delete(attemptKey);
    throw lastError!;
  }, [analyzeError, getRecoveryStrategy]);

  // Proactive error prevention based on patterns
  const preventiveActions = useCallback(() => {
    const patterns = errorPatternsRef.current;
    const now = Date.now();
    const recentThreshold = 300000; // 5 minutes
    
    for (const [errorKey, pattern] of patterns.entries()) {
      if (now - pattern.lastOccurrence < recentThreshold && pattern.frequency > 2) {
        // Proactive cache refresh for frequent cache errors
        if (pattern.type.includes('cache') || pattern.type.includes('stale')) {
          pattern.context.forEach(context => {
            queryClient.invalidateQueries({ queryKey: [context, chainId] });
          });
        }
        
        // Proactive endpoint switching for network errors
        if (pattern.type.includes('network') || pattern.type.includes('fetch')) {
          reportFailure('current-endpoint');
        }
      }
    }
  }, [chainId, queryClient, reportFailure]);

  // Circuit breaker for repeated failures
  const circuitBreaker = useCallback((context: string): boolean => {
    const attempts = recoveryAttemptsRef.current;
    const contextAttempts = Array.from(attempts.entries())
      .filter(([key]) => key.includes(context))
      .length;
    
    // If too many concurrent recovery attempts, circuit is open
    return contextAttempts > 5;
  }, []);

  // Periodic cleanup and preventive actions
  useEffect(() => {
    const interval = setInterval(() => {
      preventiveActions();
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [preventiveActions]);

  return {
    executeWithRecovery,
    analyzeError,
    getRecoveryStrategy,
    circuitBreaker,
    preventiveActions
  };
};