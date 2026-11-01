import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
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
        <div className="error-state">
          <div className="error-state-icon"><AlertTriangle size={32} strokeWidth={1.8} aria-hidden="true" /></div>
          <div className="error-state-title">Something went wrong</div>
          <div className="empty-state-text">{this.state.msg}</div>
          <button className="error-state-btn" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
