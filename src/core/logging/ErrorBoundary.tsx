import { Component, type ReactNode } from 'react';
import { logger } from './Logger';

interface Props { children: ReactNode; }
interface State { hasError: boolean; msg: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, msg: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, msg: err.message };
  }

  componentDidCatch(err: Error, info: { componentStack: string }) {
    logger.error('ui', `React crash: ${err.message}`, { stack: info.componentStack.slice(0, 500) }, err.stack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: 'var(--color-text)', background: 'var(--color-bg)', minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>{this.state.msg}</div>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 18px', borderRadius: 8, background: 'linear-gradient(135deg, var(--color-primary), oklch(55% 0.22 290))', color: '#fff', border: 'none', cursor: 'pointer' }}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
