
import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  userType: 'patient' | 'family' | 'home_carer' | 'care_home' | 'professional'
  organizationName?: string
  professionalId?: string
  gdprConsent: boolean
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: 'patient',
    organizationName: '',
    professionalId: '',
    gdprConsent: false
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: {[key: string]: string} = {}

    // Validation
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.firstName) newErrors.firstName = 'First name is required'
    if (!formData.lastName) newErrors.lastName = 'Last name is required'
    if (!formData.gdprConsent) newErrors.gdprConsent = 'You must accept the privacy policy'
    
    if ((formData.userType === 'care_home' || formData.userType === 'professional') && !formData.organizationName) {
      newErrors.organizationName = 'Organization name is required'
    }
    
    if (formData.userType === 'professional' && !formData.professionalId) {
      newErrors.professionalId = 'Professional ID is required'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      // Create user account
      const userId = `user_${Date.now()}`
      const userData = {
        id: userId,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        type: formData.userType,
        organizationName: formData.organizationName,
        professionalId: formData.professionalId,
        createdAt: new Date().toISOString()
      }

      // Store user data (in real app, this would be sent to backend)
      localStorage.setItem('neurolog_user', JSON.stringify(userData))
      localStorage.setItem(`neurolog_account_${formData.email}`, JSON.stringify({
        ...userData,
        password: formData.password // In real app, password would be hashed
      }))

      // Redirect to dashboard
      router.push('/dashboard')
    }
  }

  return (
    <>
      <Head>
        <title>Register - NeuroLog</title>
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
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ 
              color: '#003087', 
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              Register Account
            </h1>
            <p style={{ color: '#666', margin: 0 }}>Join NeuroLog to start tracking seizures</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: errors.firstName ? '2px solid #ff4757' : '2px solid #e1e5e9',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.firstName && <div style={{ color: '#ff4757', fontSize: '14px', marginTop: '4px' }}>{errors.firstName}</div>}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: errors.lastName ? '2px solid #ff4757' : '2px solid #e1e5e9',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.lastName && <div style={{ color: '#ff4757', fontSize: '14px', marginTop: '4px' }}>{errors.lastName}</div>}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Email Address *
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
                  Account Type *
                </label>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: '#003087', margin: '0 0 8px 0', fontSize: '16px' }}>Individual/Family Care</h4>
                  <select
                    value={formData.userType === 'patient' || formData.userType === 'family' || formData.userType === 'home_carer' ? formData.userType : ''}
                    onChange={(e) => setFormData({...formData, userType: e.target.value as any})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select individual/family type</option>
                    <option value="patient">Patient</option>
                    <option value="family">Family Member</option>
                    <option value="home_carer">Home Carer</option>
                  </select>
                </div>
                <div>
                  <h4 style={{ color: '#003087', margin: '0 0 8px 0', fontSize: '16px' }}>Professional/Care Home</h4>
                  <select
                    value={formData.userType === 'care_home' || formData.userType === 'professional' ? formData.userType : ''}
                    onChange={(e) => setFormData({...formData, userType: e.target.value as any})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select professional type</option>
                    <option value="care_home">Care Home</option>
                    <option value="professional">Healthcare Professional</option>
                  </select>
                </div>
              </div>

              {(formData.userType === 'care_home' || formData.userType === 'professional') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: errors.organizationName ? '2px solid #ff4757' : '2px solid #e1e5e9',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.organizationName && <div style={{ color: '#ff4757', fontSize: '14px', marginTop: '4px' }}>{errors.organizationName}</div>}
                </div>
              )}

              {formData.userType === 'professional' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Professional ID/Registration Number *
                  </label>
                  <input
                    type="text"
                    value={formData.professionalId}
                    onChange={(e) => setFormData({...formData, professionalId: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: errors.professionalId ? '2px solid #ff4757' : '2px solid #e1e5e9',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.professionalId && <div style={{ color: '#ff4757', fontSize: '14px', marginTop: '4px' }}>{errors.professionalId}</div>}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Password *
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

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: errors.confirmPassword ? '2px solid #ff4757' : '2px solid #e1e5e9',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.confirmPassword && <div style={{ color: '#ff4757', fontSize: '14px', marginTop: '4px' }}>{errors.confirmPassword}</div>}
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e1e5e9'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="gdprConsent"
                    checked={formData.gdprConsent}
                    onChange={(e) => setFormData({...formData, gdprConsent: e.target.checked})}
                    style={{ marginTop: '2px' }}
                  />
                  <label htmlFor="gdprConsent" style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
                    I agree to the <strong>Privacy Policy</strong> and consent to the processing of my personal data in accordance with GDPR regulations. 
                    I understand my data will be used for seizure tracking and healthcare management purposes only. *
                  </label>
                </div>
                {errors.gdprConsent && <div style={{ color: '#ff4757', fontSize: '14px', marginTop: '8px' }}>{errors.gdprConsent}</div>}
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
                Register Account
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ color: '#666', margin: 0 }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: '#005EB8', textDecoration: 'none', fontWeight: '500' }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
