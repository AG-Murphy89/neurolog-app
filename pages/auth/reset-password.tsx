import React from 'react'
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
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    // Check for reset token in URL
    const { access_token, type } = router.query
    if (access_token && type === 'recovery') {
      setStep('reset')
    }
  }, [router.query])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Password reset email sent! Check your inbox.')
        setStep('success')
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }

    setIsLoading(false)
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    // Validate password
    const errors = authUtils.validatePassword(newPassword)
    setPasswordErrors(errors)

    if (errors.length > 0) {
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Password updated successfully!')
        setTimeout(() => router.push('/'), 2000)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
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
              color: 'white'
            }}>
              🔑
            </div>
            <h1 style={{ 
              color: '#003087', 
              fontSize: '32px', 
              fontWeight: 'bold',
              margin: '0 0 12px 0'
            }}>
              {step === 'request' ? 'Reset Password' : 
               step === 'reset' ? 'Set New Password' : 
               'Password Reset'}
            </h1>
            <p style={{ 
              color: '#666', 
              fontSize: '16px',
              margin: '0',
              lineHeight: '1.6'
            }}>
              {step === 'request' ? 'Enter your email to receive reset instructions' :
               step === 'reset' ? 'Enter your new password' :
               'Your password has been reset successfully'}
            </p>
          </div>

          {step === 'request' && (
            <form onSubmit={handleRequestReset}>
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  marginBottom: '24px',
                  boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)'
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handlePasswordReset}>
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
                <div style={{ marginBottom: '24px' }}>
                  {passwordErrors.map((error, index) => (
                    <div key={index} style={{ color: '#dc3545', fontSize: '14px', marginBottom: '4px' }}>
                      • {error}
                    </div>
                  ))}
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
                  marginBottom: '24px',
                  boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)'
                }}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {message && (
            <div style={{ 
              marginTop: '24px', 
              padding: '18px', 
              backgroundColor: message.includes('Error') ? '#fee' : '#efe',
              color: message.includes('Error') ? '#c33' : '#363',
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
