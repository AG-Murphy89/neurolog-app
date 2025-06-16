import '../styles/globals.css'
import type { AppProps } from 'next/app'
import ErrorBoundary from '../components/ErrorBoundary'
import { useEffect } from 'react'
import { offlineUtils } from '../lib/notifications'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Set up offline detection
    const cleanup = offlineUtils.setupOfflineDetection(
      () => {
        offlineUtils.hideOfflineWarning()
      },
      () => {
        offlineUtils.showOfflineWarning()
      }
    )

    // Show warning if already offline
    if (!offlineUtils.isOnline()) {
      offlineUtils.showOfflineWarning()
    }

    return cleanup
  }, [])

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  )
}