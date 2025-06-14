
export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
}

export const notificationService = {
  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  },

  // Show notification
  async showNotification(options: NotificationOptions): Promise<boolean> {
    const hasPermission = await this.requestPermission()
    
    if (!hasPermission) {
      return false
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false
      })

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000)
      }

      return true
    } catch (error) {
      console.error('Failed to show notification:', error)
      return false
    }
  },

  // Medication reminder
  async medicationReminder(medicationName: string, dosage: string): Promise<boolean> {
    return this.showNotification({
      title: '💊 Medication Reminder',
      body: `Time to take ${dosage} of ${medicationName}`,
      tag: 'medication-reminder',
      requireInteraction: true
    })
  },

  // Seizure alert
  async seizureAlert(message: string): Promise<boolean> {
    return this.showNotification({
      title: '🚨 NeuroLog Alert',
      body: message,
      tag: 'seizure-alert',
      requireInteraction: true
    })
  },

  // Data sync notification
  async dataSyncNotification(message: string): Promise<boolean> {
    return this.showNotification({
      title: '🔄 NeuroLog',
      body: message,
      tag: 'data-sync'
    })
  }
}

// Offline detection utility
export const offlineUtils = {
  // Check if user is online
  isOnline(): boolean {
    return navigator.onLine
  },

  // Set up online/offline event listeners
  setupOfflineDetection(
    onOnline: () => void, 
    onOffline: () => void
  ): () => void {
    const handleOnline = () => {
      notificationService.dataSyncNotification('You\'re back online! Syncing your data...')
      onOnline()
    }

    const handleOffline = () => {
      notificationService.dataSyncNotification('You\'re offline. Your data will sync when you reconnect.')
      onOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  },

  // Show offline warning
  showOfflineWarning(): void {
    const warning = document.createElement('div')
    warning.id = 'offline-warning'
    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff6b35;
      color: white;
      padding: 12px;
      text-align: center;
      font-weight: 500;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    `
    warning.textContent = '⚠️ You\'re offline. Some features may not work until you reconnect.'

    document.body.appendChild(warning)
  },

  // Hide offline warning
  hideOfflineWarning(): void {
    const warning = document.getElementById('offline-warning')
    if (warning) {
      warning.remove()
    }
  }
}
