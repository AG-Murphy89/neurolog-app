
import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function CareHomeSignup() {
  const [formData, setFormData] = useState({
    careHomeName: '',
    address: '',
    managerName: '',
    managerEmail: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    cqcNumber: '',
    residentCapacity: 20,
    subscriptionPlan: 'standard' as 'standard' | 'premium' | 'enterprise',
    billingContact: '',
    gdprConsent: false,
    cqcCompliance: false
  })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const subscriptionPlans = [
    { value: 'standard', label: 'Standard - £150/month (up to 30 residents)', residents: 30 },
    { value: 'premium', label: 'Premium - £250/month (up to 60 residents)', residents: 60 },
    { value: 'enterprise', label: 'Enterprise - £400/month (unlimited residents)', residents: 999 }
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

    if (!formData.cqcCompliance) {
      setMessage('CQC compliance confirmation is required')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.managerEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.managerName,
            account_type: 'care_home'
          }
        }
      })

      if (error) {
        setMessage(`Registration failed: ${error.message}`)
      } else if (data.user) {
        // Create care home
        const { data: careHomeData, error: careHomeError } = await supabase
          .from('care_homes')
          .insert([
            {
              name: formData.careHomeName,
              address: formData.address,
              phone_number: formData.phoneNumber,
              email: formData.managerEmail,
              cqc_registration_number: formData.cqcNumber,
              manager_name: formData.managerName,
              subscription_plan: formData.subscriptionPlan,
              resident_capacity: formData.residentCapacity,
              billing_contact: formData.billingContact || formData.managerEmail,
              subscription_status: 'trial',
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days trial
            }
          ])
          .select()
          .single()

        if (careHomeError) {
          console.error('Care home creation error:', careHomeError)
          setMessage('Account created but care home setup failed. Please contact support.')
        } else {
          // Create manager staff record
          const { error: staffError } = await supabase
            .from('care_home_staff')
            .insert([
              {
                care_home_id: careHomeData.id,
                employee_id: 'MGR001',
                full_name: formData.managerName,
                email: formData.managerEmail,
                role: 'manager',
                employment_start_date: new Date().toISOString().split('T')[0],
                is_active: true,
                can_administer_medication: true,
                competency_level: 100
              }
            ])

          if (staffError) {
            console.error('Staff creation error:', staffError)
          }

          setMessage('Registration successful! Please check your email to verify your account. Your 14-day trial has started.')
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
        <title>Care Home Registration - NeuroLog Care</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          maxWidth: '700px',
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
              🏠
            </div>
            <h1 style={{ 
              color: '#003087', 
              fontSize: '32px', 
              fontWeight: 'bold',
              margin: '0 0 12px 0'
            }}>
              Register Care Home
            </h1>
            <p style={{ 
              color: '#666', 
              fontSize: '16px',
              margin: '0',
              lineHeight: '1.6'
            }}>
              Join NeuroLog Care with a 14-day free trial
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ color: '#003087', marginBottom: '20px', fontSize: '20px' }}>Care Home Information</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Care Home Name *
                </label>
                <input
                  type="text"
                  value={formData.careHomeName}
                  onChange={(e) => setFormData({...formData, careHomeName: e.target.value})}
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    CQC Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.cqcNumber}
                    onChange={(e) => setFormData({...formData, cqcNumber: e.target.value})}
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
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ color: '#003087', marginBottom: '20px', fontSize: '20px' }}>Manager Information</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Manager Name *
                  </label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({...formData, managerName: e.target.value})}
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
                    Manager Email *
                  </label>
                  <input
                    type="email"
                    value={formData.managerEmail}
                    onChange={(e) => setFormData({...formData, managerEmail: e.target.value})}
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
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ color: '#003087', marginBottom: '20px', fontSize: '20px' }}>Subscription Plan</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Select Plan *
                </label>
                <select
                  value={formData.subscriptionPlan}
                  onChange={(e) => setFormData({...formData, subscriptionPlan: e.target.value as any})}
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
                  {subscriptionPlans.map(plan => (
                    <option key={plan.value} value={plan.value}>{plan.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Resident Capacity *
                  </label>
                  <input
                    type="number"
                    value={formData.residentCapacity}
                    onChange={(e) => setFormData({...formData, residentCapacity: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    min="1"
                    max="200"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Billing Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.billingContact}
                    onChange={(e) => setFormData({...formData, billingContact: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Leave blank to use manager email"
                  />
                </div>
              </div>
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
                    I consent to processing resident data and have read the 
                    <span style={{ color: '#005EB8', fontWeight: '600' }}> Privacy Policy</span>
                    <br/><small style={{ color: '#666' }}>Data is stored securely and GDPR compliant.</small>
                  </span>
                </label>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.cqcCompliance}
                    onChange={(e) => setFormData({...formData, cqcCompliance: e.target.checked})}
                    style={{ marginRight: '12px', marginTop: '2px' }}
                    required
                  />
                  <span style={{ fontSize: '15px', color: '#333', lineHeight: '1.5' }}>
                    I confirm this care home is CQC registered and compliant with all regulations *
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
              {isLoading ? 'Creating Account...' : 'Start 14-Day Free Trial'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#666', margin: '0 0 16px 0' }}>
              Already have an account?{' '}
              <Link href="/care-home-login" style={{ color: '#005EB8', textDecoration: 'none', fontWeight: '500' }}>
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
