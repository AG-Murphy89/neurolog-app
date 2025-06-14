
import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function DoctorSignup() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gmcNumber: '',
    speciality: '',
    practiceName: '',
    practiceAddress: '',
    phoneNumber: '',
    gdprConsent: false,
    professionalIndemnity: false
  })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const specialities = [
    'Neurology', 'Epileptology', 'Pediatric Neurology', 'General Practice',
    'Emergency Medicine', 'Internal Medicine', 'Psychiatry', 'Other'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!formData.gdprConsent) {
      setMessage('Please accept the privacy policy to continue')
      setIsLoading(false)
      return
    }

    if (!formData.professionalIndemnity) {
      setMessage('Professional indemnity confirmation is required')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            account_type: 'doctor'
          }
        }
      })

      if (error) {
        setMessage(`Registration failed: ${error.message}`)
      } else if (data.user) {
        // Create doctor profile
        const { error: profileError } = await supabase
          .from('doctors')
          .insert([
            {
              id: data.user.id,
              full_name: formData.fullName,
              email: formData.email,
              gmc_number: formData.gmcNumber,
              speciality: formData.speciality,
              practice_name: formData.practiceName,
              practice_address: formData.practiceAddress,
              phone_number: formData.phoneNumber,
              subscription_status: 'trial',
              trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
              verification_status: 'pending'
            }
          ])

        if (profileError) {
          console.error('Profile creation error:', profileError)
          setMessage('Account created but profile setup failed. Please contact support.')
        } else {
          setMessage('Registration successful! Please check your email to verify your account. Your 30-day trial has started.')
        }
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }

    setIsLoading(false)
  }

  return (
    <>
      <Head>
        <title>Doctor Registration - NeuroLog Professional</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)'
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
              ⚕️
            </div>
            <h1 style={{ 
              color: '#003087', 
              fontSize: '32px', 
              fontWeight: 'bold',
              margin: '0 0 12px 0'
            }}>
              Register as Healthcare Provider
            </h1>
            <p style={{ 
              color: '#666', 
              fontSize: '16px',
              margin: '0',
              lineHeight: '1.6'
            }}>
              Join NeuroLog Professional with a 30-day free trial
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  GMC/Professional Number *
                </label>
                <input
                  type="text"
                  value={formData.gmcNumber}
                  onChange={(e) => setFormData({...formData, gmcNumber: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                Professional Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e1e5e9',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  required
                  minLength={8}
                />
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
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Speciality *
                </label>
                <select
                  value={formData.speciality}
                  onChange={(e) => setFormData({...formData, speciality: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">Select speciality</option>
                  {specialities.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                Practice/Hospital Name *
              </label>
              <input
                type="text"
                value={formData.practiceName}
                onChange={(e) => setFormData({...formData, practiceName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e1e5e9',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                Practice Address
              </label>
              <textarea
                value={formData.practiceAddress}
                onChange={(e) => setFormData({...formData, practiceAddress: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e1e5e9',
                  fontSize: '16px',
                  minHeight: '80px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              background: '#f8f9fa',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #e1e5e9',
              marginBottom: '24px'
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
                    I consent to processing my professional data and have read the 
                    <span style={{ color: '#005EB8', fontWeight: '600' }}> Privacy Policy</span>
                    <br/><small style={{ color: '#666' }}>Data is stored securely and GDPR compliant.</small>
                  </span>
                </label>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.professionalIndemnity}
                    onChange={(e) => setFormData({...formData, professionalIndemnity: e.target.checked})}
                    style={{ marginRight: '12px', marginTop: '2px' }}
                    required
                  />
                  <span style={{ fontSize: '15px', color: '#333', lineHeight: '1.5' }}>
                    I confirm I have valid professional indemnity insurance and am authorized to practice medicine *
                  </span>
                </label>
              </div>
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
                boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)',
                marginBottom: '24px'
              }}
            >
              {isLoading ? 'Creating Account...' : 'Start 30-Day Free Trial'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#666', margin: '0 0 16px 0' }}>
              Already have an account?{' '}
              <Link href="/doctor-login" style={{ color: '#005EB8', textDecoration: 'none', fontWeight: '500' }}>
                Sign In
              </Link>
            </p>
            <Link 
              href="/" 
              style={{ 
                color: '#666', 
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              ← Back to main site
            </Link>
          </div>
          
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
        </div>
      </div>
    </>
  )
}
