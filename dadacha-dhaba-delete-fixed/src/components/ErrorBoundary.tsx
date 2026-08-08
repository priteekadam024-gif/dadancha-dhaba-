import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#161616] border border-red-800/60 rounded-3xl p-8 my-6 text-center space-y-4 shadow-2xl max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-red-950/80 border border-red-800/80 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-white text-xl">
            {this.props.fallbackTitle || 'Something went wrong rendering this panel.'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected runtime rendering error occurred.'}
          </p>
          <div className="pt-2">
            <button
              onClick={this.handleReset}
              className="bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-xs px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-xl inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again / Reload Component</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
