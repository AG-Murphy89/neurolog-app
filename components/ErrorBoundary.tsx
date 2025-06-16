<<<<<<< HEAD
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}
=======
'use client'
import React from 'react'
>>>>>>> 6091c2daa5af0a447ec6fc607fa2447557d51561

interface State {
  hasError: boolean
  error?: Error
}

<<<<<<< HEAD
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
=======
class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
>>>>>>> 6091c2daa5af0a447ec6fc607fa2447557d51561
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: '#f8f9fa',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>Something went wrong.</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            We&apos;re sorry, but something went wrong. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

<<<<<<< HEAD
export default ErrorBoundary
export { ErrorBoundary }
=======
export { ErrorBoundary }
>>>>>>> 6091c2daa5af0a447ec6fc607fa2447557d51561
