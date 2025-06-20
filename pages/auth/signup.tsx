
import React from 'react'
import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  userType: 'patient' | 'family' | 'home_carer'
  gdprConsent: boolean
  // Patient Information
  address: string
  gpSurgery: string
  gpAddress: string
  nhsNumber: string
  contactDetails: string
  // Next of Kin
  nokName: string
  nokRelationship: string
  nokAddress: string
  nokContact: string
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: 'patient',
    gdprConsent: false,
    address: '',
    gpSurgery: '',
    gpAddress: '',
    nhsNumber: '',
    contactDetails: '',
    nokName: '',
    nokRelationship: '',
    nokAddress: '',
    nokContact: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: {[key: string]: string} = {}

    // Validate required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    if (!formData.userType) newErrors.userType = 'Please select an account type'
    if (!formData.gdprConsent) newErrors.gdprConsent = 'GDPR consent is required'

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true)
      try {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: `${formData.firstName} ${formData.lastName}`,
              first_name: formData.firstName,
              last_name: formData.lastName,
              account_type: formData.userType
            }
          }
        })

        if (error) {
          setErrors({ email: error.message })
        } else {
          // Create user profile with extended information
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
              id: data.user?.id,
              full_name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              account_type: formData.userType,
              address: formData.address,
              gp_surgery: formData.gpSurgery,
              gp_address: formData.gpAddress,
              nhs_number: formData.nhsNumber,
              contact_details: formData.contactDetails,
              nok_name: formData.nokName,
              nok_relationship: formData.nokRelationship,
              nok_address: formData.nokAddress,
              nok_contact: formData.nokContact,
              created_at: new Date().toISOString()
            }])

          if (profileError) {
            console.error('Error creating profile:', profileError)
          }

          setMessage('Registration successful! Please check your email to verify your account.')
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        }
      } catch (error: any) {
        setErrors({ email: 'Registration failed. Please try again.' })
      } finally {
        setIsLoading(false)
      }
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
          maxWidth: '600px',
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
              {/* Basic Information */}
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

              {/* Next of Kin Section */}
              <div style={{
                background: '#fff3cd',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #ffeaa7'
              }}>
                <h3 style={{ 
                  color: '#856404', 
                  margin: '0 0 20px 0',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  Next of Kin Information
                </h3>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.nokName}
                        onChange={(e) => setFormData({...formData, nokName: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e5e9',
                          fontSize: '16px',
                          boxSizing: 'border-box'
                        }}
                        placeholder="Next of kin full name"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={formData.nokRelationship}
                        onChange={(e) => setFormData({...formData, nokRelationship: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e5e9',
                          fontSize: '16px',
                          boxSizing: 'border-box'
                        }}
                        placeholder="e.g., Mother, Father, Spouse"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Address
                    </label>
                    <textarea
                      value={formData.nokAddress}
                      onChange={(e) => setFormData({...formData, nokAddress: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e1e5e9',
                        fontSize: '16px',
                        minHeight: '80px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Next of kin address"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Contact Details
                    </label>
                    <input
                      type="text"
                      value={formData.nokContact}
                      onChange={(e) => setFormData({...formData, nokContact: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e1e5e9',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Phone number and/or email"
                    />
                  </div>
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
                <select
                  value={formData.userType}
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
                  <option value="">Select account type</option>
                  <option value="patient">Patient</option>
                  <option value="family">Family Member</option>
                  <option value="home_carer">Home Carer</option>
                </select>
                {errors.userType && <div style={{ color: '#ff4757', fontSize: '14px', marginTop: '4px' }}>{errors.userType}</div>}
              </div>

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
                {isLoading ? 'Creating Account...' : 'Register Account'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ color: '#666', margin: '0 0 16px 0' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: '#005EB8', textDecoration: 'none', fontWeight: '500' }}>
                Sign In
              </Link>
            </p>
            <div style={{ 
              padding: '16px', 
              background: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #e1e5e9'
            }}>
              <p style={{ color: '#666', margin: '0 0 12px 0', fontSize: '14px' }}>
                Healthcare Professional?
              </p>
              <Link 
                href="/doctor-portal" 
                style={{ 
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🏥 Access Doctor Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
