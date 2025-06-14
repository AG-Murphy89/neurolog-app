
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('Error caught by boundary:', error, errorInfo)
    
    // In a real app, you might want to log this to an error reporting service
    // errorReportingService.logError(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              ⚠️
            </div>
            
            <h1 style={{
              color: '#dc3545',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              color: '#666',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              NeuroLog encountered an unexpected error. This has been logged and we'll investigate the issue.
            </p>

            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e1e5e9',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#005EB8' }}>
                  Technical Details
                </summary>
                <pre style={{
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error?.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'transparent',
                  color: '#666',
                  border: '2px solid #e1e5e9',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Go Home
              </button>
            </div>

            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: '#e3f2fd',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#1565c0'
            }}>
              <strong>💙 Your data is safe:</strong> All your seizure records and medications are securely stored and will be available when you reload the page.
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: string) => {
    console.error('Error handled:', error, errorInfo)
    // You could also trigger a state update to show an error UI
  }
}
