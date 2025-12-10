/**
 * Error Boundary Component
 * Phase D: Catch React crashes and show user-friendly fallbacks
 */

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="relative bg-red-900/20 border border-red-500/30 rounded-xl p-6 m-4">
          <div className="flex items-center text-red-300 mb-4">
            <span className="mr-2 text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-lg">Something went wrong</h3>
              <p className="text-sm text-red-400">The application encountered an unexpected error</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Web3 specific error boundary
export function Web3ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="relative bg-orange-900/20 border border-orange-500/30 rounded-xl p-6 m-4">
          <div className="flex items-center text-orange-300 mb-4">
            <span className="mr-2 text-2xl">🔗</span>
            <div>
              <h3 className="font-semibold text-lg">Wallet Connection Error</h3>
              <p className="text-sm text-orange-400">Please check your wallet connection and try again</p>
            </div>
          </div>
          <div className="space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Reload
            </button>
            <button
              onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}
              className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Reconnect Wallet
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}