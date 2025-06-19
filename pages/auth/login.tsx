import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

interface LoginFormData {
  email: string
  password: string
}

export default function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // Removed automatic redirect to allow users to enter login details

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: {[key: string]: string} = {}

    // Validation
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) {
          setErrors({ email: error.message })
        } else {
          setMessage('Login successful!')
          router.push('/dashboard')
        }
      } catch (error: any) {
        setErrors({ email: 'Login failed. Please try again.' })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <Head>
        <title>Sign In - NeuroLog</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e1e5e9',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ 
              color: '#003087', 
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              Welcome Back
            </h1>
            <p style={{ color: '#666', margin: 0 }}>Sign in to your NeuroLog account</p>
          </div>

          {message && (
            <div style={{
              background: '#d4edda',
              color: '#155724',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: errors.email ? '2px solid #ff4757' : '2px solid #e1e5e9',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.email && <div style={{ color: '#ff4757', fontSize: '14px', marginTop: '4px' }}>{errors.email}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: errors.password ? '2px solid #ff4757' : '2px solid #e1e5e9',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.password && <div style={{ color: '#ff4757', fontSize: '14px', marginTop: '4px' }}>{errors.password}</div>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isLoading ? '#ccc' : 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)'
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ color: '#666', margin: 0 }}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" style={{ color: '#005EB8', textDecoration: 'none', fontWeight: '500' }}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}