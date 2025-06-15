import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

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
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: {[key: string]: string} = {}

    // Validation
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      // Check if account exists
      const storedAccount = localStorage.getItem(`neurolog_account_${formData.email}`)

      if (storedAccount) {
        const accountData = JSON.parse(storedAccount)
        if (accountData.password === formData.password) {
          // Login successful
          localStorage.setItem('neurolog_user', JSON.stringify(accountData))
          router.push('/dashboard')
        } else {
          setErrors({ password: 'Invalid password' })
        }
      } else {
        setErrors({ email: 'Account not found' })
      }
    }
  }

  const handleDemoLogin = (userType: string) => {
    const demoUsers = {
      patient: {
        id: 'demo_patient',
        email: 'patient@demo.com',
        firstName: 'John',
        lastName: 'Patient',
        name: 'John Patient',
        type: 'patient'
      },
      family: {
        id: 'demo_family',
        email: 'family@demo.com',
        firstName: 'Sarah',
        lastName: 'Family',
        name: 'Sarah Family',
        type: 'family'
      },
      professional: {
        id: 'demo_professional',
        email: 'doctor@demo.com',
        firstName: 'Dr. Emma',
        lastName: 'Professional',
        name: 'Dr. Emma Professional',
        type: 'professional',
        organizationName: 'NeuroHealth Clinic',
        professionalId: 'GMC123456'
      },
      care_home: {
        id: 'demo_care_home',
        email: 'admin@carehome.com',
        firstName: 'Care Home',
        lastName: 'Administrator',
        name: 'Care Home Administrator',
        type: 'care_home',
        organizationName: 'Sunshine Care Home'
      }
    }

    localStorage.setItem('neurolog_user', JSON.stringify(demoUsers[userType]))
    router.push('/dashboard')
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
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)'
                }}
              >
                Sign In
              </button>
            </div>
          </form>

          <div style={{ margin: '32px 0', textAlign: 'center' }}>
            <div style={{ 
              height: '1px', 
              background: '#e1e5e9', 
              position: 'relative',
              marginBottom: '16px'
            }}>
              <span style={{
                background: 'white',
                padding: '0 16px',
                color: '#666',
                fontSize: '14px',
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}>
                Or try demo accounts
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <button
              onClick={() => handleDemoLogin('patient')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#005EB8',
                border: '2px solid #005EB8',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Demo Patient Account
            </button>
            <button
              onClick={() => handleDemoLogin('family')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#005EB8',
                border: '2px solid #005EB8',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Demo Family Account
            </button>
            <button
              onClick={() => handleDemoLogin('professional')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#005EB8',
                border: '2px solid #005EB8',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Demo Healthcare Professional
            </button>
            <button
              onClick={() => handleDemoLogin('care_home')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#005EB8',
                border: '2px solid #005EB8',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Demo Care Home
            </button>
          </div>

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