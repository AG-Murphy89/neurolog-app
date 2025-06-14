
// Privacy-compliant monitoring utilities
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Privacy-compliant analytics
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'page_view',
        url: url,
        timestamp: new Date().toISOString(),
        // No personal data tracked
      })
    }).catch(() => {
      // Fail silently for analytics
    })
  }
}

export const trackError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Application Error:', error)
    
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Fail silently for error logging
    })
  }
}

export const trackUserAction = (action: string, metadata?: Record<string, any>) => {
  if (typeof window !== 'undefined' && process.env.ENABLE_ANALYTICS === 'true') {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'user_action',
        action,
        metadata,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Fail silently
    })
  }
}
