import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { authUtils } from '../../lib/auth'

export default function ResetPassword() {
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState([])
  const [router, setRouter] = useState(useRouter())

  useEffect(() => {
    // Check if this is a password reset callback
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('reset')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (!authUtils.isOnline()) {
      setMessage('You appear to be offline. Please check your internet connection.')
      setIsLoading(false)
      return
    }

    const result = await authUtils.resetPassword(email)

    if (result.success) {
      setMessage('Password reset email sent! Please check your inbox and spam folder.')
      setTimeout(() => setStep('success'), 2000)
    } else {
      setMessage(result.error?.message || 'Failed to send reset email')
    }

    setIsLoading(false)
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setPasswordErrors([])

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password strength
    const validation = authUtils.validatePassword(newPassword)
    if (!validation.isValid) {
      setPasswordErrors(validation.errors)
      setIsLoading(false)
      return
    }

    const result = await authUtils.updatePassword(newPassword)

    if (result.success) {
      setMessage('Password updated successfully!')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setMessage(result.error?.message || 'Failed to update password')
    }

    setIsLoading(false)
  }

  return (
    <>
      <Head>
        <title>Reset Password - NeuroLog</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '48px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
              borderRadius: '20px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              🔒
            </div>
            <h1 style={{ color: '#003087', fontSize: '28px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
              {step === 'request' && 'Reset Password'}
              {step === 'reset' && 'Create New Password'}
              {step === 'success' && 'Check Your Email'}
            </h1>
            <p style={{ color: '#666', fontSize: '16px', margin: '0', lineHeight: '1.6' }}>
              {step === 'request' && 'Enter your email to receive a password reset link'}
              {step === 'reset' && 'Choose a strong new password for your account'}
              {step === 'success' && 'We&apos;ve sent you a password reset link'}
            </p>
          </div>

          {step === 'request' && (
            <form onSubmit={handleRequestReset}>
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '16px',
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: isLoading ? '#ccc' : 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)',
                  marginBottom: '16px'
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: '#666',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Back to Login
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handlePasswordUpdate}>
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '16px',
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '16px',
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              {passwordErrors.length > 0 && (
                <div style={{
                  background: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <ul style={{ margin: '0', paddingLeft: '20px', color: '#c33' }}>
                    {passwordErrors.map((error, index) => (
                      <li key={index} style={{ fontSize: '14px' }}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: isLoading ? '#ccc' : 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)'
                }}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                If an account exists with that email, you'll receive a password reset link shortly.
              </p>
              <button
                onClick={() => router.push('/')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: '#666',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Back to Login
              </button>
            </div>
          )}

          {message && (
            <div style={{
              marginTop: '24px',
              padding: '18px',
              backgroundColor: message.includes('failed') || message.includes('Error') || message.includes('not match') ? '#fee' : '#efe',
              color: message.includes('failed') || message.includes('Error') || message.includes('not match') ? '#c33' : '#363',
              borderRadius: '16px',
              textAlign: 'center',
              fontSize: '15px',
              fontWeight: '500'
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  )
}