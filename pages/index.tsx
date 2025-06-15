import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [isLogin, setIsLogin] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    type: 'personal',
    gdprConsent: false,
    dataSharing: false
  })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (!isLogin && !formData.gdprConsent) {
      setMessage('Please accept the privacy policy to continue')
      setIsLoading(false)
      return
    }

    if (!isLogin && !formData.password) {
      setMessage('Please enter a password')
      setIsLoading(false)
      return
    }

    try {
      if (isLogin) {
        // Login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          setMessage(`Login failed: ${error.message}`)
        } else {
          setMessage('Login successful!')
          setTimeout(() => router.push('/dashboard'), 1500)
        }
      } else {
        // Register with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              account_type: formData.type,
              gdpr_consent: formData.gdprConsent,
              data_sharing_consent: formData.dataSharing,
            }
          }
        })

        if (error) {
          setMessage(`Registration failed: ${error.message}`)
        } else {
          // Create user profile in our custom table
          if (data.user) {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert([
                {
                  id: data.user.id,
                  email: formData.email,
                  full_name: formData.name,
                  account_type: formData.type,
                  gdpr_consent: formData.gdprConsent,
                  data_sharing_consent: formData.dataSharing,
                }
              ])

            if (profileError) {
              console.error('Profile creation error:', profileError)
            }
          }

          setMessage('Registration successful! Please check your email to confirm your account.')
        }
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }

    setIsLoading(false)
  }

  return (
    <React.Fragment>
      <Head>
        <title>NeuroLog - Professional Seizure Tracking</title>
        <meta name="description" content="GDPR-compliant seizure tracking for personal use and healthcare providers" />
        <link rel="icon" href="/favicon.ico" />
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
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'slideUp 0.6s ease-out'
        }}>

          {/* Header */}
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
              🧠
            </div>
            <h1 style={{ 
              color: '#003087', 
              fontSize: '36px', 
              fontWeight: 'bold',
              margin: '0 0 12px 0'
            }}>
              NeuroLog
            </h1>
            <p style={{ 
              color: '#666', 
              fontSize: '18px',
              margin: '0',
              lineHeight: '1.6'
            }}>
              GDPR-compliant seizure tracking for personal use and healthcare providers
            </p>
          </div>

          {/* Tab Buttons */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '32px',
            backgroundColor: '#f8f9fa',
            borderRadius: '16px',
            padding: '6px'
          }}>
            <button 
              onClick={() => setIsLogin(false)} 
              style={{ 
                flex: 1,
                padding: '14px 24px',
                backgroundColor: !isLogin ? '#005EB8' : 'transparent',
                color: !isLogin ? 'white' : '#666',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: !isLogin ? 'translateY(-1px)' : 'none'
              }}
            >
              Create Account
            </button>
            <button 
              onClick={() => setIsLogin(true)}
              style={{ 
                flex: 1,
                padding: '14px 24px',
                backgroundColor: isLogin ? '#005EB8' : 'transparent',
                color: isLogin ? 'white' : '#666',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isLogin ? 'translateY(-1px)' : 'none'
              }}
            >
              Sign In
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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

            <div style={{ marginBottom: isLogin ? '16px' : '24px' }}>
              <input
                type="password"
                placeholder={isLogin ? "Password" : "Create a secure password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                minLength={isLogin ? 1 : 6}
              />
            </div>

            {isLogin && (
              <div style={{ marginBottom: '24px', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => router.push('/auth/reset-password')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#005EB8',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {!isLogin && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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

                <div style={{ marginBottom: '24px' }}>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '18px', 
                      borderRadius: '16px', 
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      outline: 'none',
                      backgroundColor: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="personal">Personal use (myself, family, loved one)</option>
                    <option value="professional">Professional care (care home, medical practice)</option>
                  </select>
                </div>

                {/* GDPR Consent */}
                <div style={{ 
                  marginBottom: '24px',
                  padding: '24px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '16px',
                  border: '2px solid #e1e5e9'
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.gdprConsent}
                        onChange={(e) => setFormData({...formData, gdprConsent: e.target.checked})}
                        style={{ marginRight: '12px', marginTop: '2px' }}
                        required
                      />
                      <span style={{ fontSize: '15px', color: '#333', lineHeight: '1.5' }}>
                        I consent to processing my health data for seizure tracking and have read the 
                        <span style={{ color: '#005EB8', fontWeight: '600' }}> Privacy Policy</span>
                        <br/><small style={{ color: '#666' }}>Data is stored securely in EU servers and encrypted.</small>
                      </span>
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.dataSharing}
                        onChange={(e) => setFormData({...formData, dataSharing: e.target.checked})}
                        style={{ marginRight: '12px', marginTop: '2px' }}
                      />
                      <span style={{ fontSize: '15px', color: '#666', lineHeight: '1.5' }}>
                        I consent to sharing my data with healthcare providers (optional)
                      </span>
                    </label>
                  </div>
                </div>
              </>
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
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)',
                transform: isLoading ? 'none' : 'translateY(-1px)'
              }}
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {message && (
            <div style={{ 
              marginTop: '24px', 
              padding: '18px', 
              backgroundColor: message.includes('failed') || message.includes('Error') ? '#fee' : '#efe',
              color: message.includes('failed') || message.includes('Error') ? '#c33' : '#363',
              borderRadius: '16px',
              textAlign: 'center',
              fontSize: '15px',
              fontWeight: '500'
            }}>
              {message}
            </div>
          )}

          {/* Professional Portals */}
          <div style={{
            textAlign: 'center',
            marginTop: '32px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '16px',
            border: '1px solid #e1e5e9'
          }}>
            <p style={{ color: '#666', margin: '0 0 16px 0', fontSize: '14px' }}>
              Healthcare Professional?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/doctor-login"
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ⚕️ Doctor Portal
              </Link>
              <Link
                href="/care-home-login"
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🏠 Care Home Portal
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '24px',
            fontSize: '13px',
            color: '#999'
          }}>
            🔒 EU-hosted, GDPR-compliant seizure tracking
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </React.Fragment>
  )
}