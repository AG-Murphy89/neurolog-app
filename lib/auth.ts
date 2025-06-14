
import { supabase } from './supabase'

export interface AuthError {
  message: string
  type: 'auth' | 'network' | 'validation'
}

export const authUtils = {
  // Password reset
  async resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return {
          success: false,
          error: {
            message: this.getReadableError(error.message),
            type: 'auth'
          }
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: 'Network error. Please check your connection and try again.',
          type: 'network'
        }
      }
    }
  },

  // Update password
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return {
          success: false,
          error: {
            message: this.getReadableError(error.message),
            type: 'auth'
          }
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: 'Network error. Please check your connection and try again.',
          type: 'network'
        }
      }
    }
  },

  // Resend email verification
  async resendVerification(email: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        return {
          success: false,
          error: {
            message: this.getReadableError(error.message),
            type: 'auth'
          }
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: 'Network error. Please check your connection and try again.',
          type: 'network'
        }
      }
    }
  },

  // Sign out from all sessions
  async signOutEverywhere(): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) {
        return {
          success: false,
          error: {
            message: this.getReadableError(error.message),
            type: 'auth'
          }
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: 'Network error. Please check your connection and try again.',
          type: 'network'
        }
      }
    }
  },

  // Check if user is online
  isOnline(): boolean {
    return navigator.onLine
  },

  // Validate password strength
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Get user-friendly error messages
  getReadableError(errorMessage: string): string {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'The email or password you entered is incorrect. Please check and try again.',
      'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
      'User not found': 'No account found with this email address.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
      'User already registered': 'An account with this email already exists. Try signing in instead.',
      'Invalid email': 'Please enter a valid email address.',
      'Password is too short': 'Password must be at least 6 characters long.',
      'Signup is disabled': 'New registrations are currently disabled. Please contact support.',
      'Too many requests': 'Too many requests. Please wait a moment before trying again.',
      'Invalid refresh token': 'Your session has expired. Please sign in again.',
      'Email address not authorized': 'This email address is not authorized to access this application.'
    }

    // Check for exact matches first
    if (errorMap[errorMessage]) {
      return errorMap[errorMessage]
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }

    // Default fallback
    return errorMessage || 'An unexpected error occurred. Please try again.'
  }
}
