import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public readonly props: Readonly<Props>;
  public state: State = { hasError: false, error: null };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-8">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-500">Game Engine Error</h1>
            <p className="text-neutral-300">
              The game encountered a fatal error and needs to restart.
            </p>
            {this.state.error && (
              <div className="bg-neutral-800 p-4 rounded text-sm text-left overflow-auto max-h-40">
                <pre className="text-red-400">{this.state.error.message}</pre>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors"
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
