'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen gradient-mesh flex items-center justify-center px-4 relative overflow-hidden">
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000" />
          
          <div className="glass-strong rounded-3xl p-8 sm:p-12 text-center max-w-lg relative z-10">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center ring-2 ring-red-400/20">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            
            {/* Message */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 drop-shadow-lg">
              Something went wrong
            </h1>
            <p className="text-white/70 mb-6 text-sm sm:text-base">
              We encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>
            
            {/* Error details (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="glass-card p-4 rounded-xl mb-6 text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="glass-button px-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <Link
                href="/"
                className="glass-light px-6 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

