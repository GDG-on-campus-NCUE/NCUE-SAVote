import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-background)'
        }}>
          <Card style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ 
              color: 'var(--color-error)', 
              marginBottom: 'var(--spacing-md)',
              fontSize: 'var(--font-size-xl)'
            }}>
              發生錯誤
            </h2>
            <p style={{ 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--spacing-lg)' 
            }}>
              系統發生預期外的錯誤，請嘗試重新整理頁面。
            </p>
            {this.state.error && (
              <pre style={{
                textAlign: 'left',
                backgroundColor: 'var(--color-surface-hover)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: 'var(--font-size-xs)',
                overflow: 'auto',
                marginBottom: 'var(--spacing-lg)',
                maxHeight: '200px'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset} variant="primary" fullWidth>
              重新整理
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
