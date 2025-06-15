
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function CareHomeLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Check if user is care home staff
        const { data: staffData } = await supabase
          .from('care_home_staff')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single()
        
        if (staffData) {
          router.push('/care-home-portal')
        }
      }
    }
    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        setMessage(`Login failed: ${error.message}`)
      } else {
        // Check if user is care home staff
        const { data: staffData, error: staffError } = await supabase
          .from('care_home_staff')
          .select('*')
          .eq('email', data.user.email)
          .eq('is_active', true)
          .single()

        if (staffError || !staffData) {
          setMessage('Access denied. This login is for care home staff only.')
          await supabase.auth.signOut()
        } else {
          setMessage('Login successful!')
          setTimeout(() => router.push('/care-home-portal'), 1500)
        }
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }

    setIsLoading(false)
  }

  const handleDemoLogin = async () => {
    setIsLoading(true)
    try {
      // Demo care home credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'manager@democarehome.com',
        password: 'DemoCareHome123!'
      })

      if (error) {
        setMessage('Demo login failed. Creating demo account...')
        // Create demo care home if doesn't exist
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'manager@democarehome.com',
          password: 'DemoCareHome123!',
          options: {
            data: {
              full_name: 'Demo Care Manager',
              account_type: 'care_home'
            }
          }
        })

        if (!signUpError && signUpData.user) {
          // Create demo care home and staff
          const { data: careHomeData } = await supabase.from('care_homes').insert([{
            name: 'Demo Care Home',
            address: '123 Care Street, Demo City',
            manager_name: 'Demo Care Manager',
            subscription_status: 'trial',
            resident_capacity: 30,
            current_occupancy: 12
          }]).select().single()

          if (careHomeData) {
            await supabase.from('care_home_staff').insert([{
              care_home_id: careHomeData.id,
              employee_id: 'DEMO001',
              full_name: 'Demo Care Manager',
              email: 'manager@democarehome.com',
              role: 'manager',
              employment_start_date: new Date().toISOString().split('T')[0],
              is_active: true
            }])
          }
          setMessage('Demo account created! Please check email to verify.')
        }
      } else {
        router.push('/care-home-portal')
      }
    } catch (error: any) {
      setMessage(`Demo login error: ${error.message}`)
    }
    setIsLoading(false)
  }

  return (
    <>
      <Head>
        <title>Care Home Login - NeuroLog Care</title>
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
              🏠
            </div>
            <h1 style={{ 
              color: '#003087', 
              fontSize: '32px', 
              fontWeight: 'bold',
              margin: '0 0 12px 0'
            }}>
              Care Home Portal
            </h1>
            <p style={{ 
              color: '#666', 
              fontSize: '16px',
              margin: '0',
              lineHeight: '1.6'
            }}>
              Professional care management system for residential facilities
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="email"
                placeholder="Staff email address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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

            <div style={{ marginBottom: '32px' }}>
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                marginBottom: '16px',
                boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)'
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In to Care Portal'}
            </button>

            <button 
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              style={{ 
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#005EB8',
                border: '2px solid #005EB8',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '24px'
              }}
            >
              Try Demo Account
            </button>
          </form>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link 
              href="/care-home-signup" 
              style={{ 
                color: '#005EB8', 
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              New care home? Register here →
            </Link>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #e1e5e9'
          }}>
            <p style={{ color: '#666', margin: '0 0 12px 0', fontSize: '14px' }}>
              Looking for something else?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link 
                href="/" 
                style={{ 
                  color: '#005EB8', 
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                Personal Login
              </Link>
              <span style={{ color: '#ddd' }}>|</span>
              <Link 
                href="/doctor-login" 
                style={{ 
                  color: '#005EB8', 
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                Doctor Portal
              </Link>
            </div>
          </div>
          
          {message && (
            <div style={{ 
              marginTop: '24px', 
              padding: '18px', 
              backgroundColor: message.includes('failed') || message.includes('denied') || message.includes('Error') ? '#fee' : '#efe',
              color: message.includes('failed') || message.includes('denied') || message.includes('Error') ? '#c33' : '#363',
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
