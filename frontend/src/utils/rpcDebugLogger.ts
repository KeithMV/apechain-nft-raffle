/**
 * RPC Debug Logger
 * Captures critical RPC error information for debugging
 */

interface RPCDebugLog {
  timestamp: string;
  operation: string;
  attempt: number;
  error?: any;
  details?: any;
}

class RPCDebugLogger {
  private logs: RPCDebugLog[] = [];
  private maxLogs = 50;

  log(operation: string, details: any, error?: any) {
    const logEntry: RPCDebugLog = {
      timestamp: new Date().toISOString(),
      operation,
      attempt: this.logs.filter(l => l.operation === operation).length + 1,
      error: error ? this.sanitizeError(error) : undefined,
      details: this.sanitizeDetails(details),
    };

    this.logs.push(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console with clear formatting
    console.log('\n' + '='.repeat(80));
    console.log(`[RPC DEBUG] ${operation} - Attempt ${logEntry.attempt}`);
    console.log(`[TIMESTAMP] ${logEntry.timestamp}`);
    
    if (details) {
      console.log('[DETAILS]', JSON.stringify(details, null, 2));
    }
    
    if (error) {
      console.log('[ERROR]', this.formatError(error));
    }
    console.log('='.repeat(80) + '\n');
  }

  private sanitizeError(error: any): any {
    if (!error) return null;
    
    return {
      name: error.name || 'Unknown',
      message: error.message || String(error),
      code: error.code,
      shortMessage: error.shortMessage,
      details: error.details,
      cause: error.cause ? {
        name: error.cause.name,
        message: error.cause.message,
      } : undefined,
    };
  }

  private sanitizeDetails(details: any): any {
    if (!details) return null;
    
    // Remove functions and complex objects
    return JSON.parse(JSON.stringify(details, (key, value) => {
      if (typeof value === 'function') return '[Function]';
      if (value instanceof Error) return this.sanitizeError(value);
      return value;
    }));
  }

  private formatError(error: any): string {
    const sanitized = this.sanitizeError(error);
    return JSON.stringify(sanitized, null, 2);
  }

  getLogs() {
    return this.logs;
  }

  getLogsAsText(): string {
    return this.logs.map(log => {
      const parts = [
        `[${log.timestamp}] ${log.operation} (Attempt ${log.attempt})`,
        log.details ? `Details: ${JSON.stringify(log.details)}` : '',
        log.error ? `Error: ${JSON.stringify(log.error)}` : '',
      ];
      return parts.filter(Boolean).join('\n');
    }).join('\n\n' + '='.repeat(80) + '\n\n');
  }

  copyToClipboard() {
    const text = this.getLogsAsText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      console.log('✅ RPC debug logs copied to clipboard!');
    } else {
      console.log('📋 Copy this text:\n\n' + text);
    }
  }

  clear() {
    this.logs = [];
    console.log('🧹 RPC debug logs cleared');
  }
}

export const rpcDebugLogger = new RPCDebugLogger();

// Make it globally accessible for easy console access
if (typeof window !== 'undefined') {
  (window as any).rpcDebugLogger = rpcDebugLogger;
  (window as any).copyRPCLogs = () => rpcDebugLogger.copyToClipboard();
  (window as any).clearRPCLogs = () => rpcDebugLogger.clear();
  (window as any).showRPCLogs = () => console.log(rpcDebugLogger.getLogsAsText());
  
  console.log('🔧 RPC Debug Logger loaded. Available commands:');
  console.log('  - copyRPCLogs()  : Copy all logs to clipboard');
  console.log('  - showRPCLogs()  : Display all logs in console');
  console.log('  - clearRPCLogs() : Clear all logs');
}
