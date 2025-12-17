import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WalletErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error in development only with sanitization
    if (process.env.NODE_ENV === 'development') {
      const sanitizedError = {
        message: error.message?.replace(/[\r\n\t]/g, '').slice(0, 200),
        name: error.name?.replace(/[\r\n\t]/g, '').slice(0, 50),
        stack: error.stack?.replace(/[\r\n\t]/g, ' ').slice(0, 500)
      };
      const sanitizedInfo = {
        componentStack: errorInfo.componentStack?.replace(/[\r\n\t]/g, ' ').slice(0, 300)
      };
      console.error('Wallet Error Boundary caught an error:', sanitizedError, sanitizedInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-red-400 text-sm mb-2">Connection Error</div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}