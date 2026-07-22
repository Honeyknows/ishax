import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, background: 'var(--bg-2)', borderRadius: 12,
          border: '1px solid var(--border)', margin: 16, gap: 12,
          color: 'var(--text)', textAlign: 'center'
        }}>
          <AlertTriangle size={40} color="var(--crit)" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            {this.props.fallbackTitle || 'Component Error'}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
              color: '#fff', background: 'var(--accent)', border: 'none',
              borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <RefreshCw size={12} /> Retry Component
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
